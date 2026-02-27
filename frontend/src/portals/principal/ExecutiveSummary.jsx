import { useEffect, useState } from 'react';
import { Loader2, TrendingUp, TrendingDown, Users, AlertTriangle, CheckCircle2, DollarSign } from 'lucide-react';
import api from '../../api/client';
import { fmt } from '../../utils/format';

function RingChart({ pct, color, size = 80 }) {
  const r = 35, circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" className="-rotate-90">
      <circle cx="40" cy="40" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
      <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${circ * pct / 100} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

export default function ExecutiveSummary() {
  const [summary,  setSummary]  = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [defaulters, setDefaulters] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/daily-summary'),
      api.get('/expenses'),
      api.get('/reports/defaulters'),
    ]).then(([s, e, d]) => { setSummary(s.data); setExpenses(e.data||[]); setDefaulters(d.data); })
    .finally(()=>setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 text-indigo-500 animate-spin"/><span className="ml-2 text-sm text-gray-500">Loading...</span></div>;

  const term       = summary?.term  || {};
  const day        = summary?.day   || {};
  const collected  = Number(term.total_collected      || 0);
  const expected   = Number(term.total_fees_expected  || 0);
  const outstanding= Math.max(0, expected - collected);
  const approved   = expenses.filter(e=>e.status==='Approved').reduce((s,e)=>s+Number(e.amount),0);
  const pending    = expenses.filter(e=>e.status==='Pending').length;
  const collPct    = expected ? Math.round((collected/expected)*100) : 0;
  const total      = Number(term.total_students||0);
  const cleared    = Number(term.cleared||0);
  const partial    = Number(term.partial||0);
  const unpaid     = Number(term.unpaid||0);

  return (
    <div className="max-w-5xl space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 rounded-2xl p-6 text-white">
        <p className="text-xs text-indigo-300">Executive Summary · {summary?.term?.term_name} {summary?.term?.academic_year}</p>
        <h1 className="text-xl font-extrabold mt-1">Good morning, {(summary?.user?.name||'Principal').split(' ')[0] || 'Director'} 👋</h1>
        <p className="text-sm text-indigo-200 mt-0.5">Here's how the school's finances are performing this term.</p>
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Collected', value: fmt(collected)   },
            { label: 'Expected',  value: fmt(expected)    },
            { label: 'Outstanding', value: fmt(outstanding) },
            { label: "Today's Intake", value: fmt(Number(day.total||0)) },
          ].map(s=>(
            <div key={s.label} className="bg-white/10 rounded-xl p-3">
              <p className="text-[10px] text-indigo-300">{s.label}</p>
              <p className="text-sm font-extrabold mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Total Students', value: total,    icon: Users,         bg:'bg-blue-500',    sub:'enrolled' },
          { label:'Fully Cleared',  value: cleared,  icon: CheckCircle2,  bg:'bg-emerald-600', sub:`${Math.round((cleared/Math.max(total,1))*100)}% of students` },
          { label:'Defaulters',     value: Number(defaulters?.count||0), icon:AlertTriangle, bg:'bg-red-500', sub: fmt(defaulters?.totalOutstanding||0)+' outstanding' },
          { label:'Expenses Approved', value: fmt(approved), icon:DollarSign, bg:'bg-amber-500', sub:`${pending} pending approval` },
        ].map(c=>(
          <div key={c.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
              <c.icon className="w-5 h-5 text-white"/>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">{c.label}</p>
              <p className="text-sm font-extrabold text-gray-900 mt-0.5">{c.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{c.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Collection Ring Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col items-center">
          <p className="text-xs font-bold text-gray-700 mb-4 self-start">Collection Rate</p>
          <div className="relative">
            <RingChart pct={collPct} color="#6366f1" size={100} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-extrabold text-indigo-700">{collPct}%</span>
              <span className="text-[9px] text-gray-500">of target</span>
            </div>
          </div>
          <div className="mt-4 space-y-1 w-full text-xs">
            {[
              {label:'Collected',   value:fmt(collected),   color:'text-indigo-700'},
              {label:'Outstanding', value:fmt(outstanding), color:'text-red-600'},
            ].map(r=>(
              <div key={r.label} className="flex justify-between"><span className="text-gray-500">{r.label}</span><span className={`font-bold ${r.color}`}>{r.value}</span></div>
            ))}
          </div>
        </div>

        {/* Student Payment Status bars */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs font-bold text-gray-700 mb-4">Student Payment Breakdown</p>
          <div className="space-y-4">
            {[
              {label:'Fully Paid',   count:cleared, color:'bg-emerald-500', pct:Math.round((cleared/Math.max(total,1))*100)},
              {label:'Part Paid',    count:partial, color:'bg-blue-500',    pct:Math.round((partial/Math.max(total,1))*100)},
              {label:'Not Paid',     count:unpaid,  color:'bg-red-400',     pct:Math.round((unpaid/Math.max(total,1))*100)},
            ].map(row=>(
              <div key={row.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-gray-700">{row.label}</span>
                  <span className="text-gray-500">{row.count} students · {row.pct}%</span>
                </div>
                <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div className={`${row.color} h-3 rounded-full transition-all`} style={{width:`${row.pct}%`}} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today at a glance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs font-bold text-gray-700 mb-4">Today at a Glance</p>
          <div className="space-y-3 text-xs">
            {[
              {label:"Today's Total",     value:fmt(Number(day.total||0)), bold:true },
              {label:"Cash",              value:fmt(Number(day.cash ||0))            },
              {label:"MoMo",              value:fmt(Number(day.momo ||0))            },
              {label:"Bank",              value:fmt(Number(day.bank ||0))            },
              {label:"Transactions",      value:Number(day.entries||0)+' payments'   },
            ].map(r=>(
              <div key={r.label} className={`flex justify-between pb-2 ${r.bold?'border-t border-gray-100 pt-2 font-bold text-gray-900 text-sm':''} border-b border-dashed border-gray-100`}>
                <span className={r.bold?'text-gray-900':'text-gray-500'}>{r.label}</span>
                <span className={r.bold?'text-indigo-700':'font-semibold text-gray-800'}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top defaulters */}
      {defaulters?.defaulters?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-900">Top Defaulters</p>
            <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">Action Required</span>
          </div>
          <table className="w-full text-xs">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              {['Student','Class','Guardian Contact','Balance Due'].map(h=>(
                <th key={h} className={`px-4 py-2 font-bold text-gray-600 ${h==='Balance Due'?'text-right':'text-left'}`}>{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {defaulters.defaulters.slice(0,5).map(s=>(
                <tr key={s.id} className="hover:bg-red-50/30">
                  <td className="px-4 py-2.5 font-semibold text-gray-900">{s.full_name}</td>
                  <td className="px-4 py-2.5 text-gray-600">{s.class} {s.stream}</td>
                  <td className="px-4 py-2.5 text-gray-500">{s.guardian_name} · {s.guardian_tel}</td>
                  <td className="px-4 py-2.5 text-right font-extrabold text-red-700">{fmt(s.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
