import { useEffect, useState } from 'react';
import { Loader2, Printer } from 'lucide-react';
import api from '../../api/client';
import { fmt } from '../../utils/format';
import Badge from '../../components/Badge';

export default function FullLedger() {
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [method,   setMethod]   = useState('All');

  useEffect(() => {
    api.get('/payments').then(r => setPayments(r.data || [])).finally(()=>setLoading(false));
  }, []);

  const filtered = method==='All' ? payments : payments.filter(p=>p.payment_method===method);
  const total = filtered.reduce((s,p)=>s+Number(p.amount),0);

  return (
    <div className="max-w-5xl space-y-5">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-bold text-gray-900">Full Payment Ledger</p>
          <p className="text-xs text-gray-500">All recorded payments this term</p>
        </div>
        <div className="flex gap-2">
          {['All','Cash','MoMo','Bank'].map(m=>(
            <button key={m} onClick={()=>setMethod(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
                ${method===m?'bg-teal-600 text-white border-teal-600':'bg-white text-gray-600 border-gray-200 hover:border-teal-400'}`}>{m}</button>
          ))}
          <button onClick={()=>window.print()} className="flex items-center gap-1.5 bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-700">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-slate-800 text-white px-5 py-3 flex justify-between">
          <p className="text-xs font-bold uppercase tracking-widest">Payment Records — {filtered.length} entries</p>
          <p className="text-xs text-teal-300 font-bold">Total: {fmt(total)}</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-teal-600 animate-spin"/><span className="ml-2 text-sm text-gray-500">Loading...</span></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  {['#','Receipt No.','Date','Student','Adm. No.','Class','Method','Reference','Cashier','Amount'].map(h=>(
                    <th key={h} className={`px-3 py-2.5 font-bold text-gray-700 ${h==='Amount'?'text-right':'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p,i)=>(
                  <tr key={p.receipt_no} className={i%2===0?'bg-white':'bg-gray-50/50'}>
                    <td className="px-3 py-2 text-gray-400 font-mono">{String(i+1).padStart(3,'0')}</td>
                    <td className="px-3 py-2 font-mono text-gray-600">{p.receipt_no}</td>
                    <td className="px-3 py-2 text-gray-600">{String(p.payment_date||'').slice(0,10)}</td>
                    <td className="px-3 py-2 font-semibold text-gray-900">{p.student_name}</td>
                    <td className="px-3 py-2 font-mono text-gray-500">{p.admission_no}</td>
                    <td className="px-3 py-2 text-gray-600">{p.class}{p.stream}</td>
                    <td className="px-3 py-2"><Badge label={p.payment_method} /></td>
                    <td className="px-3 py-2 text-gray-400">{p.reference||'—'}</td>
                    <td className="px-3 py-2 text-gray-600">{p.cashier_name}</td>
                    <td className="px-3 py-2 text-right font-bold text-gray-900">{Number(p.amount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-teal-700 text-white font-bold">
                  <td colSpan={9} className="px-3 py-3 text-sm uppercase">Total — {filtered.length} payments</td>
                  <td className="px-3 py-3 text-right">{total.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
