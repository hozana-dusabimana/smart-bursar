import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Receipt, Search, BookMarked, ClipboardList,
  AlertTriangle, Clock, CheckCircle2, ArrowRight, Loader2,
  Banknote, Smartphone, CreditCard, TrendingUp,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { fmt } from '../utils/format';

const quickActions = [
  { to: '/app/collect',    label: 'Collect Payment',   sub: 'Record a fee payment & print receipt', icon: Receipt,       primary: true  },
  { to: '/app/student',    label: 'Student Fee Card',  sub: "Look up a student's full ledger",      icon: Search,        primary: false },
  { to: '/app/cashbook',   label: "Today's Cash Book", sub: "Running record of today's entries",    icon: BookMarked,    primary: false },
  { to: '/app/class',      label: 'Class Collection',  sub: 'Fee status sheet by class',            icon: ClipboardList, primary: false },
  { to: '/app/defaulters', label: 'Defaulters List',   sub: 'Students with unpaid balances',        icon: AlertTriangle, primary: false },
];

const greetingByHour = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function DailyOperations() {
  const { user } = useAuth();
  const [summary,  setSummary]  = useState(null);
  const [cashbook, setCashbook] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

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
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
      <span className="text-sm text-gray-400 font-medium">Loading dashboard...</span>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-sm text-red-700 flex items-center gap-3">
      <AlertTriangle className="w-5 h-5 shrink-0" />
      <span>Failed to load: {error}</span>
    </div>
  );

  const day  = summary?.day  || {};
  const term = summary?.term || {};

  return (
    <div className="space-y-5">

      {/* ── Hero Greeting Banner ── */}
      <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-5 sm:p-6 text-white overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />

        <div className="relative">
          <p className="text-xs text-blue-200 font-medium">{today}</p>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {greetingByHour()}, {user?.name?.split(' ')[0] || 'Bursar'}
          </h2>
          <p className="text-sm text-blue-100/80 mt-0.5">
            {summary?.term?.term_name} · {summary?.term?.academic_year}
          </p>

          {/* Stat pills */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Today's Receipts", value: Number(day.entries || 0), icon: Receipt },
              { label: 'Total Collected',  value: fmt(Number(day.total || 0)), icon: TrendingUp },
              { label: 'Cash Received',    value: fmt(Number(day.cash || 0)), icon: Banknote },
              { label: 'MoMo / Bank',      value: fmt(Number(day.momo || 0) + Number(day.bank || 0)), icon: Smartphone },
            ].map(s => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-3.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <s.icon className="w-3 h-3 text-blue-200 shrink-0" />
                  <p className="text-[10px] text-blue-200 font-medium">{s.label}</p>
                </div>
                <p className="text-base sm:text-lg font-bold">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Actions</p>
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className={`flex items-center gap-3.5 p-4 rounded-2xl transition-all duration-150 group border
                ${a.primary
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700 shadow-lg shadow-blue-600/20'
                  : 'bg-white text-gray-800 border-gray-100 hover:border-blue-200 hover:shadow-card-md shadow-card'}`}
            >
              <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${a.primary ? 'bg-blue-500/60' : 'bg-gray-50 group-hover:bg-blue-50'}`}>
                <a.icon className={`w-5 h-5 ${a.primary ? 'text-white' : 'text-gray-600 group-hover:text-blue-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-semibold leading-tight ${a.primary ? 'text-white' : 'text-gray-900'}`}>{a.label}</p>
                <p className={`text-[11px] mt-0.5 truncate ${a.primary ? 'text-blue-100' : 'text-gray-400'}`}>{a.sub}</p>
              </div>
              <ArrowRight className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${a.primary ? 'text-blue-200' : 'text-gray-300 group-hover:text-blue-400'}`} />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Bottom two cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Term Payment Status */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-bold text-gray-900">{summary?.term?.term_name} — Payment Status</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{Number(term.total_students || 0)} students enrolled</p>
            </div>
            <Link to="/app/defaulters" className="text-[11px] text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-0.5 transition-colors">
              Defaulters <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: 'Fully Cleared',  count: Number(term.cleared || 0), bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
              { label: 'Partial Payment',count: Number(term.partial || 0), bar: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'       },
              { label: 'Not Yet Paid',   count: Number(term.unpaid  || 0), bar: 'bg-red-400',     badge: 'bg-red-50 text-red-700 ring-1 ring-red-200'         },
            ].map(row => {
              const total = Number(term.total_students || 1);
              const pct   = Math.round((row.count / total) * 100);
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${row.badge}`}>
                        {row.count}
                      </span>
                      <span className="text-[12px] text-gray-600 font-medium">{row.label}</span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-semibold">{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`${row.bar} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's Entries */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between shrink-0">
            <p className="text-[13px] font-bold text-gray-900">Today's Entries</p>
            <Link to="/app/cashbook" className="text-[11px] text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-0.5 transition-colors">
              Full Cash Book <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {(!cashbook?.entries || cashbook.entries.length === 0) ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-gray-300">
              <Receipt className="w-10 h-10 mb-3" />
              <p className="text-sm font-medium text-gray-400">No payments recorded today yet</p>
              <Link to="/app/collect" className="mt-3 text-xs text-blue-600 font-semibold hover:underline">
                Collect first payment →
              </Link>
            </div>
          ) : (
            <div className="flex-1 divide-y divide-gray-50 overflow-y-auto">
              {cashbook.entries.slice(0, 6).map((entry) => (
                <div key={entry.receipt_no} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                  <div className="w-9 shrink-0 text-center">
                    <Clock className="w-3 h-3 text-gray-300 mx-auto mb-0.5" />
                    <p className="text-[10px] text-gray-400 font-mono leading-none">
                      {String(entry.payment_time || '').slice(0, 5)}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 truncate">{entry.student_name}</p>
                    <p className="text-[10px] text-gray-400">{entry.receipt_no} · {entry.class}{entry.stream}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-bold text-gray-900">{fmt(entry.amount)}</p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                      ${entry.payment_method === 'Cash' ? 'bg-emerald-100 text-emerald-700'
                       : entry.payment_method === 'MoMo' ? 'bg-amber-100 text-amber-700'
                       : 'bg-indigo-100 text-indigo-700'}`}>
                      {entry.payment_method}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="px-5 py-3 bg-slate-50 border-t border-gray-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[11px] text-gray-500 font-semibold">Day Total</span>
            </div>
            <span className="text-sm font-bold text-gray-900">{fmt(cashbook?.totals?.total || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
