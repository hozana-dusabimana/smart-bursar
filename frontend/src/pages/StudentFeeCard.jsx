import { useState, useEffect } from 'react';
import { Search, Printer, Phone, GraduationCap, User, Loader2 } from 'lucide-react';
import Badge from '../components/Badge';
import api from '../api/client';
import { fmt } from '../utils/format';

function FeeCard({ studentData }) {
  const { student, summary, feeStructure, payments } = studentData;
  const fee     = summary?.fee  || 0;
  const paid    = summary?.paid || 0;
  const balance = summary?.balance || 0;
  const pct     = fee ? Math.round((paid / fee) * 100) : 0;
  const status  = !fee ? 'No Invoice' : paid >= fee ? 'Cleared' : paid > 0 ? 'Partial' : 'Unpaid';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-slate-900 text-white px-5 py-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-base font-extrabold">
              {student?.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
            </div>
            <div>
              <p className="text-base font-extrabold">{student?.full_name}</p>
              <p className="text-[11px] text-slate-300">{student?.admission_no}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Class {student?.class} {student?.stream}</span>
            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {student?.guardian_name}</span>
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {student?.guardian_tel}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge label={status} />
          <button onClick={() => window.print()} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] px-3 py-1.5 rounded-lg">
            <Printer className="w-3 h-3" /> Print Card
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
        <div className="p-4 text-center"><p className="text-[10px] text-gray-500">Total Fee</p><p className="text-sm font-extrabold text-gray-900 mt-0.5">{fmt(fee)}</p></div>
        <div className="p-4 text-center bg-emerald-50"><p className="text-[10px] text-emerald-600">Paid</p><p className="text-sm font-extrabold text-emerald-700 mt-0.5">{fmt(paid)}</p></div>
        <div className={`p-4 text-center ${balance > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
          <p className={`text-[10px] ${balance > 0 ? 'text-red-500' : 'text-emerald-600'}`}>Balance</p>
          <p className={`text-sm font-extrabold mt-0.5 ${balance > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{fmt(balance)}</p>
        </div>
      </div>

      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex justify-between text-[10px] text-gray-500 mb-1"><span>Payment Progress</span><span className="font-bold">{pct}% paid</span></div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className={`h-2.5 rounded-full ${pct===100?'bg-emerald-500':pct>50?'bg-blue-600':'bg-orange-400'}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {feeStructure && (
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">Fee Structure — Class {student?.class}</p>
          <table className="w-full text-xs">
            <tbody className="divide-y divide-gray-100">
              <tr><td className="py-1.5 text-gray-600">Tuition Fee</td><td className="py-1.5 text-right font-semibold">{fmt(feeStructure.tuition)}</td></tr>
              <tr><td className="py-1.5 text-gray-600">Activity Fee</td><td className="py-1.5 text-right font-semibold">{fmt(feeStructure.activity)}</td></tr>
              {feeStructure.transport > 0 && <tr><td className="py-1.5 text-gray-600">Transport</td><td className="py-1.5 text-right font-semibold">{fmt(feeStructure.transport)}</td></tr>}
              <tr className="font-extrabold text-gray-900 border-t-2 border-gray-300"><td className="pt-2">Total</td><td className="pt-2 text-right">{fmt(fee)}</td></tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="px-5 py-4">
        <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-3">Payment History</p>
        {payments.length === 0 ? (
          <div className="text-center py-6 bg-red-50 rounded-lg border border-dashed border-red-200">
            <p className="text-sm font-semibold text-red-700">No payments recorded this term</p>
          </div>
        ) : (
          <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-800 text-white">
              <tr>
                {['#','Receipt No.','Date','Method','Reference','Amount','Running Balance'].map(h => (
                  <th key={h} className={`px-3 py-2 font-semibold ${h==='Amount'||h.includes('Balance')?'text-right':'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(() => {
                let running = fee;
                return payments.map((p, i) => {
                  running -= Number(p.amount);
                  return (
                    <tr key={p.receipt_no} className={i%2===0?'bg-white':'bg-gray-50'}>
                      <td className="px-3 py-2 text-gray-400">{i+1}</td>
                      <td className="px-3 py-2 font-mono text-gray-600">{p.receipt_no}</td>
                      <td className="px-3 py-2 text-gray-600">{String(p.payment_date||'').slice(0,10)}</td>
                      <td className="px-3 py-2"><Badge label={p.payment_method} /></td>
                      <td className="px-3 py-2 text-gray-400">{p.reference||'—'}</td>
                      <td className="px-3 py-2 text-right font-semibold">{fmt(p.amount)}</td>
                      <td className={`px-3 py-2 text-right font-bold ${running<=0?'text-emerald-600':'text-red-600'}`}>{fmt(Math.max(0,running))}</td>
                    </tr>
                  );
                });
              })()}
              <tr className="bg-blue-700 text-white font-bold">
                <td colSpan={5} className="px-3 py-2">Total Paid</td>
                <td className="px-3 py-2 text-right">{fmt(paid)}</td>
                <td className={`px-3 py-2 text-right ${balance<=0?'text-emerald-200':'text-red-200'}`}>{fmt(balance)} remaining</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function StudentFeeCard() {
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState([]);
  const [searching,setSearching]= useState(false);
  const [selected, setSelected] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [loadingCard, setLoadingCard] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/students?search=${encodeURIComponent(query)}`);
        setResults(res.data || []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const selectStudent = async (s) => {
    setSelected(s);
    setLoadingCard(true);
    try {
      const res = await api.get(`/students/${s.id}`);
      setStudentData(res.data);
    } catch { setStudentData(null); }
    finally { setLoadingCard(false); }
  };

  return (
    <div className="max-w-4xl space-y-5">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <p className="text-sm font-bold text-gray-900 mb-3">Look Up Student</p>
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" value={query}
            onChange={e => { setQuery(e.target.value); setSelected(null); setStudentData(null); }}
            placeholder="Enter student name, admission number, or class..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {searching && <Loader2 className="w-4 h-4 text-blue-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />}
        </div>

        {results.length > 0 && !selected && (
          <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
            {results.map(s => (
              <button key={s.id} onClick={() => selectStudent(s)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blue-50">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{s.full_name}</p>
                  <p className="text-[11px] text-gray-500">{s.admission_no} · Class {s.class}{s.stream}</p>
                </div>
                <div className="text-right">
                  <Badge label={s.paymentStatus || 'No Invoice'} />
                  <p className="text-[10px] text-gray-500 mt-1">Balance: {fmt(s.balance)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {loadingCard && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="ml-2 text-sm text-gray-500">Loading fee card...</span>
        </div>
      )}
      {studentData && !loadingCard && <FeeCard studentData={studentData} />}
    </div>
  );
}
