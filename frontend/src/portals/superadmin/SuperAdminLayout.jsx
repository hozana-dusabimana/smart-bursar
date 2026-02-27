import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Shield, Building2, Users, Mail, BarChart3,
  ChevronLeft, ChevronRight, LogOut, Activity, UserCog
} from 'lucide-react';
import { useSuperAuth } from './SuperAuthContext';

const NAV = [
  { path: '/superadmin', label: 'Dashboard', icon: Activity, end: true },
  { path: '/superadmin/schools', label: 'Schools', icon: Building2 },
  { path: '/superadmin/admins', label: 'SuperAdmins', icon: UserCog },
  { path: '/superadmin/emails', label: 'Email Log', icon: Mail },
];

export default function SuperAdminLayout() {  
  const [collapsed, setCollapsed] = useState(false);
  const { admin, logout } = useSuperAuth();
  const navigate = useNavigate();
  const initials = admin?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'SA';

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <aside className={`relative flex flex-col border-r border-gray-800 transition-all duration-300 shrink-0 ${collapsed ? 'w-14' : 'w-60'}`}>
        <div className={`flex items-center gap-3 p-3 border-b border-gray-800 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center shrink-0 shadow-lg shadow-orange-900/40">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-xs font-black text-white">SuperAdmin</p>
              <p className="text-[10px] text-gray-600">Platform Control</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {!collapsed && <p className="text-[9px] font-bold text-gray-700 px-2 mb-2 tracking-widest">PLATFORM</p>}
          {NAV.map(item => (
            <NavLink key={item.path} to={item.path} end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-2 py-2 rounded-lg text-xs font-semibold transition-all
                ${isActive ? 'bg-orange-600 text-white' : 'text-gray-500 hover:bg-gray-800 hover:text-gray-200'}
                ${collapsed ? 'justify-center' : ''}`
              }>
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={`border-t border-gray-800 p-3 ${collapsed ? 'flex justify-center' : 'flex items-center gap-2'}`}>
          <div className="w-7 h-7 rounded-full bg-orange-700 flex items-center justify-center text-xs font-black shrink-0">{initials}</div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{admin?.name}</p>
                <p className="text-[10px] text-gray-600">SuperAdmin</p>
              </div>
              <button onClick={() => { logout(); navigate('/superadmin/login'); }}
                className="p-1 text-gray-600 hover:text-red-400 transition-colors">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        <button onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-orange-500 z-10">
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-gray-800 px-5 py-3 flex items-center justify-between bg-gray-900/50 sticky top-0 z-10 backdrop-blur">
          <div>
            <p className="text-sm font-bold text-white">Smart Bursar Platform</p>
            <p className="text-[10px] text-gray-600">Global Administration · {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold px-2.5 py-1 rounded-full">
              SUPER ADMIN
            </span>
          </div>
        </header>
        <main className="flex-1 p-5 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
