import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Shield, Users, Settings, BookOpen, ChevronLeft, ChevronRight,
  LogOut, Activity, GraduationCap, Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { path: '/admin',               label: 'Dashboard',         icon: Activity,      end: true },
  { path: '/admin/enrollment',    label: 'Student Enrollment', icon: GraduationCap,           },
  { path: '/admin/users',         label: 'User Management',    icon: Users                    },
  { path: '/admin/notifications', label: 'Notifications',      icon: Bell                     },
  { path: '/admin/settings',      label: 'System Settings',    icon: Settings                 },
  { path: '/admin/terms',         label: 'Academic Terms',     icon: BookOpen                 },
];

const SECTIONS = { 0:'OVERVIEW', 1:'STUDENTS', 2:'SYSTEM', 4:'SYSTEM' };

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || 'AD';

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={`relative flex flex-col bg-gray-900 text-white transition-all duration-300 shrink-0 ${collapsed?'w-14':'w-60'}`}>
        {/* Header */}
        <div className={`flex items-center gap-3 p-3 border-b border-gray-800 ${collapsed?'justify-center':''}`}>
          <div className="w-9 h-9 rounded-lg bg-orange-600 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-white"/>
          </div>
          {!collapsed && (
            <div>
              <p className="text-xs font-bold text-white">Admin Portal</p>
              <p className="text-[10px] text-gray-500">{user?.school_name || 'Administration'}</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {!collapsed && <p className="text-[9px] font-bold text-gray-600 px-2 mb-1 tracking-widest">OVERVIEW</p>}
          <NavLink to="/admin" end
            className={({isActive})=>`flex items-center gap-3 px-2 py-2 rounded-md text-xs font-medium transition-all
              ${isActive?'bg-orange-600 text-white':'text-gray-400 hover:bg-gray-800 hover:text-white'} ${collapsed?'justify-center':''}`}>
            <Activity className="w-4 h-4 shrink-0"/>{!collapsed && <span>Dashboard</span>}
          </NavLink>

          {!collapsed && <p className="text-[9px] font-bold text-gray-600 px-2 pt-3 pb-1 tracking-widest">STUDENTS</p>}
          <NavLink to="/admin/enrollment"
            className={({isActive})=>`flex items-center gap-3 px-2 py-2 rounded-md text-xs font-medium transition-all
              ${isActive?'bg-orange-600 text-white':'text-gray-400 hover:bg-gray-800 hover:text-white'} ${collapsed?'justify-center':''}`}>
            <GraduationCap className="w-4 h-4 shrink-0"/>{!collapsed && <span>Student Enrollment</span>}
          </NavLink>

          {!collapsed && <p className="text-[9px] font-bold text-gray-600 px-2 pt-3 pb-1 tracking-widest">SYSTEM</p>}
          {[
            { path: '/admin/users',         label: 'User Management',  icon: Users     },
            { path: '/admin/notifications', label: 'Notifications',    icon: Bell      },
            { path: '/admin/settings',      label: 'System Settings',  icon: Settings  },
            { path: '/admin/terms',         label: 'Academic Terms',   icon: BookOpen  },
          ].map(item=>(
            <NavLink key={item.path} to={item.path}
              className={({isActive})=>`flex items-center gap-3 px-2 py-2 rounded-md text-xs font-medium transition-all
                ${isActive?'bg-orange-600 text-white':'text-gray-400 hover:bg-gray-800 hover:text-white'} ${collapsed?'justify-center':''}`}>
              <item.icon className="w-4 h-4 shrink-0"/>{!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className={`border-t border-gray-800 p-3 ${collapsed?'flex justify-center':'flex items-center gap-2'}`}>
          <div className="w-7 h-7 rounded-full bg-orange-600 flex items-center justify-center text-xs font-bold shrink-0">{initials}</div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-gray-500">Administrator</p>
              </div>
              <button onClick={()=>{logout();navigate('/login');}} className="p-1 text-gray-600 hover:text-red-400">
                <LogOut className="w-3.5 h-3.5"/>
              </button>
            </>
          )}
        </div>

        {/* Collapse toggle */}
        <button onClick={()=>setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-orange-500 z-10">
          {collapsed?<ChevronRight className="w-3 h-3"/>:<ChevronLeft className="w-3 h-3"/>}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between sticky top-0 z-10">
          <div>
            <p className="text-sm font-bold text-gray-900">Administration</p>
            <p className="text-[10px] text-gray-400">{user?.school_name || 'Kenza International School'}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full">Admin</span>
            <div className="w-7 h-7 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-bold">{initials}</div>
          </div>
        </header>
        <main className="flex-1 p-5 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
