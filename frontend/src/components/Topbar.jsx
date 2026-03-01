import { Menu, Bell } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PAGE_TITLES = {
  "/app":              { title: "Daily Operations",  sub: "Today's activity at a glance" },
  "/app/collect":      { title: "Collect Payment",   sub: "Record a fee payment & print receipt" },
  "/app/student":      { title: "Student Fee Card",  sub: "View full ledger for any student" },
  "/app/cashbook":     { title: "Cash Book",         sub: "Running record of all transactions" },
  "/app/enrollment":   { title: "Student Enrollment",sub: "Register and manage students" },
  "/app/class":        { title: "Class Collection",  sub: "Fee payment status by class" },
  "/app/defaulters":   { title: "Defaulters List",   sub: "Students with outstanding balances" },
  "/app/expenses":     { title: "Expenses",          sub: "Log and track school expenditures" },
  "/app/settings":     { title: "Settings",          sub: "Fee structure and system configuration" },
};

export default function Topbar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const page = PAGE_TITLES[pathname] || { title: "Smart Bursar", sub: "School Finance Management" };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'US';
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <header className="bg-white border-b border-gray-100 px-4 py-0 flex items-center justify-between h-14 shrink-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger — always visible on mobile */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 -ml-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop collapse toggle — when collapsed */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="hidden lg:flex p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div>
          <h1 className="text-[15px] font-bold text-gray-900 leading-tight">{page.title}</h1>
          <p className="text-[11px] text-gray-400 hidden sm:block">{page.sub}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Date pill — hidden on smallest screens */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-gray-100 rounded-xl px-3 py-1.5">
          <span className="text-[11px] font-semibold text-gray-700">{today}</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
          <Bell className="w-4.5 h-4.5" style={{width:'18px',height:'18px'}} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-1 ring-white" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-[11px] font-bold shadow-sm cursor-default select-none">
          {initials}
        </div>
      </div>
    </header>
  );
}
