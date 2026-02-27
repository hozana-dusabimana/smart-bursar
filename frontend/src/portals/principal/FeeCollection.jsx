import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import api from '../../api/client';
import { fmt } from '../../utils/format';
import Badge from '../../components/Badge';

export default function FeeCollection() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [cls,     setCls]     = useState('');

  useEffect(()=>{
    api.get('/reports/class-collection')
      .then(r=>{
        setData(r.data);
        const classes=[...new Set((r.data?.students||[]).map(s=>s.class))].sort();
        if(classes.length>0)setCls(classes[0]);
      }).finally(()=>setLoading(false));
  },[]);

  const all     = data?.students||[];
  const classes = [...new Set(all.map(s=>s.class))].sort();
  const shown   = cls ? all.filter(s=>s.class===cls) : all;
  const totals  = shown.reduce((a,s)=>({fee:a.fee+Number(s.fee||0),paid:a.paid+Number(s.paid||0),bal:a.bal+Number(s.balance||0)}),{fee:0,paid:0,bal:0});

  return (
    <div className="max-w-5xl space-y-5">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-2 items-center justify-between">
        <p className="text-sm font-bold text-gray-900">Fee Collection by Class</p>
        <div className="flex flex-wrap gap-1.5">
          {classes.map(c=>(
            <button key={c} onClick={()=>setCls(c)}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all
                ${cls===c?'bg-indigo-600 text-white border-indigo-600':'bg-white text-gray-600 border-gray-200 hover:border-indigo-400'}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          {label:'Students',       value:shown.length},
          {label:'Total Expected', value:fmt(totals.fee)},
          {label:'Total Collected',value:fmt(totals.paid), highlight:true},
          {label:'Outstanding',    value:fmt(totals.bal)},
        ].map(c=>(
          <div key={c.label} className={`rounded-xl p-4 shadow-sm border ${c.highlight?'bg-indigo-600 text-white border-indigo-600':'bg-white border-gray-100'}`}>
            <p className={`text-[10px] uppercase tracking-wide font-semibold ${c.highlight?'text-indigo-200':'text-gray-500'}`}>{c.label}</p>
            <p className={`text-sm font-extrabold mt-1 ${c.highlight?'text-white':'text-gray-900'}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {loading?(
        <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-indigo-500 animate-spin"/></div>
      ):(
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-indigo-950 text-white px-5 py-3"><p className="text-xs font-bold uppercase tracking-widest">Class {cls} · {shown.length} Students</p></div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-gray-100 border-b-2 border-gray-300">
                {['#','Student Name','Adm. No.','Total Fee','Paid','Balance','Progress','Status'].map(h=>(
                  <th key={h} className={`px-4 py-2.5 font-bold text-gray-700 ${['Total Fee','Paid','Balance'].includes(h)?'text-right':h==='Progress'||h==='Status'?'text-center':'text-left'}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {shown.map((s,i)=>{
                  const fee=Number(s.fee||0),paid=Number(s.paid||0),bal=Number(s.balance||0);
                  const pct=fee?Math.round((paid/fee)*100):0;
                  return(
                    <tr key={s.id} className={s.paymentStatus==='Unpaid'?'bg-red-50/40':s.paymentStatus==='Cleared'?'bg-emerald-50/30':'bg-white'}>
                      <td className="px-4 py-2.5 text-gray-400 font-mono">{String(i+1).padStart(2,'0')}</td>
                      <td className="px-4 py-2.5 font-semibold text-gray-900">{s.full_name}</td>
                      <td className="px-4 py-2.5 font-mono text-gray-500">{s.admission_no}</td>
                      <td className="px-4 py-2.5 text-right text-gray-700">{fee.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-emerald-700">{paid.toLocaleString()}</td>
                      <td className={`px-4 py-2.5 text-right font-bold ${bal>0?'text-red-700':'text-emerald-700'}`}>{bal.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="w-20 bg-gray-200 rounded-full h-1.5 mx-auto">
                          <div className={`h-1.5 rounded-full ${pct===100?'bg-emerald-500':pct>0?'bg-indigo-500':'bg-red-400'}`} style={{width:`${pct}%`}}/>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center"><Badge label={s.paymentStatus||'No Invoice'}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
