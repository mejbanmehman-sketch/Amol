// Web Audio API Synthesizer & Audio Manager for Islamic Alarms, Natural Ambiance (Fountain, Rain, River, Ocean, Birds, Rooster, Adhan)
import { AlarmSoundType } from '../types';

export type SoundType = AlarmSoundType;

type AudioStateListener = (isPlaying: boolean, soundType?: SoundType, title?: string) => void;

class AudioManager {
  private ctx: AudioContext | null = null;
  private activeNodes: { stop?: () => void; disconnect?: () => void }[] = [];
  private currentAudioElement: HTMLAudioElement | null = null;
  private isCurrentlyPlaying: boolean = false;
  private currentSoundType: SoundType | null = null;
  private listeners: AudioStateListener[] = [];

  public subscribe(listener: AudioStateListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(isPlaying: boolean, soundType?: SoundType, title?: string) {
    this.isCurrentlyPlaying = isPlaying;
    this.currentSoundType = isPlaying ? (soundType || null) : null;
    this.listeners.forEach((l) => {
      try {
        l(isPlaying, soundType, title);
      } catch {}
    });
  }

  public getIsPlaying(): boolean {
    return this.isCurrentlyPlaying;
  }

  public getCurrentSound(): SoundType | null {
    return this.currentSoundType;
  }

  public initContext(): AudioContext | null {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch (e) {
      console.warn('AudioContext init error', e);
      return null;
    }
  }

  public stopAll() {
    try {
      // Stop HTML Audio element if playing
      if (this.currentAudioElement) {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
        this.currentAudioElement = null;
      }
      // Stop all active Web Audio synthesizer nodes
      this.activeNodes.forEach((node) => {
        try {
          if (node.stop) node.stop();
          if (node.disconnect) node.disconnect();
        } catch {}
      });
      this.activeNodes = [];
      this.notify(false);
    } catch (e) {
      console.warn('Stop audio error', e);
      this.notify(false);
    }
  }

  // 1. খাঁটি ইসলামিক আজান (Authentic Islamic Adhan MP3 with rich Web Audio fallback)
  playAdhanSound(title: string = 'পবিত্র আজান') {
    this.stopAll();
    this.notify(true, 'adhan', title);

    // Reliable Adhan audio URLs
    const adhanUrls = [
      'https://cdn.aladhan.com/audio/adhans/c1.mp3',
      'https://cdn.aladhan.com/audio/adhans/makkah.mp3',
      'https://media.blubrry.com/muslim_central_quran/podcasts.qurancentral.com/adhaan/mishary-rashid-alafasy/mishary-rashid-alafasy-adhaan-1.mp3'
    ];

    let currentUrlIndex = 0;
    const tryPlayAudio = (url: string) => {
      try {
        const audio = new Audio(url);
        audio.preload = 'auto';
        audio.crossOrigin = 'anonymous';
        this.currentAudioElement = audio;

        audio.onended = () => {
          this.notify(false);
          this.currentAudioElement = null;
        };

        audio.onerror = () => {
          currentUrlIndex++;
          if (currentUrlIndex < adhanUrls.length) {
            tryPlayAudio(adhanUrls[currentUrlIndex]);
          } else {
            // Fallback to high quality synthesizer
            this.playAdhanChime();
          }
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Adhan stream play blocked/failed, falling back to Web Audio synth', err);
            this.playAdhanChime();
          });
        }
      } catch (err) {
        this.playAdhanChime();
      }
    };

