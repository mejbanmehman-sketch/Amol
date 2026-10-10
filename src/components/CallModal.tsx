import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  MessageSquare,
  Send,
  User as UserIcon,
  CheckCircle,
  Activity,
  AlertCircle
} from 'lucide-react';
import { CallSession, User } from '../types';
import { formatBanglaNumber } from '../utils/scoring';
import {
  getIceServers,
  createCallSession,
  answerCallSession,
  endCallSession,
  addIceCandidate,
  listenToRemoteIceCandidates,
  listenToCallSession,
  callSounds
} from '../services/webrtcService';

interface CallModalProps {
  session: CallSession;
  currentUser: User | null;
  onEndCall: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({ session, currentUser, onEndCall }) => {
  const isCaller = session.caller.id === (currentUser?.id || 'current-user');
  const targetUser = isCaller ? session.receiver : session.caller;

  const [callStatus, setCallStatus] = useState<
    'calling' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'declined' | 'failed'
  >(isCaller ? 'calling' : 'connecting');

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(session.type === 'video');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [showInCallChat, setShowInCallChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [voiceVolume, setVoiceVolume] = useState<number>(0);
  const [remoteHasVideo, setRemoteHasVideo] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [inCallMessages, setInCallMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: targetUser.name, text: 'আসসালামু আলাইকুম ওয়ারাহমাতুল্লাহ্', time: 'এখন' }
  ]);

  // Video and Audio DOM Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // WebRTC Connection & Stream Refs
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  const hasSetRemoteDescription = useRef<boolean>(false);
  const activeCallIdRef = useRef<string>(session.id);

  // Audio waveform analysis refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Call duration timer (only runs when connected)
  useEffect(() => {
    let interval: any = null;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callStatus]);

  // Core WebRTC Lifecycle
  useEffect(() => {
    let isCancelled = false;
    let unsubCallDoc: (() => void) | null = null;
    let unsubRemoteCandidates: (() => void) | null = null;

    async function initWebRTC() {
      try {
        setPermissionError(null);

        // 1. Get user media (microphone + optional camera)
        const constraints: MediaStreamConstraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: session.type === 'video' ? { facingMode: 'user' } : false
        };

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (mediaErr: any) {
          console.warn('getUserMedia initial error, attempting fallback:', mediaErr);
          // If video failed (e.g. no camera), try audio-only fallback
          if (session.type === 'video') {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setIsVideoOn(false);
          } else {
            throw mediaErr;
          }
        }

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current && session.type === 'video') {
          localVideoRef.current.srcObject = stream;
        }

        // Voice level visualizer for speaking pulse
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const actx = new AudioCtx();
            audioContextRef.current = actx;
            const src = actx.createMediaStreamSource(stream);
            const analyser = actx.createAnalyser();
            analyser.fftSize = 256;
            src.connect(analyser);
            analyserRef.current = analyser;

            const buf = new Uint8Array(analyser.frequencyBinCount);
            const checkVol = () => {
              if (!analyserRef.current) return;
              analyserRef.current.getByteFrequencyData(buf);
              let sum = 0;
              for (let i = 0; i < buf.length; i++) sum += buf[i];
              const avg = sum / buf.length;
              setVoiceVolume(Math.min(100, Math.round((avg / 128) * 100)));
              animFrameRef.current = requestAnimationFrame(checkVol);
            };
            checkVol();
          }
        } catch (audioErr) {
          console.warn('Audio level analyser could not be initialized:', audioErr);
        }

        // 2. Fetch ICE Servers from secure backend API (STUN + Metered TURN UDP/TCP/TLS)
        const iceServers = await getIceServers();
        const pc = new RTCPeerConnection({
          iceServers,
          iceCandidatePoolSize: 10
        });
        pcRef.current = pc;

