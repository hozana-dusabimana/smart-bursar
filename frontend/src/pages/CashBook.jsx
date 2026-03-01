import { useEffect, useState } from 'react';
import { FileDown, CheckCircle2, Loader2, TrendingUp, Search, X } from 'lucide-react';
import Badge from '../components/Badge';
import api from '../api/client';
import { fmt } from '../utils/format';
import { exportPDF } from '../utils/pdfExport';

export default function CashBook() {
  const [data,         setData]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [date,         setDate]         = useState(new Date().toISOString().split('T')[0]);
  const [school,       setSchool]       = useState({});
  const [search,       setSearch]       = useState('');
  const [methodFilter, setMethodFilter] = useState('All');

  useEffect(() => {
    api.get('/settings').then(r => setSchool(r.data?.config || {})).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get(`/cashbook/today?date=${date}`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, [date]);

  const entries = data?.entries || [];
  const totals  = data?.totals  || { total: 0, cash: 0, momo: 0, bank: 0 };

  const filtered = entries.filter(e =>
    (methodFilter === 'All' || e.payment_method === methodFilter) &&
    (!search || e.student_name?.toLowerCase().includes(search.toLowerCase()) || e.receipt_no?.includes(search))
  );

  const handleExport = () => {
    let running = 0;
    exportPDF({
      title:      'Daily Cash Book',
      subtitle:   `Date: ${date}`,
      schoolName: school.school_name,
      filename:   `cashbook-${date}.pdf`,
      orientation: 'landscape',
      summaryRows: [
        { label: 'Cash',  value: fmt(totals.cash)  },
        { label: 'MoMo',  value: fmt(totals.momo)  },
        { label: 'Bank',  value: fmt(totals.bank)  },
        { label: 'Total', value: fmt(totals.total) },
      ],
      columns: ['#', 'Time', 'Receipt No.', 'Student Name', 'Class', 'Method', 'Amount (RWF)', 'Running Total'],
      rows: filtered.map((e, i) => {
        running += Number(e.amount);
        return [
          String(i + 1).padStart(2, '0'),
          String(e.payment_time || '').slice(0, 5),
          e.receipt_no,
          e.student_name,
          `${e.class}${e.stream}`,
          e.payment_method,
          Number(e.amount).toLocaleString(),
          running.toLocaleString(),
        ];
      }),
    });
  };

  return (
    <div className="space-y-5">

      {/* Toolbar card */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <p className="text-[11px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">Daily Cash Book</p>
            <h2 className="text-base font-extrabold text-gray-900">{school.school_name}</h2>
            <div className="flex items-center gap-3 mt-2">
              <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-wide shrink-0">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-1.5 text-[13px] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
          <button onClick={handleExport}
            className="flex items-center gap-2 bg-blue-700 text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-800 transition-colors shadow-sm shrink-0">
            <FileDown className="w-4 h-4" /> Export PDF
          </button>
        </div>

        {/* Real-time filters */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-gray-100">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by student name or receipt no…"
              className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-1.5 shrink-0">
            {['All', 'Cash', 'MoMo', 'Bank'].map(m => (
              <button key={m} onClick={() => setMethodFilter(m)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all
                  ${methodFilter === m
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payment method summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Cash',  value: totals.cash,  gradient: 'from-green-500 to-emerald-600',  light: 'bg-green-50',  border: 'border-l-4 border-green-500',  textColor: 'text-green-700',  subColor: 'text-green-500'  },
          { label: 'MoMo',  value: totals.momo,  gradient: 'from-amber-500 to-orange-500',   light: 'bg-amber-50',  border: 'border-l-4 border-amber-500',  textColor: 'text-amber-700',  subColor: 'text-amber-500'  },
          { label: 'Bank',  value: totals.bank,  gradient: 'from-indigo-500 to-indigo-700',  light: 'bg-indigo-50', border: 'border-l-4 border-indigo-500', textColor: 'text-indigo-700', subColor: 'text-indigo-400' },
        ].map(c => (
          <div key={c.label} className={`${c.border} ${c.light} bg-white rounded-2xl shadow-card border border-gray-100 p-4`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{c.label} Received</p>
                <p className={`text-lg font-extrabold mt-1 ${c.textColor}`}>{fmt(c.value)}</p>
              </div>
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shrink-0`}>
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className={`text-[11px] mt-1.5 ${c.subColor}`}>
              {entries.filter(e => e.payment_method === c.label).length} entries
            </p>
          </div>
        ))}
      </div>

      {/* Main register table */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest">Fee Collection Register</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{date}</p>
          </div>
          <span className="text-[11px] text-slate-300 bg-white/10 px-2.5 py-1 rounded-full">{filtered.length} entries</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="ml-2 text-[13px] text-gray-500">Loading...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[13px] font-semibold text-gray-500">No entries match your filters</p>
            <p className="text-[11px] text-gray-400 mt-1">Try adjusting the date, search or method filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  {['No.','Time','Receipt No.','Student Name','Class','Method','Amount (RWF)','Running Total'].map(h => (
                    <th key={h} className={`px-4 py-3 font-bold text-gray-600 text-xs uppercase tracking-wide ${h.includes('Amount')||h.includes('Total')?'text-right':'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(() => {
                  let run = 0;
                  return filtered.map((e, i) => {
                    run += Number(e.amount);
                    return (
                      <tr key={e.receipt_no} className={`${i%2===0?'bg-white':'bg-gray-50/60'} hover:bg-blue-50/30 transition-colors`}>
                        <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">{String(i+1).padStart(2,'0')}</td>
                        <td className="px-4 py-2.5 text-gray-600">{String(e.payment_time||'').slice(0,5)}</td>
                        <td className="px-4 py-2.5 font-mono text-gray-500 text-xs">{e.receipt_no}</td>
                        <td className="px-4 py-2.5 font-semibold text-gray-900">{e.student_name}</td>
                        <td className="px-4 py-2.5 text-gray-600">{e.class}{e.stream}</td>
                        <td className="px-4 py-2.5"><Badge label={e.payment_method} /></td>
                        <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{Number(e.amount).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-blue-700">{run.toLocaleString()}</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white font-bold">
                  <td colSpan={6} className="px-4 py-3 text-xs uppercase tracking-wide">Day Total — {filtered.length} transactions</td>
                  <td className="px-4 py-3 text-right text-sm">{filtered.reduce((s,e)=>s+Number(e.amount),0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-sm">{filtered.reduce((s,e)=>s+Number(e.amount),0).toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="border-t-2 border-gray-200 p-6 grid grid-cols-3 gap-8">
          {['Bursar','Accountant','Principal'].map(role => (
            <div key={role}>
              <div className="border-b-2 border-gray-300 mb-2" style={{minHeight:'40px'}} />
              <p className="text-[10px] text-gray-500 font-medium">{role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reconciliation card */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-3.5">
          <p className="text-xs font-extrabold uppercase tracking-widest">Reconciliation Summary</p>
        </div>
        <div className="p-5">
          <div className="space-y-2">
            {[
              ['Cash',                fmt(totals.cash), 'border-l-4 border-green-400  bg-green-50/60'],
              ['Mobile Money (MoMo)', fmt(totals.momo), 'border-l-4 border-amber-400  bg-amber-50/60'],
              ['Bank Transfer',       fmt(totals.bank), 'border-l-4 border-indigo-400 bg-indigo-50/60'],
            ].map(([l, v, cls]) => (
              <div key={l} className={`${cls} rounded-xl px-4 py-2.5 flex justify-between items-center`}>
                <span className="text-[13px] text-gray-700 font-medium">{l}</span>
                <span className="text-[13px] font-bold text-gray-900">{v}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200 mt-3">
              <span className="font-extrabold text-gray-900 text-base">Grand Total</span>
              <span className="font-extrabold text-blue-700 text-base">{fmt(totals.total)}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <p className="text-[13px] text-emerald-700 font-medium">{entries.length} entries recorded. Book ready for verification.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
