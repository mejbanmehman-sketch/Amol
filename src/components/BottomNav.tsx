import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  BookOpen,
  History,
  PhoneCall,
  User,
  ShieldCheck,
  Users
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const BottomNav: React.FC = () => {
  const { isAdmin } = useApp();

  const navItems = [
    { to: '/', label: 'আমল', icon: LayoutDashboard },
    { to: '/community', label: 'মজলিস/কল', icon: Users },
    { to: '/reports', label: 'রিপোর্ট', icon: BarChart3 },
    { to: '/quran-dua', label: 'কুরআন/কিতাব', icon: BookOpen },
    { to: '/qaza', label: 'কাজা', icon: History },
    { to: '/contacts', label: 'যোগাযোগ', icon: PhoneCall },
    { to: '/profile', label: 'প্রোফাইল', icon: User },
    ...(isAdmin ? [{ to: '/admin', label: 'অ্যাডমিন', icon: ShieldCheck }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#060e1b]/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.6)]">
      <div className="max-w-xl mx-auto px-1 sm:px-2 py-1.5 flex items-center justify-around overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-1.5 sm:px-2 rounded-xl sm:rounded-2xl transition-all duration-200 shrink-0 ${
                  isActive
                    ? 'text-[#D4AF37] bg-[#1a2a4a] font-bold scale-105 border border-[#D4AF37]/40 shadow-[0_0_15px_rgba(212,175,55,0.25)]'
                    : 'text-white/50 hover:text-white/90 font-medium'
                }`
              }
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="text-[9px] sm:text-[10px] tracking-tight font-bangla whitespace-nowrap leading-none">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
