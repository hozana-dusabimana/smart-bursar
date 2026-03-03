import { useState, useEffect } from 'react';
import { Search, FileDown, Phone, GraduationCap, User, Loader2 } from 'lucide-react';
import Badge from '../components/Badge';
import api from '../api/client';
import { fmt } from '../utils/format';
import { exportFeeCardPDF } from '../utils/exportFeeCard';

function FeeCard({ studentData }) {
  const { student, summary, feeStructure, payments } = studentData;
  const fee     = summary?.fee  || 0;
  const paid    = summary?.paid || 0;
  const balance = summary?.balance || 0;
  const pct     = fee ? Math.round((paid / fee) * 100) : 0;
  const status  = !fee ? 'No Invoice' : paid >= fee ? 'Cleared' : paid > 0 ? 'Partial' : 'Unpaid';

  const handleExport = () => {
    exportFeeCardPDF({ studentData, schoolName: student?.school_name || 'Smart Bursar School' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
      {/* Dark slate header – rounded-t-2xl via parent overflow-hidden */}
      <div className="bg-slate-900 text-white px-5 py-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-base font-extrabold ring-2 ring-white/20 shrink-0">
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
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Badge label={status} />
          <button onClick={handleExport} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors">
            <FileDown className="w-3 h-3" /> Export PDF
          </button>
        </div>
      </div>

      {/* Stat pills row */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
        <div className="p-5 text-center">
          <p className="text-[11px] text-gray-500 font-medium">Total Fee</p>
          <p className="text-lg font-extrabold text-gray-900 mt-0.5">{fmt(fee)}</p>
        </div>
        <div className="p-5 text-center bg-emerald-50">
          <p className="text-[11px] text-emerald-600 font-medium">Paid</p>
          <p className="text-lg font-extrabold text-emerald-700 mt-0.5">{fmt(paid)}</p>
        </div>
        <div className={`p-5 text-center ${balance > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
          <p className={`text-[11px] font-medium ${balance > 0 ? 'text-red-500' : 'text-emerald-600'}`}>Balance</p>
          <p className={`text-lg font-extrabold mt-0.5 ${balance > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{fmt(balance)}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
        <div className="flex justify-between text-[11px] text-gray-500 mb-1.5">
          <span>Payment Progress</span>
          <span className="font-bold">{pct}% paid</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all ${pct===100?'bg-emerald-500':pct>50?'bg-blue-600':'bg-orange-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Fee Structure */}
      {feeStructure && (
        <div className="border-b border-gray-100">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Fee Structure — Class {student?.class}</p>
          </div>
          <table className="w-full text-[13px]">
            <tbody className="divide-y divide-gray-100">
              <tr className="bg-white">
                <td className="px-5 py-2.5 text-gray-600">Tuition Fee</td>
                <td className="px-5 py-2.5 text-right font-semibold text-gray-900">{fmt(feeStructure.tuition)}</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-5 py-2.5 text-gray-600">Activity Fee</td>
                <td className="px-5 py-2.5 text-right font-semibold text-gray-900">{fmt(feeStructure.activity)}</td>
              </tr>
              {feeStructure.transport > 0 && (
                <tr className="bg-white">
                  <td className="px-5 py-2.5 text-gray-600">Transport</td>
                  <td className="px-5 py-2.5 text-right font-semibold text-gray-900">{fmt(feeStructure.transport)}</td>
                </tr>
              )}
              <tr className="bg-gray-100 font-extrabold text-gray-900 border-t-2 border-gray-300">
                <td className="px-5 py-3">Total</td>
                <td className="px-5 py-3 text-right">{fmt(fee)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Payment History */}
      <div className="px-5 py-5">
        <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-3">Payment History</p>
        {payments.length === 0 ? (
          <div className="text-center py-8 bg-red-50 rounded-2xl border border-dashed border-red-200">
            <p className="text-[13px] font-semibold text-red-700">No payments recorded this term</p>
            <p className="text-[11px] text-red-400 mt-1">Payments will appear here once recorded.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-slate-900 text-white">
                  {['#', 'Receipt No.', 'Date', 'Method', 'Reference', 'Amount', 'Running Balance'].map(h => (
                    <th key={h} className={`px-3 py-2.5 text-xs font-semibold ${h==='Amount'||h.includes('Balance')?'text-right':'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(() => {
                  let running = fee;
                  return payments.map((p, i) => {
                    running -= Number(p.amount);
                    return (
                      <tr key={p.receipt_no} className={`${i%2===0?'bg-white':'bg-gray-50'} hover:bg-blue-50/40 transition-colors`}>
                        <td className="px-3 py-2.5 text-gray-400 font-mono text-xs">{i+1}</td>
                        <td className="px-3 py-2.5 font-mono text-gray-600 text-xs">{p.receipt_no}</td>
                        <td className="px-3 py-2.5 text-gray-600">{String(p.payment_date||'').slice(0,10)}</td>
                        <td className="px-3 py-2.5"><Badge label={p.payment_method} /></td>
                        <td className="px-3 py-2.5 text-gray-400">{p.reference||'—'}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-gray-900">{fmt(p.amount)}</td>
                        <td className={`px-3 py-2.5 text-right font-bold ${running<=0?'text-emerald-600':'text-red-600'}`}>{fmt(Math.max(0,running))}</td>
                      </tr>
                    );
                  });
                })()}
                <tr className="bg-blue-700 text-white font-bold">
                  <td colSpan={5} className="px-3 py-2.5 text-xs">Total Paid</td>
                  <td className="px-3 py-2.5 text-right text-xs">{fmt(paid)}</td>
                  <td className={`px-3 py-2.5 text-right text-xs ${balance<=0?'text-emerald-200':'text-red-200'}`}>{fmt(balance)} remaining</td>
                </tr>
              </tbody>
            </table>
          </div>
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
    <div className="space-y-5">
      {/* Search card */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <p className="text-sm font-bold">Look Up Student</p>
        </div>
        <div className="p-5">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" value={query}
              onChange={e => { setQuery(e.target.value); setSelected(null); setStudentData(null); }}
              placeholder="Enter student name, admission number, or class..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-[13px] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            {searching && <Loader2 className="w-4 h-4 text-blue-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />}
          </div>

          {results.length > 0 && !selected && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {results.map(s => (
                <button key={s.id} onClick={() => selectStudent(s)}
                  className="text-left bg-white border border-gray-200 rounded-2xl p-4 hover:border-blue-400 hover:shadow-md transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-sm font-extrabold shrink-0">
                      {s.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-gray-900 truncate">{s.full_name}</p>
                      <p className="text-[11px] text-gray-500">{s.admission_no} · Class {s.class}{s.stream}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge label={s.paymentStatus || 'No Invoice'} />
                      <p className="text-[10px] text-gray-500 mt-1">Bal: {fmt(s.balance)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {query.length >= 2 && !searching && results.length === 0 && (
            <div className="mt-4 text-center py-8">
              <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-[13px] text-gray-400">No student found matching &ldquo;{query}&rdquo;</p>
            </div>
          )}
        </div>
      </div>

      {loadingCard && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="ml-2 text-[13px] text-gray-500">Loading fee card...</span>
        </div>
      )}
      {studentData && !loadingCard && <FeeCard studentData={studentData} />}
    </div>
  );
}