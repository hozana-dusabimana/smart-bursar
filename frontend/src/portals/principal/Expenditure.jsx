import { useEffect, useState } from 'react';
import { Loader2, TrendingDown } from 'lucide-react';
import api from '../../api/client';
import { fmt } from '../../utils/format';
import Badge from '../../components/Badge';

export default function Expenditure() {
  const [expenses, setExpenses] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(()=>{
    api.get('/expenses').then(r=>setExpenses(r.data||[])).finally(()=>setLoading(false));
  },[]);

  const approved = expenses.filter(e=>e.status==='Approved');
  const pending  = expenses.filter(e=>e.status==='Pending');
  const byCategory = approved.reduce((acc,e)=>{acc[e.category]=(acc[e.category]||0)+Number(e.amount);return acc;},{});
  const total = approved.reduce((s,e)=>s+Number(e.amount),0);

  return (
    <div className="max-w-4xl space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          {label:'Total Approved',   value:fmt(total),          color:'border-l-4 border-indigo-500 bg-indigo-50'},
          {label:'Pending Approval', value:`${pending.length} items`,color:'border-l-4 border-amber-400 bg-amber-50'},
          {label:'Categories',       value:Object.keys(byCategory).length,color:'border-l-4 border-gray-400 bg-gray-50'},
        ].map(c=>(
          <div key={c.label} className={`${c.color} rounded-xl p-4 shadow-sm`}>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">{c.label}</p>
            <p className="text-sm font-extrabold text-gray-900 mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100"><p className="text-xs font-bold text-gray-900">Spending by Category</p></div>
        <div className="p-5 space-y-3">
          {Object.entries(byCategory).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>{
            const pct=total?Math.round((amt/total)*100):0;
            return(
              <div key={cat}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-gray-700">{cat}</span>
                  <span className="font-bold text-gray-900">{fmt(amt)} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                </div>
                <div className="bg-gray-100 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{width:`${pct}%`}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-indigo-950 text-white px-5 py-3"><p className="text-xs font-bold uppercase tracking-widest">Expense Records</p></div>
        {loading?(
          <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-indigo-500 animate-spin"/></div>
        ):(
          <table className="w-full text-xs">
            <thead><tr className="bg-gray-100 border-b-2 border-gray-300">
              {['Ref','Description','Category','Date','Submitted By','Status','Amount'].map(h=>(
                <th key={h} className={`px-4 py-2.5 font-bold text-gray-700 ${h==='Amount'?'text-right':h==='Status'?'text-center':'text-left'}`}>{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.map((e,i)=>(
                <tr key={e.id} className={i%2===0?'bg-white':'bg-gray-50/50'}>
                  <td className="px-4 py-2.5 font-mono text-gray-500">{e.expense_no}</td>
                  <td className="px-4 py-2.5 font-semibold text-gray-900">{e.description}</td>
                  <td className="px-4 py-2.5"><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px]">{e.category}</span></td>
                  <td className="px-4 py-2.5 text-gray-500">{String(e.expense_date||'').slice(0,10)}</td>
                  <td className="px-4 py-2.5 text-gray-600">{e.submitted_by_name}</td>
                  <td className="px-4 py-2.5 text-center"><Badge label={e.status}/></td>
                  <td className="px-4 py-2.5 text-right font-bold text-gray-900">{Number(e.amount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
