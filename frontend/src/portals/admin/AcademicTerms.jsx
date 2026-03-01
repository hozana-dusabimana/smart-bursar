import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import api from '../../api/client';

export default function AcademicTerms() {
  const [terms,   setTerms]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    api.get('/settings').then(r=>setTerms(r.data?.terms||[])).finally(()=>setLoading(false));
  },[]);

  if(loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 text-orange-500 animate-spin"/></div>;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-900 text-white px-5 py-3"><p className="text-xs font-bold uppercase tracking-widest">Academic Terms</p></div>
        <table className="w-full text-xs">
          <thead><tr className="bg-gray-100 border-b-2 border-gray-300">
            {['Term','Academic Year','Start Date','End Date','Status'].map(h=>(
              <th key={h} className="px-5 py-3 text-left font-bold text-gray-700">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {terms.map(t=>(
              <tr key={t.id} className={t.is_active?'bg-orange-50':''}>
                <td className="px-5 py-3 font-bold text-gray-900">{t.term_name}</td>
                <td className="px-5 py-3 text-gray-600">{t.academic_year}</td>
                <td className="px-5 py-3 text-gray-500">{String(t.start_date||'').slice(0,10)}</td>
                <td className="px-5 py-3 text-gray-500">{String(t.end_date||'').slice(0,10)}</td>
                <td className="px-5 py-3">
                  {t.is_active
                    ?<span className="flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full w-fit">
                       <CheckCircle2 className="w-3 h-3"/> Active
                     </span>
                    :<span className="text-[10px] text-gray-400">Inactive</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
