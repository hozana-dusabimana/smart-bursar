import { NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen, ChevronLeft, ChevronRight, LogOut,
  LayoutDashboard, Search, BookMarked,
  Receipt, Wallet, ClipboardList, AlertTriangle, Settings, GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { path: '/app',            label: 'Daily Operations',   icon: LayoutDashboard, section: 'main'    },
  { path: '/app/collect',     label: 'Collect Payment',    icon: Receipt,         section: 'main'    },
  { path: '/app/student',     label: 'Student Fee Card',   icon: Search,      section: 'main'    },
  { path: '/app/cashbook',    label: 'Cash Book',          icon: BookMarked,      section: 'main'    },
  { path: '/app/enrollment',  label: 'Student Enrollment', icon: GraduationCap,   section: 'students'},
  { path: '/app/class',       label: 'Class Collection',   icon: ClipboardList,   section: 'reports' },
  { path: '/app/defaulters',  label: 'Defaulters List',    icon: AlertTriangle,   section: 'reports' },
  { path: '/app/expenses',    label: 'Expenses',           icon: Wallet,          section: 'reports' },
  { path: '/app/settings',    label: 'Settings',           icon: Settings,        section: 'admin'   },
];

const SECTIONS = { main: 'BURSAR TOOLS', students: 'STUDENTS', reports: 'REPORTS', admin: 'ADMIN' };

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const grouped = {};
  NAV.forEach(n => {
    if (!grouped[n.section]) grouped[n.section] = [];
    grouped[n.section].push(n);
  });

  const initials = user?.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || 'U';

  return (
    <aside className={`relative flex flex-col bg-slate-900 text-white transition-all duration-300
      ${collapsed ? 'w-14' : 'w-60'} min-h-screen shrink-0`}>

      <div className={`flex items-center gap-3 p-3 border-b border-slate-700 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-xs font-bold text-white leading-tight">Smart Bursar</p>
            <p className="text-[10px] text-slate-400">{user?.school_name || 'Kenza International'}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {Object.entries(grouped).map(([section, items]) => (
          <div key={section}>
            {!collapsed && (
              <p className="text-[9px] font-bold text-slate-500 px-2 pt-3 pb-1.5 tracking-widest">{SECTIONS[section]}</p>
            )}
            {items.map(item => (
              <NavLink key={item.path} to={item.path} end={item.path === '/app'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-2 py-2 rounded-md text-xs font-medium transition-all
                  ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                  ${collapsed ? 'justify-center' : ''}`
                }>
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className={`border-t border-slate-700 p-3 ${collapsed ? 'flex justify-center' : 'flex items-center gap-2'}`}>
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold shrink-0">{initials}</div>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 capitalize">{user?.role}</p>
            </div>
            <button onClick={handleLogout} className="p-1 text-slate-500 hover:text-red-400 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      <button onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-blue-500 z-10">
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
