import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Crown, BarChart3, TrendingUp, Users, FileText, ChevronLeft, ChevronRight, LogOut, DollarSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { path: '/principal',           label: 'Executive Summary', icon: Crown,       end: true },
  { path: '/principal/collection',label: 'Fee Collection',    icon: TrendingUp            },
  { path: '/principal/expenses',  label: 'Expenditure',       icon: DollarSign            },
  { path: '/principal/students',  label: 'Student Overview',  icon: Users                 },
  { path: '/principal/reports',   label: 'Reports',           icon: FileText              },
];

export default function PrincipalLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || 'PR';

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Deep indigo sidebar for principal */}
      <aside className={`relative flex flex-col bg-indigo-950 text-white transition-all duration-300 shrink-0 ${collapsed?'w-14':'w-60'}`}>
        <div className={`flex items-center gap-3 p-3 border-b border-indigo-900 ${collapsed?'justify-center':''}`}>
          <div className="w-9 h-9 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5 text-white" />
          </div>
          {!collapsed && <div><p className="text-xs font-bold">Principal Portal</p><p className="text-[10px] text-indigo-400">Executive Overview</p></div>}
        </div>
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {!collapsed && <p className="text-[9px] font-bold text-indigo-600 px-2 mb-2 tracking-widest">OVERVIEW</p>}
          {NAV.map(item => (
            <NavLink key={item.path} to={item.path} end={item.end}
              className={({isActive})=>`flex items-center gap-3 px-2 py-2 rounded-md text-xs font-medium transition-all
                ${isActive?'bg-indigo-500 text-white':'text-indigo-300 hover:bg-indigo-900 hover:text-white'} ${collapsed?'justify-center':''}`}>
              <item.icon className="w-4 h-4 shrink-0"/>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className={`border-t border-indigo-900 p-3 ${collapsed?'flex justify-center':'flex items-center gap-2'}`}>
          <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold shrink-0">{initials}</div>
          {!collapsed && (<><div className="flex-1 min-w-0"><p className="text-xs font-semibold text-white truncate">{user?.name}</p><p className="text-[10px] text-indigo-400">Principal</p></div>
            <button onClick={()=>{logout();navigate('/login');}} className="p-1 text-indigo-500 hover:text-red-400"><LogOut className="w-3.5 h-3.5"/></button></>)}
        </div>
        <button onClick={()=>setCollapsed(!collapsed)} className="absolute -right-3 top-16 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-md hover:bg-indigo-400 z-10">
          {collapsed?<ChevronRight className="w-3 h-3"/>:<ChevronLeft className="w-3 h-3"/>}
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between sticky top-0 z-10">
          <div><p className="text-sm font-bold text-gray-900">Executive Dashboard</p><p className="text-[10px] text-gray-400">Kenza International School · {new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'})}</p></div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Read Only</span>
            <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">{initials}</div>
          </div>
        </header>
        <main className="flex-1 p-5 overflow-y-auto"><Outlet /></main>
      </div>
    </div>
  );
}
