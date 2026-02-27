import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, CheckCircle2, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { fmt } from '../../utils/format';

export default function AccountantOverview() {
  const [summary, setSummary] = useState(null);
  const [cashbook, setCashbook] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/daily-summary'),
      api.get('/cashbook/today'),
      api.get('/expenses'),
    ]).then(([s, c, e]) => {
      setSummary(s.data);
      setCashbook(c.data);
      setExpenses(e.data || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 text-teal-600 animate-spin" /><span className="ml-2 text-sm text-gray-500">Loading...</span></div>;

  const term = summary?.term || {};
  const day  = summary?.day  || {};
  const pending = expenses.filter(e => e.status === 'Pending');
  const totalExpenses = expenses.filter(e=>e.status==='Approved').reduce((s,e)=>s+Number(e.amount),0);
  const totalCollected = Number(term.total_collected || 0);
  const totalExpected  = Number(term.total_fees_expected || 0);
  const netBalance     = totalCollected - totalExpenses;

  return (
    <div className="max-w-5xl space-y-6">
      {/* Term Financial Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Term Revenue',       value: fmt(totalCollected),  icon: TrendingUp,   bg: 'bg-teal-600',    sub: `${Math.round((totalCollected/Math.max(totalExpected,1))*100)}% of target` },
          { label: 'Total Expenses',     value: fmt(totalExpenses),   icon: TrendingDown, bg: 'bg-red-500',     sub: `${pending.length} pending approval` },
          { label: 'Net Balance',        value: fmt(netBalance),      icon: CheckCircle2, bg: netBalance>=0?'bg-emerald-600':'bg-red-600', sub: netBalance >= 0 ? 'Surplus' : 'Deficit' },
          { label: 'Outstanding Fees',   value: fmt(Math.max(0, totalExpected - totalCollected)), icon: AlertTriangle, bg: 'bg-amber-500', sub: `${Number(term.unpaid||0)+Number(term.partial||0)} students` },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center shrink-0`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">{card.label}</p>
              <p className="text-sm font-extrabold text-gray-900 mt-0.5">{card.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Expenses Alert */}
      {pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800">{pending.length} expenses awaiting your approval</p>
              <p className="text-xs text-amber-600">Total pending: {fmt(pending.reduce((s,e)=>s+Number(e.amount),0))}</p>
            </div>
          </div>
          <Link to="/accountant/expenses" className="flex items-center gap-1.5 bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-amber-700">
            Review <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Cash by Method */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-900">Today's Collection by Method</p>
            <p className="text-[10px] text-gray-400">{cashbook?.entries?.length || 0} transactions · {new Date().toLocaleDateString('en-GB')}</p>
          </div>
          <div className="p-4 space-y-3">
            {[
              { method: 'Cash',  value: cashbook?.totals?.cash || 0,  color: 'bg-green-500'  },
              { method: 'MoMo',  value: cashbook?.totals?.momo || 0,  color: 'bg-yellow-500' },
              { method: 'Bank',  value: cashbook?.totals?.bank || 0,  color: 'bg-indigo-500' },
            ].map(m => {
              const total = cashbook?.totals?.total || 1;
              const pct = Math.round((Number(m.value) / total) * 100);
              return (
                <div key={m.method}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-gray-700">{m.method}</span>
                    <span className="font-bold text-gray-900">{fmt(m.value)}</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div className={`${m.color} h-2 rounded-full`} style={{width:`${pct}%`}} />
                  </div>
                </div>
              );
            })}
            <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-extrabold text-gray-900">
              <span>Total Today</span><span className="text-teal-700">{fmt(cashbook?.totals?.total || 0)}</span>
            </div>
          </div>
        </div>

        {/* Student Payment Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-900">Term Collection Status</p>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#0d9488" strokeWidth="12"
                    strokeDasharray={`${2*Math.PI*40 * (totalCollected/Math.max(totalExpected,1))} ${2*Math.PI*40}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-lg font-extrabold text-gray-900">{Math.round((totalCollected/Math.max(totalExpected,1))*100)}%</p>
                  <p className="text-[9px] text-gray-500">collected</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              {[
                { label:'Cleared',  count: Number(term.cleared||0),  color:'bg-emerald-500' },
                { label:'Partial',  count: Number(term.partial||0),  color:'bg-blue-500'    },
                { label:'Unpaid',   count: Number(term.unpaid||0),   color:'bg-red-400'     },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.color} shrink-0`} />
                  <span className="text-gray-600 flex-1">{s.label}</span>
                  <span className="font-bold text-gray-900">{s.count} students</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
