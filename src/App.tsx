import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { BottomNav } from './components/BottomNav';
import { AuthGatekeeper } from './components/AuthGatekeeper';
import { ActiveAlarmBanner } from './components/ActiveAlarmBanner';
import { CallModal } from './components/CallModal';
import { callSounds } from './services/webrtcService';
import { Phone, PhoneIncoming, User as UserIcon } from 'lucide-react';
import { DashboardPage } from './pages/DashboardPage';
import { ReportsPage } from './pages/ReportsPage';
import { QuranDuaPage } from './pages/QuranDuaPage';
import { QazaTrackerPage } from './pages/QazaTrackerPage';
import { ContactsPage } from './pages/ContactsPage';
import { CommunityPage } from './pages/CommunityPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';

const MainAppLayout: React.FC = () => {
  const {
    user,
    activeCallSession,
    incomingCallSession,
    acceptIncomingCall,
    declineIncomingCall,
    endActiveCall
  } = useApp();

  // Handle incoming call ringtone sound
  useEffect(() => {
    if (incomingCallSession && !activeCallSession) {
      callSounds.startIncomingRingtone();
    } else {
      callSounds.stop();
    }
    return () => {
      callSounds.stop();
    };
  }, [incomingCallSession, activeCallSession]);

  // If user is not authenticated, show the dedicated Islamic Login & Profile Gatekeeper Screen first!
  if (!user) {
    return (
      <div className="min-h-screen">
        <ActiveAlarmBanner />
        <AuthGatekeeper />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen text-white flex flex-col selection:bg-[#D4AF37] selection:text-[#0a1628] font-bangla transition-colors"
      style={{ background: 'radial-gradient(circle at top right, #1a2a4a 0%, #0a1628 100%)', backgroundAttachment: 'fixed' }}
    >
      {/* Universal Active Alarm Stop Banner */}
      <ActiveAlarmBanner />

      {/* Global Incoming WebRTC Call Banner / Overlay */}
      {incomingCallSession && !activeCallSession && (
        <div className="fixed inset-0 z-50 bg-[#06101e]/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-sm bg-gradient-to-b from-[#162746] to-[#0a1628] border-2 border-[#D4AF37]/60 rounded-3xl p-6 shadow-2xl text-center space-y-5">
            <div className="relative mx-auto w-24 h-24">
              {incomingCallSession.caller.avatar ? (
                <img
                  src={incomingCallSession.caller.avatar}
                  alt={incomingCallSession.caller.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full rounded-full object-cover border-4 border-[#D4AF37] shadow-xl"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-[#1e3458] border-4 border-[#D4AF37] flex items-center justify-center shadow-xl">
                  <UserIcon className="w-12 h-12 text-[#D4AF37]" />
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-[#06101e] flex items-center justify-center animate-ping" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">{incomingCallSession.caller.name}</h3>
              <p className="text-xs text-[#D4AF37] mt-1.5 font-semibold flex items-center justify-center gap-1.5">
                <PhoneIncoming className="w-4 h-4 animate-pulse text-emerald-400" />
                <span>অনলাইন {incomingCallSession.type === 'video' ? 'এইচডি ভিডিও' : 'এইচডি অডিও'} কল আসছে...</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  callSounds.stop();
                  declineIncomingCall();
                }}
                className="py-3 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-2xl text-sm font-bold transition-all shadow-md active:scale-95"
              >
                কেটে দিন
              </button>

              <button
                type="button"
                onClick={() => {
                  callSounds.stop();
                  acceptIncomingCall();
                }}
                className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-95"
              >
                <Phone className="w-4 h-4" />
                <span>রিসিভ করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Active WebRTC Audio/Video Call Modal */}
      {activeCallSession && (
        <CallModal
          session={activeCallSession}
          currentUser={user}
          onEndCall={endActiveCall}
        />
      )}

      {/* Main Fixed / Sticky Header with Date Nav & Actions */}
      <Header />

      {/* Main App Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 sm:pb-12">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/quran-dua" element={<QuranDuaPage />} />
          <Route path="/qaza" element={<QazaTrackerPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Islamic Contact & Credits Footer */}
      <Footer />

      {/* Mobile Bottom Thumb Navigation */}
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <MainAppLayout />
      </AppProvider>
    </BrowserRouter>
  );
}
