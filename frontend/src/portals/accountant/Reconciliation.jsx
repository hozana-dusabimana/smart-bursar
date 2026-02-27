import { useEffect, useState } from 'react';
import { Loader2, Printer, CheckCircle2 } from 'lucide-react';
import api from '../../api/client';
import { fmt } from '../../utils/format';
import Badge from '../../components/Badge';

export default function Reconciliation() {
  const [cashbook, setCashbook] = useState(null);
  const [summary,  setSummary]  = useState(null);
  const [date,     setDate]     = useState(new Date().toISOString().split('T')[0]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/cashbook/today?date=${date}`),
      api.get('/reports/daily-summary'),
    ]).then(([c, s]) => { setCashbook(c.data); setSummary(s.data); })
    .finally(() => setLoading(false));
  }, [date]);

  const entries = cashbook?.entries || [];
  const totals  = cashbook?.totals  || {};
  let running   = 0;

  return (
    <div className="max-w-5xl space-y-5">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-bold text-gray-900">Daily Reconciliation</p>
          <p className="text-xs text-gray-500">Verify all cash entries against physical receipts</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <button onClick={()=>window.print()} className="flex items-center gap-2 bg-teal-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-teal-700">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
        </div>
      </div>

      {/* Reconciliation boxes */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Cash Received',   value: totals.cash  || 0, color: 'bg-green-600'  },
          { label: 'MoMo Received',   value: totals.momo  || 0, color: 'bg-yellow-500' },
          { label: 'Bank Transfer',   value: totals.bank  || 0, color: 'bg-indigo-600' },
          { label: 'Grand Total',     value: totals.total || 0, color: 'bg-teal-600'   },
        ].map(b => (
          <div key={b.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <div className={`w-2 h-2 rounded-full ${b.color} mx-auto mb-2`} />
            <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">{b.label}</p>
            <p className="text-sm font-extrabold text-gray-900 mt-1">{fmt(b.value)}</p>
            <p className="text-[10px] text-gray-400">{entries.filter(e=>e.payment_method===b.label.split(' ')[0]).length || entries.length} entries</p>
          </div>
        ))}
      </div>

      {/* Ledger table */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-teal-600 animate-spin" /><span className="ml-2 text-sm text-gray-500">Loading...</span></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-slate-800 text-white px-5 py-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest">Transaction Ledger — {date}</p>
            <p className="text-[10px] text-gray-400">{entries.length} entries</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  {['#','Time','Receipt No.','Student','Class','Method','Amount','Running Total','Verify'].map(h=>(
                    <th key={h} className={`px-3 py-2.5 font-bold text-gray-700 ${['Amount','Running Total'].includes(h)?'text-right':h==='Verify'?'text-center':'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((e, i) => {
                  running += Number(e.amount);
                  return (
                    <tr key={e.receipt_no} className={i%2===0?'bg-white':'bg-gray-50/60'}>
                      <td className="px-3 py-2.5 text-gray-400 font-mono">{String(i+1).padStart(2,'0')}</td>
                      <td className="px-3 py-2.5 text-gray-600">{String(e.payment_time||'').slice(0,5)}</td>
                      <td className="px-3 py-2.5 font-mono text-gray-600">{e.receipt_no}</td>
                      <td className="px-3 py-2.5 font-semibold text-gray-900">{e.student_name}</td>
                      <td className="px-3 py-2.5 text-gray-600">{e.class}{e.stream}</td>
                      <td className="px-3 py-2.5"><Badge label={e.payment_method} /></td>
                      <td className="px-3 py-2.5 text-right font-semibold">{Number(e.amount).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-teal-700">{running.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-center"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mx-auto" /></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-800 text-white font-bold">
                  <td colSpan={6} className="px-3 py-3 text-sm uppercase tracking-wide">TOTAL — {entries.length} transactions</td>
                  <td className="px-3 py-3 text-right">{Number(totals.total||0).toLocaleString()}</td>
                  <td className="px-3 py-3 text-right">{Number(totals.total||0).toLocaleString()}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="border-t-2 border-gray-300 p-5 grid grid-cols-3 gap-8">
            {['Bursar','Accountant (You)','Principal'].map(r=>(
              <div key={r}><div className="border-b-2 border-gray-400 mb-1" style={{minHeight:'36px'}} /><p className="text-[10px] text-gray-500">{r}</p></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
