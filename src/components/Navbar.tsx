import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { STRINGS } from '../strings';
import { Radio, LogOut, ChevronDown, Sparkles, BookOpen, RefreshCw, UserCheck } from 'lucide-react';
import { DEMO_LECTURERS } from '../services/api';

export const Navbar: React.FC = () => {
  const { lecturer, switchAccount, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSwitch = async (lecId: string) => {
    await switchAccount(lecId);
    setDropdownOpen(false);
    navigate('/');
  };

  if (!lecturer) return null;

  const initials = lecturer.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Zone */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform duration-200">
            <Radio className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1.5 font-sans">
              {STRINGS.app.name}
            </span>
          </div>
        </Link>

        {/* User Account Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 pl-3 rounded-full bg-sky-50/80 border border-sky-100 hover:border-sky-300 hover:bg-sky-50 transition-all text-left focus:outline-none focus:ring-2 focus:ring-sky-500/30 cursor-pointer"
            aria-label="User profile and menu"
          >
            <div className="flex flex-col items-end pr-0.5">
              <span className="text-xs font-bold text-slate-800 truncate max-w-[120px] sm:max-w-[170px]">
                {lecturer.name}
              </span>
              <span className="text-[10px] text-sky-600 font-medium">Lecturer Portal</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
              {initials}
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Card */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-sky-100 shadow-xl shadow-sky-900/10 p-2 z-50 text-sm animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2.5 bg-sky-50/50 rounded-xl mb-2">
                <p className="font-bold text-slate-900 truncate">{lecturer.name}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{lecturer.email}</p>
                {lecturer.department && (
                  <p className="text-[11px] text-sky-700 mt-1 font-semibold">{lecturer.department}</p>
                )}
              </div>

              <div className="p-1 space-y-1">
                {/* Switch Demo Accounts Quick Selector */}
                <div className="px-2 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Lecturer (Testing Isolation)
                </div>
                
                {DEMO_LECTURERS.map((demo) => {
                  const isCurrent = demo.id === lecturer.id;
                  return (
                    <button
                      key={demo.id}
                      type="button"
                      onClick={() => handleSwitch(demo.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                        isCurrent
                          ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="truncate">
                        <p className="truncate">{demo.name}</p>
                        <p className="text-[10px] text-slate-400 font-normal truncate">{demo.department}</p>
                      </div>
                      {isCurrent && <UserCheck className="w-4 h-4 text-sky-600 shrink-0" />}
                    </button>
                  );
                })}

                <div className="h-px bg-slate-100 my-1" />

                <Link
                  to="/"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors font-medium text-xs"
                >
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span>My Classes</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors text-left font-semibold text-xs cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
