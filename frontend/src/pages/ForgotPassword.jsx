import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import api from '../api/client';

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return setError('Please enter your email address.');
    setLoading(true); setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center shadow-lg">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-black text-white tracking-tight">Smart Bursar</span>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {sent ? (
            /* ── Success state ── */
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-2">Check your email</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-2">
                If <strong className="text-gray-700">{email}</strong> is registered, we've sent a password reset link.
              </p>
              <p className="text-xs text-gray-400 mb-6">The link expires in 1 hour. Check your spam folder if you don't see it.</p>
              <Link to="/login"
                className="flex items-center justify-center gap-2 bg-blue-700 text-white font-bold text-sm py-3 rounded-xl hover:bg-blue-800 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to sign in
              </Link>
            </div>
          ) : (
            /* ── Form ── */
            <>
              <div className="bg-slate-800 px-7 py-5">
                <h2 className="text-base font-extrabold text-white">Forgot your password?</h2>
                <p className="text-xs text-slate-400 mt-1">Enter your email and we'll send a reset link.</p>
              </div>

              <div className="p-7">
                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-5">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@school.rw"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-700 text-white font-bold text-sm py-3 rounded-xl hover:bg-blue-800 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? 'Sending…' : 'Send Reset Link'}
                  </button>
                </form>

                <div className="mt-5 text-center">
                  <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-700 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
