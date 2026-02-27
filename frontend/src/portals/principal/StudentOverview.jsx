import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import api from '../../api/client';
import { fmt } from '../../utils/format';
import Badge from '../../components/Badge';

export default function StudentOverview() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(()=>{
    api.get('/reports/class-collection').then(r=>setData(r.data)).finally(()=>setLoading(false));
  },[]);

  const all = data?.students||[];
  const shown = search ? all.filter(s=>s.full_name.toLowerCase().includes(search.toLowerCase())||s.admission_no.includes(search)) : all;

  return (
    <div className="max-w-5xl space-y-5">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm font-bold text-gray-900">All Students — {all.length} enrolled</p>
        <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or admission no…"
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"/>
      </div>
      {loading?(
        <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-indigo-500 animate-spin"/></div>
      ):(
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-indigo-950 text-white px-5 py-3"><p className="text-xs font-bold uppercase tracking-widest">Student Directory</p></div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-gray-100 border-b-2 border-gray-300">
                {['#','Name','Adm. No.','Class','Guardian','Fee','Paid','Balance','Status'].map(h=>(
                  <th key={h} className={`px-3 py-2.5 font-bold text-gray-700 ${['Fee','Paid','Balance'].includes(h)?'text-right':h==='Status'?'text-center':'text-left'}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {shown.map((s,i)=>(
                  <tr key={s.id} className={i%2===0?'bg-white':'bg-gray-50/30'}>
                    <td className="px-3 py-2.5 text-gray-400 font-mono">{String(i+1).padStart(3,'0')}</td>
                    <td className="px-3 py-2.5 font-semibold text-gray-900">{s.full_name}</td>
                    <td className="px-3 py-2.5 font-mono text-gray-500">{s.admission_no}</td>
                    <td className="px-3 py-2.5 text-gray-600">{s.class} {s.stream}</td>
                    <td className="px-3 py-2.5 text-gray-500">{s.guardian_name}</td>
                    <td className="px-3 py-2.5 text-right text-gray-700">{Number(s.fee||0).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-emerald-700">{Number(s.paid||0).toLocaleString()}</td>
                    <td className={`px-3 py-2.5 text-right font-bold ${Number(s.balance||0)>0?'text-red-700':'text-emerald-700'}`}>{Number(s.balance||0).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-center"><Badge label={s.paymentStatus||'No Invoice'}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
