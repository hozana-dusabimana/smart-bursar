import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Loader2, Mail, Lock, User, Send, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, requestOTP, loginWithOTP } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [mode, setMode] = useState('password'); // 'password' | 'otp_request' | 'otp_verify'
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const m = searchParams.get('mode');
    const e = searchParams.get('email');
    if (m === 'parent') {
      setMode('otp_request');
    } else if (m === 'otp_verify') {
      setMode('otp_verify');
    }
    if (e) {
      setEmail(e);
    }
  }, [searchParams]);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(email, password);
      const homes = { bursar: '/app', accountant: '/accountant', principal: '/principal', admin: '/admin', parent: '/parent' };
      navigate(homes[user.role] || '/app');
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  const handleOTPRequest = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await requestOTP(email);
      setMode('otp_verify');
    } catch (err) {
      setError(err.message || 'Could not send code. Is this email registered?');
    } finally { setLoading(false); }
  };

  const handleOTPVerify = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await loginWithOTP(email, otp);
      navigate('/parent');
    } catch (err) {
      setError(err.message || 'Verification failed. Incorrect or expired code.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col lg:flex-row font-sans overflow-x-hidden">

      {/* Left Side: Illustration (Desktop Only) */}
      <div className="hidden lg:flex lg:w-[40%] bg-white flex-col items-center justify-center p-12 relative">
        <div className="max-w-md w-full space-y-8">
          <h1 className="text-3xl font-bold text-blue-900">
            Almost there, Enter your <br />
            <span className="text-blue-600">credentials</span> to have access.
          </h1>

          <div className="flex items-center justify-center">
            <img
              src="/auth.svg"
              alt="Authentication"
              className="w-full max-w-md"
            />
          </div>

          {/* Feature highlights */}
          <div className="space-y-3 pt-2">
            {[
              'Instant receipt generation',
              'Real-time fee tracking',
              'Multi-role access',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-gray-500">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Login Card with Hero Background */}
      <div className="flex-1 lg:w-[60%] bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-4 min-h-screen relative overflow-hidden">
        {/* Grid texture from hero */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
        {/* Glow blobs from hero */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-700/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl opacity-50" />

        {/* Branding */}
        <div className="mb-8 lg:absolute lg:top-6 lg:left-1/2 lg:-translate-x-1/2 flex flex-col items-center gap-1 z-10 transition-all">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Smart Bursar</span>
          </div>
          <p className="text-[8px] text-blue-200/50 uppercase tracking-wider">Education Management System</p>
        </div>

        {/* The Card */}
        <div className="relative w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 lg:p-8 z-20 mx-auto">
          <div className="mb-5">
            <h2 className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-extrabold text-2xl">
              LOGIN
            </h2>
            <hr className="mt-3 border-gray-100" />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {mode === 'password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email / Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Enter your Email" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Enter your Password" />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm shadow-sm">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> SIGN IN</>}
                </button>
              </form>
            )}

            {mode === 'otp_request' && (
              <form onSubmit={handleOTPRequest} className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-4">
                    We'll send a secure code to your registered email.
                  </p>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="parent@email.rw" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm shadow-sm">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> SEND CODE</>}
                </button>
              </form>
            )}

            {mode === 'otp_verify' && (
              <form onSubmit={handleOTPVerify} className="space-y-4">
                <div>
                  <button type="button" onClick={() => setMode('otp_request')} className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 mb-3">
                    <ArrowLeft className="w-3 h-3" /> CHANGE EMAIL
                  </button>
                  <p className="text-xs text-gray-500 mb-3">
                    Code sent to <span className="font-medium text-gray-700">{email}</span>
                  </p>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Login Code</label>
                  <input
                    type="text" value={otp} onChange={e => setOtp(e.target.value)} required maxLength={6}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-2xl tracking-[0.5em] font-mono text-center focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="000000" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm shadow-sm">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> VERIFY</>}
                </button>
              </form>
            )}

            <div className="flex flex-col items-center gap-3 pt-2">
              {mode === 'password' ? (
                <button type="button" onClick={() => setMode('otp_request')}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 px-4 py-1.5 rounded-full transition-colors border border-gray-200">
                  Parent? Login with code instead
                </button>
              ) : (
                <button type="button" onClick={() => setMode('password')}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 px-4 py-1.5 rounded-full transition-colors border border-gray-200">
                  Back to Staff Login
                </button>
              )}

              {mode === 'password' && (
                <Link to="/forgot-password" className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Forgot password?
                </Link>
              )}
            </div>
          </div>
        </div>
        {/* Support Link */}
        <div className="absolute bottom-4 text-center z-10">
          <p className="text-xs text-blue-200/50">
            Need help? <a href="#" className="text-blue-400 hover:text-blue-300">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  );
}
