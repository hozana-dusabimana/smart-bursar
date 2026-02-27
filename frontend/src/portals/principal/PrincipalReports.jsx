import { useEffect, useState } from 'react';
import { Loader2, Printer } from 'lucide-react';
import api from '../../api/client';
import { fmt } from '../../utils/format';

export default function PrincipalReports() {
  const [defaulters, setDefaulters] = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(()=>{
    api.get('/reports/defaulters').then(r=>setDefaulters(r.data)).finally(()=>setLoading(false));
  },[]);

  return (
    <div className="max-w-5xl space-y-5">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
        <div><p className="text-sm font-bold text-gray-900">Defaulters Report</p><p className="text-xs text-gray-500">{defaulters?.count||0} students with outstanding balances</p></div>
        <button onClick={()=>window.print()} className="flex items-center gap-2 bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-indigo-800">
          <Printer className="w-3.5 h-3.5"/> Print Report
        </button>
      </div>
      {loading?(
        <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-indigo-500 animate-spin"/></div>
      ):(
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-indigo-950 text-white px-5 py-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest">Fee Defaulters List</p>
            <p className="text-xs text-indigo-300">Outstanding: {fmt(defaulters?.totalOutstanding||0)}</p>
          </div>
          <table className="w-full text-xs">
            <thead><tr className="bg-gray-100 border-b-2 border-gray-300">
              {['#','Student Name','Adm. No.','Class','Guardian','Tel','Balance Due'].map(h=>(
                <th key={h} className={`px-4 py-2.5 font-bold text-gray-700 ${h==='Balance Due'?'text-right':'text-left'}`}>{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {(defaulters?.defaulters||[]).map((s,i)=>(
                <tr key={s.id} className={i%2===0?'bg-white':'bg-red-50/20'}>
                  <td className="px-4 py-2.5 text-gray-400 font-mono">{String(i+1).padStart(2,'0')}</td>
                  <td className="px-4 py-2.5 font-semibold text-gray-900">{s.full_name}</td>
                  <td className="px-4 py-2.5 font-mono text-gray-500">{s.admission_no}</td>
                  <td className="px-4 py-2.5 text-gray-600">{s.class} {s.stream}</td>
                  <td className="px-4 py-2.5 text-gray-600">{s.guardian_name}</td>
                  <td className="px-4 py-2.5 text-gray-500">{s.guardian_tel}</td>
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
