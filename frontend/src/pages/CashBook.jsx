import { useEffect, useState } from 'react';
import { Printer, CheckCircle2, Loader2 } from 'lucide-react';
import Badge from '../components/Badge';
import api from '../api/client';
import { fmt } from '../utils/format';

export default function CashBook() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [date,    setDate]    = useState(new Date().toISOString().split('T')[0]);
  const [school,  setSchool]  = useState({});

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
  let running   = 0;

  return (
    <div className="max-w-4xl space-y-5">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Daily Cash Book</p>
          <h2 className="text-base font-extrabold text-gray-900">{school.school_name}</h2>
          <div className="flex items-center gap-3 mt-1">
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-800">
          <Printer className="w-3.5 h-3.5" /> Print Cash Book
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Cash',  value: totals.cash, color: 'border-l-4 border-green-500  bg-green-50' },
          { label: 'MoMo',  value: totals.momo, color: 'border-l-4 border-yellow-500 bg-yellow-50' },
          { label: 'Bank',  value: totals.bank, color: 'border-l-4 border-indigo-500 bg-indigo-50' },
        ].map(c => (
          <div key={c.label} className={`${c.color} rounded-xl p-4 shadow-sm`}>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">{c.label} Received</p>
            <p className="text-sm font-extrabold text-gray-900 mt-1">{fmt(c.value)}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {entries.filter(e => e.payment_method === c.label).length} entries
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-900 text-white px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest">Fee Collection Register</p>
            <p className="text-[10px] text-gray-400">{date}</p>
          </div>
          <p className="text-xs text-gray-300">{entries.length} entries</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="ml-2 text-sm text-gray-500">Loading...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400">No entries for {date}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  {['No.','Time','Receipt No.','Student Name','Class','Method','Amount (RWF)','Running Total'].map(h => (
                    <th key={h} className={`px-4 py-2.5 font-bold text-gray-700 ${h.includes('Amount')||h.includes('Total')?'text-right':'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((e, i) => {
                  running += Number(e.amount);
                  return (
                    <tr key={e.receipt_no} className={i%2===0?'bg-white':'bg-gray-50/60'}>
                      <td className="px-4 py-2.5 text-gray-400 font-mono">{String(i+1).padStart(2,'0')}</td>
                      <td className="px-4 py-2.5 text-gray-600">{String(e.payment_time||'').slice(0,5)}</td>
                      <td className="px-4 py-2.5 font-mono text-gray-500">{e.receipt_no}</td>
                      <td className="px-4 py-2.5 font-semibold text-gray-900">{e.student_name}</td>
                      <td className="px-4 py-2.5 text-gray-600">{e.class}{e.stream}</td>
                      <td className="px-4 py-2.5"><Badge label={e.payment_method} /></td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{Number(e.amount).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-blue-700">{running.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-900 text-white font-bold">
                  <td colSpan={6} className="px-4 py-3 text-sm uppercase tracking-wide">Day Total — {entries.length} transactions</td>
                  <td className="px-4 py-3 text-right text-sm">{Number(totals.total).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-sm">{Number(totals.total).toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="border-t-2 border-gray-300 p-5 grid grid-cols-3 gap-8">
          {['Bursar','Accountant','Principal'].map(role => (
            <div key={role}>
              <div className="border-b-2 border-gray-400 mb-1" style={{minHeight:'36px'}} />
              <p className="text-[10px] text-gray-500">{role}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <p className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-3">Reconciliation</p>
        <div className="space-y-2 text-sm">
          {[['Cash',fmt(totals.cash)],['Mobile Money (MoMo)',fmt(totals.momo)],['Bank Transfer',fmt(totals.bank)]].map(([l,v]) => (
            <div key={l} className="flex justify-between border-b border-dashed border-gray-200 pb-2">
              <span className="text-gray-600">{l}</span><span className="font-semibold">{v}</span>
            </div>
          ))}
          <div className="flex justify-between pt-1">
            <span className="font-extrabold text-gray-900 text-base">Grand Total</span>
            <span className="font-extrabold text-blue-700 text-base">{fmt(totals.total)}</span>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-xs text-emerald-700 font-medium">{entries.length} entries recorded. Book ready for verification.</p>
        </div>
      </div>
    </div>
  );
}
