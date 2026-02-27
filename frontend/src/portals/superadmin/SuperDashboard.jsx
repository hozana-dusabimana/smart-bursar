import { useEffect, useState } from 'react';
import { Building2, Users, Mail, CheckCircle2, XCircle, Loader2, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { saFetch } from './SuperAuthContext';

export default function SuperDashboard() {
  const [stats,   setStats]   = useState(null);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([saFetch('/superadmin/stats'), saFetch('/superadmin/schools')])
      .then(([s, sc]) => { setStats(s); setSchools(sc.slice(0, 5)); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
      <span className="ml-2 text-sm text-gray-400">Loading platform stats…</span>
    </div>
  );

  const CARDS = [
    { label: 'Total Schools',   value: stats?.schools?.total  || 0, sub: `${stats?.schools?.active || 0} active`,                   icon: Building2,  color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
    { label: 'Total Users',     value: stats?.users?.total    || 0, sub: 'across all schools',                                       icon: Users,      color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20'   },
    { label: 'Emails Sent',     value: stats?.emails?.sent    || 0, sub: `${stats?.emails?.failed || 0} failed`,                     icon: Mail,       color: 'text-teal-400',   bg: 'bg-teal-500/10 border-teal-500/20'   },
    { label: 'Email Success',   value: stats?.emails?.total ? `${Math.round((stats.emails.sent/stats.emails.total)*100)}%` : '—',
      sub: `${stats?.emails?.total || 0} total sent`, icon: TrendingUp,  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-orange-600/20 to-orange-800/10 border border-orange-600/20 rounded-2xl p-6">
        <p className="text-xs text-orange-400 font-bold uppercase tracking-widest mb-1">Platform Overview</p>
        <h1 className="text-xl font-black text-white">Welcome back, Super Admin 🛡️</h1>
        <p className="text-sm text-gray-400 mt-1">Here's a real-time snapshot of the Smart Bursar platform.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map(c => (
          <div key={c.label} className={`bg-gray-900 border rounded-xl p-4 ${c.bg}`}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">{c.label}</p>
              <c.icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
            <p className="text-[10px] text-gray-600 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent schools */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <p className="text-xs font-bold text-white uppercase tracking-widest">Recent Schools</p>
          <Link to="/superadmin/schools" className="text-[10px] text-orange-400 hover:text-orange-300 font-bold">
            View all →
          </Link>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              {['School', 'Subscription', 'Users', 'Status', 'Added'].map(h => (
                <th key={h} className="px-5 py-3 text-left font-bold text-gray-600 uppercase tracking-wider text-[10px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {schools.map(s => (
              <tr key={s.id} className="hover:bg-gray-800/40 transition-colors">
                <td className="px-5 py-3.5">
                  <div>
                    <p className="font-semibold text-white text-xs">{s.name}</p>
                    <p className="text-[10px] text-gray-600">{s.email || s.slug}</p>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize
                    ${s.subscription === 'premium' ? 'bg-amber-500/10 text-amber-400' :
                      s.subscription === 'basic'   ? 'bg-blue-500/10 text-blue-400' :
                      'bg-gray-700 text-gray-400'}`}>
                    {s.subscription}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-gray-400">{s.user_count || 0}</td>
                <td className="px-5 py-3.5">
                  {s.is_active
                    ? <span className="flex items-center gap-1 text-[10px] text-emerald-400"><CheckCircle2 className="w-3 h-3" />Active</span>
                    : <span className="flex items-center gap-1 text-[10px] text-red-400"><XCircle className="w-3 h-3" />Disabled</span>}
                </td>
                <td className="px-5 py-3.5 text-gray-600">{String(s.created_at || '').slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
