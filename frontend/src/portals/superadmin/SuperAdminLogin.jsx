import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Loader2, Shield, Lock } from 'lucide-react';
import { useSuperAuth } from './SuperAuthContext';

export default function SuperAdminLogin() {
  const { login }    = useSuperAuth();
  const navigate     = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      navigate('/superadmin');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Subtle dot grid */}
      <div className="absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <div className="relative w-full max-w-sm">
        {/* Badge */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/20 px-5 py-2.5 rounded-full">
            <Shield className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-black text-orange-300 tracking-wide">SuperAdmin Access</span>
            <Lock className="w-3.5 h-3.5 text-orange-500" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-7 border-b border-gray-800">
            <h1 className="text-xl font-black text-white">Platform Control</h1>
            <p className="text-xs text-gray-500 mt-1">Smart Bursar · System Administration</p>
          </div>

          <div className="p-7">
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">Admin Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="superadmin@smartbursar.rw"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600
                    focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="••••••••••"
                    className="w-full px-4 py-3 pr-10 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600
                      focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm py-3 rounded-xl
                  disabled:opacity-60 transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-orange-900/30">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Authenticating…' : 'Access Platform'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-800 text-center">
              <p className="text-[10px] text-gray-600">
                Demo: <span className="font-mono text-gray-500">superadmin@smartbursar.rw</span> / <span className="font-mono text-gray-500">superadmin123</span>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-700 mt-5">
          Not an admin? <a href="/login" className="text-gray-500 hover:text-gray-300 transition-colors">Go to school login →</a>
        </p>
      </div>
    </div>
  );
}
