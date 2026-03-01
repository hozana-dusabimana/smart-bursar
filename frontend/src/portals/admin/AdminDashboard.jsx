import { useEffect, useState } from 'react';
import { Users, Shield, Settings, BookOpen, CheckCircle2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/users'), api.get('/settings')])
      .then(([u, s]) => { setUsers(u.data||[]); setSettings(s.data); })
      .finally(()=>setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 text-orange-500 animate-spin"/></div>;

  const roleCount = users.reduce((acc, u) => { acc[u.role] = (acc[u.role]||0)+1; return acc; }, {});

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-2xl p-6 text-white">
        <p className="text-xs text-gray-400">System Administration</p>
        <h1 className="text-xl font-extrabold mt-1">Admin Control Panel</h1>
        <p className="text-sm text-gray-300 mt-0.5">Manage users, configure fees, and control system settings.</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Total Users',    value: users.length          },
            { label: 'Active Users',   value: users.filter(u=>u.is_active).length },
            { label: 'Academic Year',  value: settings?.config?.current_year || '—' },
          ].map(s=>(
            <div key={s.label} className="bg-white/10 rounded-xl p-3">
              <p className="text-[10px] text-gray-400">{s.label}</p>
              <p className="text-sm font-extrabold mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Bursar', count: roleCount.bursar||0, bg:'bg-blue-600' },
          { label: 'Accountant', count: roleCount.accountant||0, bg:'bg-teal-600' },
          { label: 'Principal', count: roleCount.principal||0, bg:'bg-indigo-600' },
          { label: 'Admin', count: roleCount.admin||0, bg:'bg-orange-600' },
        ].map(r=>(
          <div key={r.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${r.bg} flex items-center justify-center`}>
              <Shield className="w-5 h-5 text-white"/>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">{r.label}</p>
              <p className="text-lg font-extrabold text-gray-900">{r.count}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { to:'/admin/users',    label:'Manage Users',     sub:'Add, edit, disable accounts',    icon:Users,    bg:'bg-blue-600'   },
          { to:'/admin/settings', label:'System Settings',  sub:'Fee structure, school config',   icon:Settings, bg:'bg-orange-600' },
          { to:'/admin/terms',    label:'Academic Terms',   sub:'Set active term, dates',         icon:BookOpen, bg:'bg-teal-600'   },
        ].map(a=>(
          <Link key={a.to} to={a.to} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-start gap-3 hover:shadow-md transition-all">
            <div className={`w-9 h-9 rounded-lg ${a.bg} flex items-center justify-center shrink-0`}><a.icon className="w-5 h-5 text-white"/></div>
            <div><p className="text-sm font-bold text-gray-900">{a.label}</p><p className="text-xs text-gray-500 mt-0.5">{a.sub}</p></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
