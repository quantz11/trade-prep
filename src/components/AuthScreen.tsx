import React, { useState } from 'react';
import { ShieldCheck, Lock, KeyRound, Eye, EyeOff, ArrowRight, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch the password field from Firebase Firestore document sessions/main with timeout
      const docRef = doc(db, 'sessions', 'main');
      
      // Wrap getDoc with timeout to handle temporary connection drops gracefully
      const getDocWithTimeout = Promise.race([
        getDoc(docRef),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Connection timed out. Retrying...')), 8000)
        )
      ]);

      const snap = await getDocWithTimeout;

      if (!snap.exists()) {
        setError('No active workstation session found.');
        setLoading(false);
        return;
      }

      const data = snap.data();
      const expectedPassword = data?.password !== undefined ? String(data.password).trim() : null;

      if (!expectedPassword) {
        setError('Authentication is not configured. Please verify workstation configuration.');
        setLoading(false);
        return;
      }

      if (password.trim() === expectedPassword) {
        sessionStorage.setItem('trade_authenticated', 'true');
        setSuccess(true);
        setTimeout(() => {
          onAuthenticated();
        }, 400);
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
        setLoading(false);
      }
    } catch (err: any) {
      console.warn('Auth Verification Notice:', err);
      const isNetworkOrUnavailable =
        err?.message?.includes('unavailable') ||
        err?.message?.includes('offline') ||
        err?.message?.includes('timed out') ||
        err?.code === 'unavailable';

      if (isNetworkOrUnavailable) {
        setError('Connecting to database... Please check your internet connection and try again.');
      } else {
        setError('Failed to verify password. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Subtle Background Radial Highlights */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-blue-400 mb-4 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/20">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight mb-1.5">
            Trade Pre-Entry Protocol
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            High-conviction pre-execution verification & journal
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Workstation Locked
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
              Protected
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300 block">
                Enter Password
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter password..."
                  autoFocus
                  disabled={loading || success}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-11 py-3 text-sm text-slate-100 placeholder-slate-600 font-mono transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Password verified! Unlocking workstation...</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 active:from-blue-700 active:to-blue-600 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Unlocked</span>
                </>
              ) : (
                <>
                  <span>Unlock Workstation</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500">
              Authorized access only. Enter password to continue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