    tryPlayAudio(adhanUrls[currentUrlIndex]);
  }

  // Adhan synthesizer backup
  playAdhanChime() {
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Adhan melodic notes (Allahu Akbar, Ash-hadu alla ilaha illallah)
      const notes = [
        { freq: 392.00, time: 0.0, dur: 0.9, gain: 0.5 },  // G4
        { freq: 440.00, time: 0.8, dur: 1.1, gain: 0.6 },  // A4 (Al-laa)
        { freq: 493.88, time: 1.8, dur: 1.3, gain: 0.65 }, // B4 (hu Ak-)
        { freq: 523.25, time: 3.0, dur: 2.2, gain: 0.7 },  // C5 (-bar)
        
        { freq: 493.88, time: 5.2, dur: 0.9, gain: 0.55 }, // B4
        { freq: 440.00, time: 6.0, dur: 1.2, gain: 0.6 },  // A4
        { freq: 392.00, time: 7.1, dur: 1.0, gain: 0.5 },  // G4
        { freq: 349.23, time: 8.0, dur: 2.4, gain: 0.65 }, // F4
        { freq: 392.00, time: 10.3, dur: 2.5, gain: 0.55 },// G4
      ];

      notes.forEach((n) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const oscHarmonic = ctx.createOscillator();
        const gain = ctx.createGain();

        // Fundamental
        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, now + n.time);

        // Warm harmonic overtone (Reverb-like bell resonance)
        oscHarmonic.type = 'triangle';
        oscHarmonic.frequency.setValueAtTime(n.freq * 2, now + n.time);

        // Envelope
        gain.gain.setValueAtTime(0.001, now + n.time);
        gain.gain.linearRampToValueAtTime(n.gain, now + n.time + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

        osc.connect(gain);
        oscHarmonic.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + n.time);
        oscHarmonic.start(now + n.time);
        osc.stop(now + n.time + n.dur);
        oscHarmonic.stop(now + n.time + n.dur);

        this.activeNodes.push(osc, oscHarmonic);
      });
    } catch (e) {
      console.warn('Adhan chime synthesis error', e);
    }
  }

  // 2. মোরগের সুমধুর ডাক (Rooster Crow for Tahajjud / Fajr Awakening)
  playRoosterSound(title: string = 'মোরগের ডাক') {
    this.stopAll();
    this.notify(true, 'rooster', title);
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // "Cock-a-doodle-doo" sequence: 4 expressive syllables
      const syllables = [
        { start: 0.0, dur: 0.28, fStart: 500, fEnd: 650, gain: 0.45 },
        { start: 0.35, dur: 0.25, fStart: 650, fEnd: 820, gain: 0.55 },
        { start: 0.65, dur: 0.35, fStart: 800, fEnd: 980, gain: 0.65 },
        { start: 1.05, dur: 1.3, fStart: 1020, fEnd: 700, gain: 0.6 },
      ];

      syllables.forEach((s) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(s.fStart, now + s.start);
        osc.frequency.exponentialRampToValueAtTime(s.fEnd, now + s.start + s.dur);

        // Lowpass filter for vocal tract resonance
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now + s.start);
        filter.Q.setValueAtTime(3.0, now + s.start);

        gain.gain.setValueAtTime(0.01, now + s.start);
        gain.gain.linearRampToValueAtTime(s.gain, now + s.start + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + s.start + s.dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + s.start);
        osc.stop(now + s.start + s.dur);
        this.activeNodes.push(osc);
      });
    } catch (e) {
      console.warn('Rooster synthesis error', e);
    }
  }

  // 3. মিষ্টি পাখির ডাক (Sweet Morning Birds Chirping)
  playBirdsSound(title: string = 'পাখির মিষ্টি ডাক') {
    this.stopAll();
    this.notify(true, 'birds', title);
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const chirps = [
        { start: 0.0, f1: 2400, f2: 3600, dur: 0.14 },
        { start: 0.18, f1: 2600, f2: 4000, dur: 0.16 },
        { start: 0.40, f1: 3200, f2: 2600, dur: 0.20 },
        { start: 0.85, f1: 2500, f2: 3800, dur: 0.15 },
        { start: 1.05, f1: 3800, f2: 4600, dur: 0.18 },
        { start: 1.30, f1: 3400, f2: 2400, dur: 0.25 },
        { start: 1.75, f1: 2900, f2: 4200, dur: 0.16 },
        { start: 2.10, f1: 3300, f2: 4700, dur: 0.20 },
        { start: 2.45, f1: 3900, f2: 2800, dur: 0.28 },
      ];

      chirps.forEach((c) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(c.f1, now + c.start);
        osc.frequency.exponentialRampToValueAtTime(c.f2, now + c.start + c.dur * 0.6);
        osc.frequency.exponentialRampToValueAtTime(c.f1 * 0.85, now + c.start + c.dur);

        gain.gain.setValueAtTime(0.01, now + c.start);
        gain.gain.linearRampToValueAtTime(0.4, now + c.start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + c.start + c.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + c.start);
        osc.stop(now + c.start + c.dur);
        this.activeNodes.push(osc);
      });
    } catch (e) {
      console.warn('Birds synthesis error', e);
    }
  }

  // 4. ঝরনার মিষ্টি শব্দ (Gentle Water Fountain Flow)
  playFountainSound(title: string = 'ঝরনার শব্দ') {
    this.stopAll();
    this.notify(true, 'fountain', title);
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const bufferSize = Math.floor(ctx.sampleRate * 3.5);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Pink noise water texture
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + white * 0.05;
        b1 = 0.985 * b1 + white * 0.10;
        b2 = 0.950 * b2 + white * 0.25;
        data[i] = (b0 + b1 + b2 + white * 0.3) * 0.2;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600, ctx.currentTime);
      filter.Q.setValueAtTime(1.8, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noise.stop(ctx.currentTime + 3.5);
      this.activeNodes.push(noise);

      // Add gentle water drops
      for (let i = 0; i < 8; i++) {
        const dropOsc = ctx.createOscillator();
        const dropGain = ctx.createGain();
        const t = ctx.currentTime + 0.15 + i * 0.4 + Math.random() * 0.15;
        dropOsc.type = 'sine';
        dropOsc.frequency.setValueAtTime(1400 + Math.random() * 800, t);
        dropOsc.frequency.exponentialRampToValueAtTime(600, t + 0.09);

        dropGain.gain.setValueAtTime(0.12, t);
        dropGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

        dropOsc.connect(dropGain);
        dropGain.connect(ctx.destination);
        dropOsc.start(t);
        dropOsc.stop(t + 0.1);
        this.activeNodes.push(dropOsc);
      }
    } catch (e) {
      console.warn('Fountain synthesis error', e);
    }
  }

  // 5. বৃষ্টির মিষ্টি সুর (Calming Rainfall Sound)
  playRainSound(title: string = 'বৃষ্টির সুর') {
    this.stopAll();
    this.notify(true, 'rain', title);
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const bufferSize = Math.floor(ctx.sampleRate * 3.5);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.25;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noise.stop(ctx.currentTime + 3.5);
      this.activeNodes.push(noise);
    } catch (e) {
      console.warn('Rain synthesis error', e);
    }
  }

  // 6. নদীর শান্ত পানির স্রোত (Flowing River Sound)
  playRiverSound(title: string = 'নদীর কলতান') {
    this.stopAll();
    this.notify(true, 'river', title);
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const bufferSize = Math.floor(ctx.sampleRate * 3.8);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.03 * white) / 1.03;
        lastOut = data[i];
        data[i] *= 4.2;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.Q.setValueAtTime(1.4, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.7);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noise.stop(ctx.currentTime + 3.8);
      this.activeNodes.push(noise);
    } catch (e) {
      console.warn('River synthesis error', e);
    }
  }

  // 7. সাগরের শান্ত ঢেউ (Calm Ocean Waves Surge)
  playOceanSound(title: string = 'সাগরের ঢেউ') {
    this.stopAll();
    this.notify(true, 'ocean', title);
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const bufferSize = Math.floor(ctx.sampleRate * 4.0);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 1.8);
      filter.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 3.8);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.65, ctx.currentTime + 1.8);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.9);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noise.stop(ctx.currentTime + 4.0);
      this.activeNodes.push(noise);
    } catch (e) {
      console.warn('Ocean synthesis error', e);
    }
  }

  // 8. শান্ত ইসলামিক বেল / চিম (Calm Islamic Chime)
  playChimeSound(title: string = 'ইসলামিক বেল') {
    this.stopAll();
    this.notify(true, 'chime', title);
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const chords = [587.33, 739.99, 880.00, 1174.66]; // D-major triad
      
      chords.forEach((freq, idx) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.25);

        gain.gain.setValueAtTime(0.01, now + idx * 0.25);
        gain.gain.linearRampToValueAtTime(0.45, now + idx * 0.25 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.25 + 1.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.25);
        osc.stop(now + idx * 0.25 + 1.6);
        this.activeNodes.push(osc);
      });
    } catch (e) {
      console.warn('Chime synthesis error', e);
    }
  }

  // Unified Play Sound by Type
  playSound(type: SoundType = 'adhan', title?: string) {
    switch (type) {
      case 'rooster':
        this.playRoosterSound(title);
        break;
      case 'birds':
        this.playBirdsSound(title);
        break;
      case 'fountain':
        this.playFountainSound(title);
        break;
      case 'rain':
        this.playRainSound(title);
        break;
      case 'river':
        this.playRiverSound(title);
        break;
      case 'ocean':
        this.playOceanSound(title);
        break;
      case 'chime':
        this.playChimeSound(title);
        break;
      case 'adhan':
      default:
        this.playAdhanSound(title);
        break;
    }
  }

  // Play subtle click for Tasbih beads
  playTasbihClick() {
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.04);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // ignore
    }
  }

  playAlarmSound() {
    this.playAdhanChime();
  }
}

export const audioService = new AudioManager();

// Browser Notification Helper
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }
  return false;
}

export function sendBrowserNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    } catch {
      // ignore
    }
  }
}
