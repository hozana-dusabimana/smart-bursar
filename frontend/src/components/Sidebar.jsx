import { NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen, ChevronLeft, ChevronRight, LogOut,
  LayoutDashboard, Search, BookMarked,
  Receipt, Wallet, ClipboardList, AlertTriangle, Settings, GraduationCap, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { path: '/app',            label: 'Daily Operations',   icon: LayoutDashboard, section: 'main'    },
  { path: '/app/collect',    label: 'Collect Payment',    icon: Receipt,         section: 'main'    },
  { path: '/app/student',    label: 'Student Fee Card',   icon: Search,          section: 'main'    },
  { path: '/app/cashbook',   label: 'Cash Book',          icon: BookMarked,      section: 'main'    },
  { path: '/app/enrollment', label: 'Student Enrollment', icon: GraduationCap,   section: 'students'},
  { path: '/app/class',      label: 'Class Collection',   icon: ClipboardList,   section: 'reports' },
  { path: '/app/defaulters', label: 'Defaulters List',    icon: AlertTriangle,   section: 'reports' },
  { path: '/app/expenses',   label: 'Expenses',           icon: Wallet,          section: 'reports' },
  { path: '/app/settings',   label: 'Settings',           icon: Settings,        section: 'admin'   },
];

const SECTIONS = { main: 'BURSAR TOOLS', students: 'STUDENTS', reports: 'REPORTS', admin: 'ADMIN' };

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const grouped = {};
  NAV.forEach(n => {
    if (!grouped[n.section]) grouped[n.section] = [];
    grouped[n.section].push(n);
  });

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <aside
      className={`
        flex flex-col bg-slate-900 text-white shrink-0 h-screen
        fixed lg:relative z-40
        sidebar-transition
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${collapsed ? 'lg:w-[72px]' : 'w-[240px]'}
      `}
    >
      {/* Logo header */}
      <div className={`flex items-center gap-3 px-4 py-4 border-b border-slate-700/60 shrink-0 ${collapsed ? 'lg:justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/40">
          <BookOpen className="w-4.5 h-4.5 text-white" style={{width:'18px',height:'18px'}} />
        </div>
        {(!collapsed || mobileOpen) && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-none">Smart Bursar</p>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{user?.school_name || 'Kenza International'}</p>
          </div>
        )}
        {/* Mobile close button */}
        {mobileOpen && (
          <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white p-1 -mr-1">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto">
        {Object.entries(grouped).map(([section, items]) => (
          <div key={section}>
            {(!collapsed || mobileOpen) && (
              <p className="text-[9px] font-bold text-slate-500 px-2 pt-4 pb-1.5 tracking-[0.15em] uppercase">
                {SECTIONS[section]}
              </p>
            )}
            {collapsed && !mobileOpen && <div className="my-2 border-t border-slate-800" />}
            {items.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/app'}
                title={collapsed && !mobileOpen ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}
                  ${collapsed && !mobileOpen ? 'lg:justify-center lg:px-2' : ''}`
                }
              >
                <item.icon className="w-[17px] h-[17px] shrink-0" />
                {(!collapsed || mobileOpen) && (
                  <span className="truncate">{item.label}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className={`border-t border-slate-700/60 p-3 shrink-0 ${collapsed && !mobileOpen ? 'flex justify-center' : 'flex items-center gap-2.5'}`}>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
          {initials}
        </div>
        {(!collapsed || mobileOpen) && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white truncate leading-none">{user?.name}</p>
              <p className="text-[10px] text-slate-400 capitalize mt-0.5">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Desktop collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute -right-3 top-[72px] w-6 h-6 bg-blue-600 rounded-full items-center justify-center text-white shadow-md hover:bg-blue-500 z-10 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
