import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { BarChart3, CheckSquare, FileText, ChevronLeft, ChevronRight, LogOut, ShieldCheck, TrendingUp, ScrollText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { path: '/accountant',                label: 'Overview',         icon: BarChart3,   end: true },
  { path: '/accountant/reconciliation', label: 'Reconciliation',   icon: TrendingUp            },
  { path: '/accountant/expenses',       label: 'Expense Approval', icon: CheckSquare           },
  { path: '/accountant/ledger',         label: 'Full Ledger',      icon: ScrollText            },
  { path: '/accountant/audit',          label: 'Audit Log',        icon: ShieldCheck           },
  { path: '/accountant/reports',        label: 'Reports',          icon: FileText              },
];

export default function AccountantLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || 'AC';

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={`relative flex flex-col bg-slate-800 text-white transition-all duration-300 shrink-0 ${collapsed ? 'w-14' : 'w-60'}`}>
        <div className={`flex items-center gap-3 p-3 border-b border-slate-700 ${collapsed?'justify-center':''}`}>
          <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          {!collapsed && <div><p className="text-xs font-bold">Accountant Portal</p><p className="text-[10px] text-slate-400">Finance & Audit</p></div>}
        </div>
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {!collapsed && <p className="text-[9px] font-bold text-slate-500 px-2 mb-2 tracking-widest">FINANCE TOOLS</p>}
          {NAV.map(item => (
            <NavLink key={item.path} to={item.path} end={item.end}
              className={({ isActive }) => `flex items-center gap-3 px-2 py-2 rounded-md text-xs font-medium transition-all
                ${isActive?'bg-teal-600 text-white':'text-slate-400 hover:bg-slate-700 hover:text-white'} ${collapsed?'justify-center':''}`}>
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className={`border-t border-slate-700 p-3 ${collapsed?'flex justify-center':'flex items-center gap-2'}`}>
          <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-xs font-bold shrink-0">{initials}</div>
          {!collapsed && (<><div className="flex-1 min-w-0"><p className="text-xs font-semibold text-white truncate">{user?.name}</p><p className="text-[10px] text-slate-400">Accountant</p></div>
            <button onClick={() => { logout(); navigate('/login'); }} className="p-1 text-slate-500 hover:text-red-400"><LogOut className="w-3.5 h-3.5" /></button></>)}
        </div>
        <button onClick={() => setCollapsed(!collapsed)} className="absolute -right-3 top-16 w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-teal-500 z-10">
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between sticky top-0 z-10">
          <div><p className="text-sm font-bold text-gray-900">Finance & Accounts</p><p className="text-[10px] text-gray-400">Kenza International School</p></div>
          <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">{initials}</div>
        </header>
        <main className="flex-1 p-5 overflow-y-auto"><Outlet /></main>
      </div>
    </div>
  );
}
