import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Receipt, Search, BookMarked, ClipboardList,
  AlertTriangle, Clock, CheckCircle2, ArrowRight, Loader2,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { fmt } from '../utils/format';

const quickActions = [
  { to: '/collect',    label: 'Collect Payment',   sub: 'Record a fee payment & print receipt', icon: Receipt,       primary: true  },
  { to: '/student',    label: 'Student Fee Card',  sub: "Look up a student's full ledger",      icon: Search,    primary: false },
  { to: '/cashbook',   label: "Today's Cash Book", sub: "Running record of today's entries",    icon: BookMarked,    primary: false },
  { to: '/class',      label: 'Class Collection',  sub: 'Fee status sheet by class',            icon: ClipboardList, primary: false },
  { to: '/defaulters', label: 'Defaulters List',   sub: 'Students with unpaid balances',        icon: AlertTriangle, primary: false },
];

export default function DailyOperations() {
  const { user } = useAuth();
  const [summary,    setSummary]    = useState(null);
  const [cashbook,   setCashbook]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [sumRes, cbRes] = await Promise.all([
          api.get('/reports/daily-summary'),
          api.get('/cashbook/today'),
        ]);
        setSummary(sumRes.data);
        setCashbook(cbRes.data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const today = new Date().toLocaleDateString('en-RW', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      <span className="ml-2 text-sm text-gray-500">Loading daily summary...</span>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-700">
      Failed to load: {error}
    </div>
  );

  const day  = summary?.day  || {};
  const term = summary?.term || {};

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Greeting */}
      <div className="bg-blue-700 rounded-xl p-5 text-white">
        <p className="text-xs text-blue-200 font-medium">{today}</p>
        <h2 className="text-lg font-bold mt-1">
          Good morning, {user?.name?.split(' ')[0] || 'Bursar'} 👋
        </h2>
        <p className="text-sm text-blue-100 mt-0.5">
          {summary?.term?.term_name} · {summary?.term?.academic_year} · Kenza International School
        </p>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Today's Entries",    value: Number(day.entries || 0)          },
            { label: 'Total Collected',    value: fmt(Number(day.total || 0))       },
            { label: 'Cash on Hand',       value: fmt(Number(day.cash || 0))        },
            { label: 'MoMo / Bank',        value: fmt(Number(day.momo || 0) + Number(day.bank || 0)) },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-lg p-3">
              <p className="text-[10px] text-blue-200">{s.label}</p>
              <p className="text-sm font-bold mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">What do you want to do?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((a) => (
            <Link key={a.to} to={a.to}
              className={`flex items-center gap-4 p-4 rounded-xl shadow-sm transition-all group
                ${a.primary
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-200'}`}>
              <div className={`p-2.5 rounded-lg shrink-0 ${a.primary ? 'bg-blue-500' : 'bg-gray-100'}`}>
                <a.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{a.label}</p>
                <p className={`text-[11px] mt-0.5 ${a.primary ? 'text-blue-100' : 'text-gray-500'}`}>{a.sub}</p>
              </div>
              <ArrowRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-all" />
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Term Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-900">{summary?.term?.term_name} Payment Status</p>
            <p className="text-[10px] text-gray-500">{Number(term.total_students || 0)} enrolled</p>
          </div>
          <div className="p-4 space-y-3">
            {[
              { label: 'Fully Cleared',  count: Number(term.cleared || 0), color: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-800' },
              { label: 'Partial',        count: Number(term.partial || 0), color: 'bg-blue-500',    light: 'bg-blue-50 text-blue-800'       },
              { label: 'Not Yet Paid',   count: Number(term.unpaid  || 0), color: 'bg-red-500',     light: 'bg-red-50 text-red-800'         },
            ].map(row => {
              const total = Number(term.total_students || 1);
              const pct   = Math.round((row.count / total) * 100);
              return (
                <div key={row.label} className="flex items-center gap-3">
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${row.light} w-24 text-center shrink-0`}>
                    {row.count} students
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className={`${row.color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-500 w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
          <div className="px-4 pb-4">
            <Link to="/defaulters" className="text-[11px] text-blue-600 hover:underline flex items-center gap-1">
              View defaulters list <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Today's Entries */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-900">Today's Entries</p>
            <Link to="/cashbook" className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5">
              Cash Book <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {(!cashbook?.entries || cashbook.entries.length === 0) ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">No payments recorded today yet.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {cashbook.entries.slice(0, 5).map((entry) => (
                <div key={entry.receipt_no} className="px-4 py-2.5 flex items-center gap-3">
                  <div className="w-8 text-[10px] text-gray-400 shrink-0 flex flex-col items-center">
                    <Clock className="w-3 h-3 mb-0.5" />
                    {String(entry.payment_time || '').slice(0, 5)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{entry.student_name}</p>
                    <p className="text-[10px] text-gray-400">{entry.receipt_no} · {entry.class}{entry.stream}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-gray-900">{fmt(entry.amount)}</p>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full
                      ${entry.payment_method==='Cash'?'bg-green-100 text-green-700'
                       :entry.payment_method==='MoMo'?'bg-yellow-100 text-yellow-700'
                       :'bg-indigo-100 text-indigo-700'}`}>
                      {entry.payment_method}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] text-gray-600 font-medium">Running Total</span>
            </div>
            <span className="text-xs font-bold text-gray-900">{fmt(cashbook?.totals?.total || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
