import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { STRINGS } from '../strings';
import { Radio, Mail, Lock, User, ArrowRight, Loader2, Sparkles, Building } from 'lucide-react';
import { DEMO_LECTURERS } from '../services/api';

export const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, signup, loginWithGoogle, switchAccount } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const validate = () => {
    if (isSignUp && !name.trim()) {
      setError(STRINGS.auth.fillAllFields);
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      setError(STRINGS.auth.invalidEmail);
      return false;
    }
    if (!password || password.length < 4) {
      setError(STRINGS.auth.passwordTooShort);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      if (isSignUp) {
        await signup(name, email, password);
        showToast('Account created! Welcome to your personal dashboard.', 'success');
      } else {
        await login(email, password);
        showToast('Logged in to your lecturer account!', 'success');
      }
      navigate('/');
    } catch {
      setError('Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      showToast('Logged in with Google SSO', 'success');
      navigate('/');
    } catch {
      setError('Google Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLecturer = async (demo: typeof DEMO_LECTURERS[0]) => {
    setLoading(true);
    try {
      await switchAccount(demo.id);
      showToast(`Signed in as ${demo.name}`, 'success');
      navigate('/');
    } catch {
      setError('Failed to switch demo account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F9FD] flex flex-col justify-between p-4 sm:p-6">
      {/* Header Brand */}
      <div className="w-full max-w-md mx-auto pt-6 sm:pt-10 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white border border-sky-200 text-sky-700 mb-3 shadow-xs">
          <Radio className="w-4 h-4 text-sky-600 animate-pulse" />
          <span className="text-xs font-bold tracking-wide">CampusCast</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {STRINGS.app.name}
        </h1>
        <p className="text-base font-semibold text-slate-700 mt-1.5">
          {STRINGS.app.tagline}
        </p>
        <p className="text-xs text-sky-700 mt-0.5">
          {STRINGS.app.subTagline}
        </p>
      </div>

      {/* Main Form Card */}
      <div className="w-full max-w-md mx-auto my-6 bg-white border border-sky-100 rounded-3xl shadow-xl shadow-sky-900/5 p-6 sm:p-8 relative z-10">
        <div className="mb-6">
          <h2 className="text-xl font-extrabold text-slate-900">
            {isSignUp ? STRINGS.auth.createAccount : STRINGS.auth.welcomeBack}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isSignUp ? STRINGS.auth.signupSubtitle : STRINGS.auth.loginSubtitle}
          </p>
        </div>

        {/* Google SSO Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full min-h-[48px] rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center gap-3 transition-all cursor-pointer mb-5 shadow-xs active:scale-[0.99]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
            />
          </svg>
          <span>{STRINGS.auth.continueWithGoogle}</span>
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="h-px bg-slate-100 flex-1" />
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
            Or sign in with email
          </span>
          <div className="h-px bg-slate-100 flex-1" />
        </div>

        {/* Error notice */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {STRINGS.auth.fullName}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={STRINGS.auth.fullNamePlaceholder}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {STRINGS.auth.email}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={STRINGS.auth.emailPlaceholder}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {STRINGS.auth.password}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={STRINGS.auth.passwordPlaceholder}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-[0.99] transition-all cursor-pointer mt-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? STRINGS.auth.signUp : STRINGS.auth.logIn}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Switch mode */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-xs text-slate-500 hover:text-sky-600 transition-colors cursor-pointer"
          >
            {isSignUp ? STRINGS.auth.alreadyHaveAccount : STRINGS.auth.dontHaveAccount}{' '}
            <span className="font-bold text-sky-600 underline underline-offset-4">
              {isSignUp ? STRINGS.auth.logIn : STRINGS.auth.signUp}
            </span>
          </button>
        </div>

        {/* Demo Accounts Switcher (Proof of Isolation) */}
        <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            Test Different Lecturer Accounts (Isolated Data)
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {DEMO_LECTURERS.map((demo) => (
              <button
                key={demo.id}
                type="button"
                onClick={() => handleQuickDemoLecturer(demo)}
                className="p-2.5 rounded-xl bg-sky-50/70 hover:bg-sky-100/80 border border-sky-100 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span className="truncate">{demo.name}</span>
                </div>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{demo.department}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-md mx-auto text-center pb-4 text-xs text-slate-400">
        <p>Private & secure lecturer broadcasting platform</p>
      </div>
    </div>
  );
};