        // Remote Media Stream setup
        const remoteStream = new MediaStream();
        remoteStreamRef.current = remoteStream;

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
        }

        // Add local tracks to PeerConnection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Remote track received handler
        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            event.streams[0].getTracks().forEach((track) => {
              remoteStream.addTrack(track);
              if (track.kind === 'video') {
                setRemoteHasVideo(true);
              }
            });
          } else if (event.track) {
            remoteStream.addTrack(event.track);
            if (event.track.kind === 'video') {
              setRemoteHasVideo(true);
            }
          }

          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
          }
        };

        // ICE Candidate generated locally -> push to Firestore
        pc.onicecandidate = (event) => {
          if (event.candidate && activeCallIdRef.current) {
            addIceCandidate(
              activeCallIdRef.current,
              isCaller ? 'caller' : 'receiver',
              event.candidate
            );
          }
        };

        // Connection State Changes
        pc.onconnectionstatechange = () => {
          const state = pc.connectionState;
          if (state === 'connected') {
            callSounds.stop();
            setCallStatus('connected');
          } else if (state === 'disconnected' || state === 'failed') {
            callSounds.stop();
            setCallStatus('ended');
            setTimeout(() => onEndCall(), 1200);
          }
        };

        pc.oniceconnectionstatechange = () => {
          const iceState = pc.iceConnectionState;
          if (iceState === 'connected' || iceState === 'completed') {
            callSounds.stop();
            setCallStatus('connected');
          } else if (iceState === 'failed') {
            console.warn('ICE connection failed, checking for TURN credentials...');
          }
        };

        // 3. CALLER FLOW vs RECEIVER FLOW
        if (isCaller) {
          // Play realistic outgoing dial tone
          callSounds.startOutgoingDialTone();
          setCallStatus('ringing');

          // Generate SDP Offer
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: session.type === 'video'
          });
          await pc.setLocalDescription(offer);

          // Create document in Firestore
          const createRes = await createCallSession(
            currentUser || ({ id: 'current-user', name: 'মুহাম্মাদ আব্দুল্লাহ' } as User),
            session.receiver,
            session.type,
            offer,
            session.id
          );

          if (!createRes.success) {
            activeCallIdRef.current = '';
            setPermissionError(createRes.error || 'কল শুরু করতে সমস্যা হয়েছে');
            callSounds.stop();
            setCallStatus('failed');
            return;
          }

          const callId = createRes.callId;
          activeCallIdRef.current = callId;

          // Listen to call document in Firestore for receiver's answer or status changes
          unsubCallDoc = listenToCallSession(callId, async (data) => {
            if (!data) return;

            if (data.status === 'declined') {
              callSounds.stop();
              setCallStatus('declined');
              setTimeout(() => onEndCall(), 1500);
              return;
            }

            if (data.status === 'ended') {
              callSounds.stop();
              setCallStatus('ended');
              setTimeout(() => onEndCall(), 800);
              return;
            }

            // When receiver answers with SDP Answer
            if (data.answer && !hasSetRemoteDescription.current && pc.signalingState !== 'closed') {
              hasSetRemoteDescription.current = true;
              callSounds.stop();
              const remoteDesc = new RTCSessionDescription(data.answer);
              await pc.setRemoteDescription(remoteDesc);
              setCallStatus('connected');

              // Flush any queued ICE candidates
              while (iceCandidatesQueue.current.length > 0) {
                const cand = iceCandidatesQueue.current.shift();
                if (cand) {
                  try {
                    await pc.addIceCandidate(new RTCIceCandidate(cand));
                  } catch (e) {
                    console.warn('Queued candidate error:', e);
                  }
                }
              }
            }
          });

          // Listen to receiver's ICE candidates
          unsubRemoteCandidates = listenToRemoteIceCandidates(callId, 'receiver', async (cand) => {
            try {
              if (hasSetRemoteDescription.current && pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              } else {
                iceCandidatesQueue.current.push(cand);
              }
            } catch (err) {
              console.warn('Error adding receiver ICE candidate:', err);
            }
          });
        } else {
          // RECEIVER FLOW (Call was accepted in UI)
          setCallStatus('connecting');
          const callId = session.id;
          activeCallIdRef.current = callId;

          if (session.offer) {
            const remoteOffer = new RTCSessionDescription(session.offer);
            await pc.setRemoteDescription(remoteOffer);
            hasSetRemoteDescription.current = true;

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await answerCallSession(callId, answer);
            setCallStatus('connected');

            // Flush any queued candidates
            while (iceCandidatesQueue.current.length > 0) {
              const cand = iceCandidatesQueue.current.shift();
              if (cand) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(cand));
                } catch (e) {
                  console.warn('Queued candidate error:', e);
                }
              }
            }
          }

          // Listen to caller's ICE candidates
          unsubRemoteCandidates = listenToRemoteIceCandidates(callId, 'caller', async (cand) => {
            try {
              if (hasSetRemoteDescription.current && pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              } else {
                iceCandidatesQueue.current.push(cand);
              }
            } catch (err) {
              console.warn('Error adding caller ICE candidate:', err);
            }
          });

          // Listen to call doc for end status
          unsubCallDoc = listenToCallSession(callId, (data) => {
            if (data?.status === 'ended') {
              callSounds.stop();
              setCallStatus('ended');
              setTimeout(() => onEndCall(), 800);
            }
          });
        }
      } catch (err: any) {
        console.error('WebRTC initialization failed:', err);
        setPermissionError('ক্যামেরা বা মাইক্রোফোন ব্যবহারের অনুমতি দিন');
        callSounds.stop();
        setCallStatus('failed');
      }
    }

    initWebRTC();

    return () => {
      isCancelled = true;
      callSounds.stop();

      if (unsubCallDoc) unsubCallDoc();
      if (unsubRemoteCandidates) unsubRemoteCandidates();

      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch {}
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach((track) => track.stop());
        remoteStreamRef.current = null;
      }
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [session.id, isCaller, session.type]);

  // Toggle Microphone Mute/Unmute
  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted; // inverted because state is about to toggle
      });
    }
    setIsMuted(!isMuted);
  };

  // Toggle Video Camera On/Off
  const toggleVideo = async () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks.forEach((track) => {
          track.enabled = !isVideoOn;
        });
        setIsVideoOn(!isVideoOn);
      } else {
        // If no video track exists, request camera track and add to PeerConnection
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' }
          });
          const newTrack = newStream.getVideoTracks()[0];
          if (newTrack) {
            localStreamRef.current.addTrack(newTrack);
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = localStreamRef.current;
            }
            if (pcRef.current) {
              pcRef.current.addTrack(newTrack, localStreamRef.current);
            }
            setIsVideoOn(true);
          }
        } catch {
          setPermissionError('ক্যামেরা চালু করা সম্ভব হয়নি');
        }
      }
    } else {
      setIsVideoOn(!isVideoOn);
    }
  };

  // Switch Front / Back Camera (seamless WebRTC track replacement)
  const switchCamera = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);

    try {
      let newStream: MediaStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: nextMode } }
        });
      } catch {
        // Fallback if exact facing mode is not supported on this device
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: nextMode }
        });
      }

      const newVideoTrack = newStream.getVideoTracks()[0];
      if (newVideoTrack && pcRef.current) {
        const senders = pcRef.current.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(newVideoTrack);
        }

        if (localStreamRef.current) {
          const oldTrack = localStreamRef.current.getVideoTracks()[0];
          if (oldTrack) {
            oldTrack.stop();
            localStreamRef.current.removeTrack(oldTrack);
          }
          localStreamRef.current.addTrack(newVideoTrack);
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      }
    } catch (err) {
      console.warn('Camera switch error:', err);
    }
  };

  // End Call Button Handler
  const handleEndCall = async () => {
    callSounds.stop();
    setCallStatus('ended');

    if (activeCallIdRef.current) {
      const callIdToEnd = activeCallIdRef.current;
      activeCallIdRef.current = '';
      await endCallSession(callIdToEnd, callDuration, 'hangup');
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    setTimeout(() => {
      onEndCall();
    }, 400);
  };

  // Send In-Call Message
  const handleSendInCallMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const now = new Date();
    const timeStr = `${formatBanglaNumber(now.getHours() % 12 || 12)}:${formatBanglaNumber(
      String(now.getMinutes()).padStart(2, '0')
    )}`;
    setInCallMessages((prev) => [
      ...prev,
      { sender: currentUser?.name || 'আপনি', text: chatInput.trim(), time: timeStr }
    ]);
    setChatInput('');
  };

  // Format Duration into Bangla MM:SS
  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${formatBanglaNumber(String(mins).padStart(2, '0'))}:${formatBanglaNumber(
      String(secs).padStart(2, '0')
    )}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-2xl font-bangla text-white select-none overflow-hidden animate-fadeIn">
      {/* Hidden Audio element for remote audio stream playback */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Main Call Frame */}
      <div
        className={`relative w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-2xl bg-[#06101e] sm:rounded-3xl border border-[#D4AF37]/40 shadow-2xl flex flex-col justify-between overflow-hidden transition-all ${
          isFullscreen ? 'sm:max-w-full sm:h-full sm:rounded-none' : ''
        }`}
      >
        {/* Top Header */}
        <div className="z-30 flex items-center justify-between p-4 sm:p-5 bg-gradient-to-b from-black/90 via-black/60 to-transparent">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-amber-600 p-0.5 flex items-center justify-center shadow-md">
                <div className="w-full h-full bg-[#060e1b] rounded-[14px] flex items-center justify-center font-bold text-sm text-[#D4AF37]">
                  {targetUser.avatar ? (
                    <img
                      src={targetUser.avatar}
                      alt={targetUser.name}
                      className="w-full h-full object-cover rounded-[14px]"
                    />
                  ) : (
                    targetUser.name.charAt(0)
                  )}
                </div>
              </div>
              <span
                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#06101e] ${
                  callStatus === 'connected'
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-amber-400 animate-ping'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[#D4AF37] leading-none">
                  {targetUser.name}
                </h3>
                {targetUser.role === 'admin' && (
                  <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold border border-[#D4AF37]/40">
                    পরিচালক
                  </span>
                )}
              </div>

              <p className="text-xs text-white/70 mt-1 flex items-center gap-1.5 font-mono">
                {callStatus === 'ringing' || callStatus === 'calling' || callStatus === 'connecting' ? (
                  <span className="text-amber-300 font-semibold animate-pulse flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 animate-spin" />
                    <span>
                      {callStatus === 'calling'
                        ? 'কল যাচ্ছে...'
                        : callStatus === 'ringing'
                        ? 'রিং হচ্ছে (উত্তর অপেক্ষমান)...'
                        : 'সংযোগ তৈরি হচ্ছে...'}
                    </span>
                  </span>
                ) : callStatus === 'declined' ? (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>কল প্রত্যাখ্যাত হয়েছে</span>
                  </span>
                ) : callStatus === 'ended' ? (
                  <span className="text-slate-400 font-bold flex items-center gap-1">
                    <span>কল সমাপ্ত হয়েছে</span>
                  </span>
                ) : (
                  <span className="text-emerald-300 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>
                      {session.type === 'video' ? 'এইচডি ভিডিও কল' : 'এইচডি অডিও কল'} •{' '}
                      {formatDuration(callDuration)}
                    </span>
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInCallChat(!showInCallChat)}
              className={`p-2.5 rounded-2xl border transition-all ${
                showInCallChat
                  ? 'bg-[#D4AF37] text-[#0a1628] border-[#D4AF37]'
                  : 'bg-white/10 text-white/80 border-white/10 hover:bg-white/20'
              }`}
              title="কলের ভেতর চ্যাট"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white/80 transition-all hidden sm:block"
              title="ফুলস্ক্রিন মোড"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Center Stage: Real WebRTC Video Stream or Animated Audio Visualizer */}
        <div className="relative flex-1 flex items-center justify-center min-h-[350px] sm:min-h-[440px] bg-radial from-[#132746] to-[#040914] overflow-hidden">
          {session.type === 'video' ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              {/* Remote Video Stream Stage */}
              <div className="w-full h-full flex items-center justify-center relative bg-gradient-to-b from-[#0a182d] to-[#040810]">
                {/* Real Remote Video Element */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    remoteHasVideo && callStatus === 'connected' ? 'opacity-100' : 'opacity-0 absolute'
                  }`}
                />

                {/* If remote video is not connected yet or camera off, show remote placeholder card */}
                {(!remoteHasVideo || callStatus !== 'connected') && (
                  <div
                    className={`relative rounded-3xl overflow-hidden transition-all duration-300 ${
                      voiceVolume > 15
                        ? 'ring-4 ring-emerald-400 shadow-[0_0_60px_rgba(52,211,153,0.5)] scale-105'
                        : 'ring-2 ring-[#D4AF37]/60 shadow-[0_0_40px_rgba(212,175,55,0.3)]'
                    }`}
                  >
                    <div className="w-44 h-44 sm:w-56 sm:h-56 bg-slate-900 flex items-center justify-center overflow-hidden">
                      {targetUser.avatar ? (
                        <img
                          src={targetUser.avatar}
                          alt={targetUser.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#0e223d] to-[#06101e] flex flex-col items-center justify-center p-4 text-center">
                          <div className="w-20 h-20 rounded-full bg-[#D4AF37] text-[#06101e] flex items-center justify-center text-3xl font-black mb-2 shadow-xl">
                            {targetUser.name.charAt(0)}
                          </div>
                          <h4 className="text-sm font-bold text-white truncate max-w-[150px]">
                            {targetUser.name}
                          </h4>
                          <span className="text-[10px] text-emerald-400 font-semibold mt-1">
                            {callStatus === 'connected'
                              ? 'ক্যামেরা সংযোগ সক্রিয়'
                              : 'সংযোগ প্রক্রিয়াধীন...'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Status pill over video */}
                <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      callStatus === 'connected'
                        ? 'bg-emerald-400 animate-ping'
                        : 'bg-amber-400 animate-pulse'
                    }`}
                  />
                  <span className="text-[11px] text-white/80 font-mono">
                    {callStatus === 'connected'
                      ? 'দ্বিপাক্ষিক WebRTC সংযোগ সক্রিয়'
                      : 'সংযোগ স্থাপন প্রক্রিয়াধীন...'}
                  </span>
                </div>
              </div>

              {/* Local Camera Stream (Picture-in-Picture) */}
              <div className="absolute top-4 right-4 w-32 h-44 sm:w-40 sm:h-52 rounded-2xl border-2 border-[#D4AF37] bg-black overflow-hidden shadow-2xl z-30">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${
                    facingMode === 'user' ? '-scale-x-100' : ''
                  }`}
                />
                <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded-lg text-[10px] text-white font-medium flex items-center gap-1 backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>আপনি</span>
                </div>
              </div>
            </div>
          ) : (
            /* Audio Call / Voice Stage */
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-6">
              {/* Pulsing Voice Avatar */}
              <div className="relative flex items-center justify-center">
                <div
                  className="absolute rounded-full bg-[#D4AF37]/15 transition-all duration-300"
                  style={{
                    width: `${160 + voiceVolume * 1.2}px`,
                    height: `${160 + voiceVolume * 1.2}px`
                  }}
                />
                <div className="absolute w-44 h-44 rounded-full bg-[#D4AF37]/10 animate-ping" />

                <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr from-[#D4AF37] to-amber-600 p-1 shadow-[0_0_50px_rgba(212,175,55,0.4)] flex items-center justify-center overflow-hidden">
                  {targetUser.avatar ? (
                    <img
                      src={targetUser.avatar}
                      alt={targetUser.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#071326] rounded-full flex items-center justify-center text-4xl font-bold text-[#D4AF37]">
                      {targetUser.name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Sound Waveform */}
              <div className="flex items-center gap-1.5 h-10">
                {[12, 28, 16, 36, 22, 32, 14, 30, 24, 12, 26, 18].map((baseHeight, i) => {
                  const dynamicHeight =
                    callStatus === 'connected'
                      ? Math.max(6, (baseHeight * (voiceVolume + 20)) / 40)
                      : 4;
                  return (
                    <span
                      key={i}
                      className="w-1.5 bg-gradient-to-t from-amber-500 to-[#D4AF37] rounded-full transition-all duration-150"
                      style={{
                        height: `${Math.min(38, dynamicHeight)}px`
                      }}
                    />
                  );
                })}
              </div>

              <div>
                <h4 className="text-lg sm:text-xl font-bold text-white">{targetUser.name}</h4>
                <p className="text-xs text-white/60 mt-0.5 font-mono">
                  {callStatus === 'connected'
                    ? 'দ্বীনি ভয়েস কল সংযোগ সক্রিয় • এন্ড-টু-এন্ড এনক্রিপ্টেড'
                    : 'সংযোগ স্থাপন চলছে...'}
                </p>
              </div>

              {permissionError && (
                <div className="px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30 text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-300" />
                  <span>{permissionError}</span>
                </div>
              )}
            </div>
          )}

          {/* In-Call Instant Chat Drawer Overlay */}
          {showInCallChat && (
            <div className="absolute inset-y-0 right-0 w-full sm:w-80 bg-black/95 backdrop-blur-2xl border-l border-white/10 z-40 flex flex-col justify-between p-4 shadow-2xl animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold text-[#D4AF37] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>কলের ভেতর বার্তা</span>
                </span>
                <button
                  onClick={() => setShowInCallChat(false)}
                  className="text-white/60 hover:text-white text-xs px-2 py-1 bg-white/10 rounded-lg"
                >
                  ✕ বন্ধ করুন
                </button>
              </div>

              {/* Messages stream */}
              <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
                {inCallMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-2xl text-xs max-w-[85%] ${
                      msg.sender === (currentUser?.name || 'আপনি')
                        ? 'ml-auto bg-[#D4AF37] text-[#0a1628] font-semibold'
                        : 'bg-white/10 text-white border border-white/10'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span className="text-[9px] opacity-70 block text-right mt-1">{msg.time}</span>
                  </div>
                ))}
              </div>

              {/* In-Call Input */}
              <form onSubmit={handleSendInCallMessage} className="flex gap-2 pt-2 border-t border-white/10">
                <input
                  type="text"
                  placeholder="বার্তা লিখুন..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
                <button
                  type="submit"
                  className="p-2 bg-[#D4AF37] text-[#0a1628] rounded-xl hover:brightness-110 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Call Control Action Dock */}
        <div className="z-30 p-5 sm:p-6 bg-gradient-to-t from-black/95 via-black/85 to-transparent flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-3 sm:gap-5 flex-wrap">
            {/* Mic Toggle */}
            <button
              type="button"
              onClick={toggleMute}
              className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-400 border-2 border-rose-500/60'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
              }`}
              title={isMuted ? 'মাইক্রোফোন চালু করুন' : 'মাইক্রোফোন মিউট করুন'}
            >
              {isMuted ? (
                <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>

            {/* Video Camera Toggle */}
            <button
              type="button"
              onClick={toggleVideo}
              className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                !isVideoOn
                  ? 'bg-white/10 hover:bg-white/20 text-white/60 border border-white/15'
                  : 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-500/60'
              }`}
              title={isVideoOn ? 'ক্যামেরা বন্ধ করুন' : 'ক্যামেরা চালু করুন'}
            >
              {isVideoOn ? (
                <Video className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>

            {/* Switch Camera */}
            {session.type === 'video' && isVideoOn && (
              <button
                type="button"
                onClick={switchCamera}
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center justify-center transition-all shadow-lg active:scale-95"
                title="সামনে/পেছনের ক্যামেরা পরিবর্তন করুন"
              >
                <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}

            {/* Speaker Toggle */}
            <button
              type="button"
              onClick={() => {
                if (remoteAudioRef.current) {
                  remoteAudioRef.current.muted = isSpeakerOn;
                }
                setIsSpeakerOn(!isSpeakerOn);
              }}
              className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                !isSpeakerOn
                  ? 'bg-white/10 text-white/50 border border-white/10'
                  : 'bg-[#D4AF37]/20 text-[#D4AF37] border-2 border-[#D4AF37]/50'
              }`}
              title={isSpeakerOn ? 'স্পিকার বন্ধ করুন' : 'লাউড স্পিকার চালু করুন'}
            >
              {isSpeakerOn ? (
                <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>

            {/* End Call Button */}
            <button
              type="button"
              onClick={handleEndCall}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-[0_0_35px_rgba(225,29,72,0.7)] active:scale-90 transition-all"
              title="কল শেষ করুন"
            >
              <PhoneOff className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
          </div>

          <p className="text-[11px] text-white/50 text-center font-bangla">
            🕌 সকল অনলাইন অডিও-ভিডিও যোগাযোগ সম্পূর্ণ সুরক্ষিত ও দ্বীনি নীতিমালা মেনে পরিচালিত
          </p>
        </div>
      </div>
    </div>
  );
};
