import { useState, useEffect } from 'react';
import { Printer, AlertTriangle, Loader2 } from 'lucide-react';
import Badge from '../components/Badge';
import api from '../api/client';
import { fmt } from '../utils/format';

export default function DefaultersList() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('All');
  const [school,  setSchool]  = useState({});

  useEffect(() => {
    api.get('/settings').then(r => setSchool(r.data?.config || {})).catch(() => {});
    api.get('/reports/defaulters')
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  const all         = data?.defaulters || [];
  const filtered    = filter === 'All' ? all : all.filter(s => s.paymentStatus === filter);
  const outstanding = data?.totalOutstanding || 0;

  const today = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' });

  return (
    <div className="max-w-5xl space-y-5">
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-red-800">
            {all.length} students have outstanding balances totalling {fmt(outstanding)}
          </p>
          <p className="text-xs text-red-600 mt-0.5">As of {today}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2">
          {['All','Unpaid','Partial'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
                ${filter===f?'bg-blue-700 text-white border-blue-700':'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}>
              {f} ({f==='All'?all.length:all.filter(s=>s.paymentStatus===f).length})
            </button>
          ))}
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-800">
          <Printer className="w-3.5 h-3.5" /> Print List
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 text-blue-600 animate-spin" /><span className="ml-2 text-sm text-gray-500">Loading...</span></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-900 text-white px-6 py-4">
            <div className="text-center mb-3">
              <p className="text-xs uppercase tracking-widest text-gray-400">{school.school_name}</p>
              <p className="text-base font-extrabold">FEE DEFAULTERS LIST</p>
              <p className="text-xs text-gray-300">Printed: {today}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label:'Total Defaulters',    value: all.length,     style:'text-red-300 text-lg' },
                { label:'Total Outstanding',   value: fmt(outstanding), style:'text-red-300 text-sm' },
                { label:'Not Paid At All',     value: all.filter(s=>s.paymentStatus==='Unpaid').length, style:'text-red-300 text-lg' },
              ].map(s => (
                <div key={s.label} className="bg-white/10 rounded-lg p-2.5">
                  <p className="text-[9px] text-gray-400 uppercase">{s.label}</p>
                  <p className={`font-extrabold mt-0.5 ${s.style}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  {['No.','Student Name','Adm. No.','Class','Guardian','Tel','Total Fee','Paid','Balance Due','Status'].map(h => (
                    <th key={h} className={`px-4 py-3 font-bold text-gray-700 ${['Total Fee','Paid','Balance Due'].includes(h)?'text-right':h==='Status'?'text-center':'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s, i) => (
                  <tr key={s.id} className={`${s.paymentStatus==='Unpaid'?'bg-red-50':'bg-orange-50/30'} hover:bg-yellow-50/50`}>
                    <td className="px-4 py-3 text-gray-400 font-mono">{String(i+1).padStart(2,'0')}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{s.full_name}</td>
                    <td className="px-4 py-3 font-mono text-gray-500">{s.admission_no}</td>
                    <td className="px-4 py-3 text-gray-700">{s.class} {s.stream}</td>
                    <td className="px-4 py-3 text-gray-600">{s.guardian_name}</td>
                    <td className="px-4 py-3 text-gray-500">{s.guardian_tel}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{Number(s.fee||0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">{Number(s.paid||0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-extrabold text-red-700">{Number(s.balance||0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center"><Badge label={s.paymentStatus} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-red-900 text-white font-bold">
                  <td colSpan={6} className="px-4 py-3 text-sm uppercase">Total — {filtered.length} students</td>
                  <td className="px-4 py-3 text-right">{filtered.reduce((s,r)=>s+Number(r.fee||0),0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-emerald-300">{filtered.reduce((s,r)=>s+Number(r.paid||0),0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-red-200 text-sm">{filtered.reduce((s,r)=>s+Number(r.balance||0),0).toLocaleString()}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="border-t-2 border-gray-300 p-5">
            <p className="text-[10px] text-gray-500 italic mb-4">This list is to be distributed to class teachers and the principal for follow-up.</p>
            <div className="grid grid-cols-3 gap-8">
              {['Bursar','Accountant','Principal'].map(r => (
                <div key={r}><div className="border-b-2 border-gray-400 mb-1" style={{minHeight:'36px'}} /><p className="text-[10px] text-gray-500">{r}</p></div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
