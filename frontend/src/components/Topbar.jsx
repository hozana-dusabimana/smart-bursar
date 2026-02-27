import { Menu, Bell } from "lucide-react";
import { useLocation } from "react-router-dom";
import { SCHOOL, TODAY } from "../data/mockData";

const PAGE_TITLES = {
  "/":           { title: "Daily Operations",  sub: "Today's activity at a glance" },
  "/collect":    { title: "Collect Payment",   sub: "Record a student fee payment and print receipt" },
  "/student":    { title: "Student Fee Card",  sub: "View full ledger for any student" },
  "/cashbook":   { title: "Cash Book",         sub: "Today's running record of all transactions" },
  "/class":      { title: "Class Collection",  sub: "Fee payment status by class" },
  "/defaulters": { title: "Defaulters List",   sub: "Students with outstanding balances" },
  "/expenses":   { title: "Expenses",          sub: "Log and track school expenditures" },
  "/settings":   { title: "Settings",          sub: "Fee structure and system configuration" },
};

export default function Topbar({ collapsed, setCollapsed }) {
  const { pathname } = useLocation();
  const page = PAGE_TITLES[pathname] || PAGE_TITLES["/"];

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        {collapsed && (
          <button onClick={() => setCollapsed(false)} className="p-1 text-gray-500 hover:text-gray-800">
            <Menu className="w-4 h-4" />
          </button>
        )}
        <div>
          <h1 className="text-sm font-bold text-gray-900">{page.title}</h1>
          <p className="text-[10px] text-gray-400">{page.sub}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold text-gray-800">{SCHOOL.term} · {SCHOOL.year}</p>
          <p className="text-[10px] text-gray-400">{TODAY}</p>
        </div>
        <button className="relative p-1.5 rounded-full hover:bg-gray-100">
          <Bell className="w-4 h-4 text-gray-500" />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="w-7 h-7 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold">
          US
        </div>
      </div>
    </header>
  );
}
