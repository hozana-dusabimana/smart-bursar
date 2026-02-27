import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { BookOpen, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import api from '../api/client';

function PasswordStrength({ password }) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Contains a number',     pass: /\d/.test(password) },
    { label: 'Contains a letter',     pass: /[a-zA-Z]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const colors = ['bg-red-400', 'bg-amber-400', 'bg-emerald-400'];
  const labels = ['Weak', 'Fair', 'Strong'];

  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0,1,2].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < score ? colors[score-1] : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className={`text-[10px] font-semibold ${score === 3 ? 'text-emerald-600' : score === 2 ? 'text-amber-600' : 'text-red-500'}`}>
        {labels[score - 1] || 'Too short'}
      </p>
      <ul className="space-y-1">
        {checks.map(c => (
          <li key={c.label} className={`flex items-center gap-1.5 text-[10px] ${c.pass ? 'text-emerald-600' : 'text-gray-400'}`}>
            <CheckCircle2 className={`w-3 h-3 ${c.pass ? 'text-emerald-500' : 'text-gray-300'}`} />
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ResetPassword() {
  const [params]          = useSearchParams();
  const navigate          = useNavigate();
  const token             = params.get('token') || '';

  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail,  setUserEmail]  = useState('');
  const [password,   setPassword]   = useState('');
  const [confirm,    setConfirm]    = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState('');

  // Validate token on mount
  useEffect(() => {
    if (!token) { setValidating(false); return; }
    api.get(`/auth/reset-token/${token}`)
      .then(r => { setTokenValid(true); setUserEmail(r.data.email); })
      .catch(() => setTokenValid(false))
      .finally(() => setValidating(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');

    setLoading(true); setError('');
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center shadow-lg">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-black text-white tracking-tight">Smart Bursar</span>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Loading token validation */}
          {validating && (
            <div className="p-10 flex flex-col items-center gap-3">
              <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
              <p className="text-sm text-gray-500">Verifying reset link…</p>
            </div>
          )}

          {/* Invalid token */}
          {!validating && !tokenValid && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-lg font-black text-gray-900 mb-2">Link expired or invalid</h2>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                This password reset link has expired or already been used. Please request a new one.
              </p>
              <Link to="/forgot-password"
                className="block bg-blue-700 text-white font-bold text-sm py-3 rounded-xl hover:bg-blue-800 transition-colors text-center">
                Request New Link
              </Link>
              <Link to="/login" className="block mt-3 text-xs text-gray-400 hover:text-blue-600 transition-colors">
                Back to sign in
              </Link>
            </div>
          )}

          {/* Success */}
          {done && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-lg font-black text-gray-900 mb-2">Password reset!</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Your password has been updated. Redirecting you to sign in…
              </p>
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin mx-auto mt-4" />
            </div>
          )}

          {/* Reset form */}
          {!validating && tokenValid && !done && (
            <>
              <div className="bg-slate-800 px-7 py-5">
                <h2 className="text-base font-extrabold text-white">Set new password</h2>
                <p className="text-xs text-slate-400 mt-1">For account: <span className="text-slate-300">{userEmail}</span></p>
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
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">New Password</label>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="w-full pr-10 px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <PasswordStrength password={password} />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Confirm Password</label>
                    <input
                      type="password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Repeat your password"
                      className={`w-full px-4 py-3 border rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all
                        ${confirm && password !== confirm ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-200'}`}
                    />
                    {confirm && password !== confirm && (
                      <p className="text-[10px] text-red-500 mt-1">Passwords don't match</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || (confirm && password !== confirm)}
                    className="w-full bg-blue-700 text-white font-bold text-sm py-3 rounded-xl hover:bg-blue-800 disabled:opacity-60 transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? 'Resetting…' : 'Reset Password'}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
