import { useState, useEffect } from 'react';
import { Printer, Loader2 } from 'lucide-react';
import Badge from '../components/Badge';
import api from '../api/client';
import { fmt } from '../utils/format';

export default function ClassCollection() {
  const [allData,   setAllData]   = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading,   setLoading]   = useState(true);
  const [school,    setSchool]    = useState({});

  useEffect(() => {
    api.get('/settings').then(r => setSchool(r.data?.config || {})).catch(() => {});
    api.get('/reports/class-collection')
      .then(r => {
        setAllData(r.data);
        // Auto-select first class
        const classes = [...new Set((r.data?.students || []).map(s => s.class))].sort();
        if (classes.length > 0 && !selectedClass) setSelectedClass(classes[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  const allStudents = allData?.students || [];
  const classes     = [...new Set(allStudents.map(s => s.class))].sort();
  const students    = selectedClass ? allStudents.filter(s => s.class === selectedClass) : allStudents;

  const totals = students.reduce((acc, s) => ({
    fee:     acc.fee + Number(s.fee || 0),
    paid:    acc.paid + Number(s.paid || 0),
    balance: acc.balance + Number(s.balance || 0),
  }), { fee: 0, paid: 0, balance: 0 });

  const collectionRate = totals.fee ? Math.round((totals.paid / totals.fee) * 100) : 0;

  return (
    <div className="max-w-5xl space-y-5">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-gray-500 mb-1">Select Class</p>
          <div className="flex flex-wrap gap-2">
            {classes.map(cls => (
              <button key={cls} onClick={() => setSelectedClass(cls)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
                  ${selectedClass === cls ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}>
                {cls}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-800">
          <Printer className="w-3.5 h-3.5" /> Print Sheet
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 text-blue-600 animate-spin" /><span className="ml-2 text-sm text-gray-500">Loading...</span></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-slate-900 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">{school.school_name}</p>
                <p className="text-base font-extrabold">Fee Collection Sheet — Class {selectedClass || 'All'}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-blue-400">{collectionRate}%</p>
                <p className="text-[10px] text-slate-400">Collection Rate</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-4">
              {[
                { label: 'Total Students',    value: students.length         },
                { label: 'Cleared',           value: students.filter(s=>s.paymentStatus==='Cleared').length },
                { label: 'Total Expected',    value: fmt(totals.fee)         },
                { label: 'Total Outstanding', value: fmt(totals.balance)     },
              ].map(s => (
                <div key={s.label} className="bg-white/10 rounded-lg p-2.5">
                  <p className="text-[9px] text-slate-400 uppercase tracking-wide">{s.label}</p>
                  <p className="text-sm font-bold mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  {['No.','Student Name','Adm. No.','Stream','Total Fee','Paid','Balance','Progress','Status'].map(h => (
                    <th key={h} className={`px-4 py-3 font-bold text-gray-700 ${['Total Fee','Paid','Balance'].includes(h)?'text-right':h==='Progress'||h==='Status'?'text-center':'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s, i) => {
                  const fee = Number(s.fee||0), paid = Number(s.paid||0), balance = Number(s.balance||0);
                  const pct = fee ? Math.round((paid/fee)*100) : 0;
                  return (
                    <tr key={s.id} className={`${s.paymentStatus==='Unpaid'?'bg-red-50':s.paymentStatus==='Cleared'?'bg-emerald-50/30':'bg-white'} hover:bg-blue-50/20`}>
                      <td className="px-4 py-3 text-gray-400 font-mono">{String(i+1).padStart(2,'0')}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{s.full_name}</td>
                      <td className="px-4 py-3 font-mono text-gray-500">{s.admission_no}</td>
                      <td className="px-4 py-3 text-gray-600">{s.stream}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{fee.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700">{paid.toLocaleString()}</td>
                      <td className={`px-4 py-3 text-right font-bold ${balance>0?'text-red-700':'text-emerald-700'}`}>{balance.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-20 bg-gray-200 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${pct===100?'bg-emerald-500':pct>0?'bg-blue-500':'bg-red-400'}`} style={{width:`${pct}%`}} />
                          </div>
                          <span className="text-gray-500 w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center"><Badge label={s.paymentStatus || 'No Invoice'} /></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-800 text-white font-bold">
                  <td colSpan={4} className="px-4 py-3 text-sm uppercase tracking-wide">Total ({students.length} students)</td>
                  <td className="px-4 py-3 text-right">{totals.fee.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-emerald-300">{totals.paid.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-red-300">{totals.balance.toLocaleString()}</td>
                  <td colSpan={2} className="px-4 py-3 text-center">{collectionRate}% collected</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="border-t-2 border-gray-300 p-5 grid grid-cols-3 gap-8">
            {['Bursar','Class Teacher','Principal'].map(r => (
              <div key={r}><div className="border-b-2 border-gray-400 mb-1" style={{minHeight:'36px'}} /><p className="text-[10px] text-gray-500">{r}</p></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
