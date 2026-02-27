import { useState, useEffect, useCallback } from 'react';
import { Search, Printer, CheckCircle2, X, User, Phone, GraduationCap, Loader2, AlertCircle } from 'lucide-react';
import api from '../api/client';
import { fmt, amountInWords } from '../utils/format';
import Badge from '../components/Badge';

// ─── Receipt Modal ────────────────────────────────────────────────────────────
function ReceiptModal({ receipt, school, onClose }) {
  if (!receipt) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="text-center border-b-2 border-gray-900 pb-4 mb-4">
            <p className="text-base font-extrabold text-gray-900 uppercase tracking-wide">{school?.school_name}</p>
            <p className="text-[11px] text-gray-600">{school?.address}</p>
            <p className="text-[11px] text-gray-600">Tel: {school?.tel} | {school?.email}</p>
            <div className="mt-2 inline-block bg-gray-900 text-white text-xs font-bold px-4 py-1 rounded-full tracking-widest">
              OFFICIAL FEE RECEIPT
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1 text-[11px] mb-4">
            <div><span className="text-gray-500">Receipt No:</span> <strong className="font-mono">{receipt.receiptNo}</strong></div>
            <div><span className="text-gray-500">Date:</span> <strong>{receipt.date}</strong></div>
            <div><span className="text-gray-500">Term:</span> <strong>{receipt.term?.term_name} · {receipt.term?.academic_year}</strong></div>
            <div><span className="text-gray-500">Cashier:</span> <strong>{receipt.cashier}</strong></div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-[11px] space-y-1">
            {[
              ['Student Name',  receipt.student?.full_name],
              ['Admission No',  receipt.student?.admission_no],
              ['Class',         `${receipt.student?.class} ${receipt.student?.stream}`],
              ['Guardian',      receipt.student?.guardian_name],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-gray-500">{k}:</span>
                <strong className="text-gray-900">{v}</strong>
              </div>
            ))}
          </div>

          <div className="border-t border-b border-dashed border-gray-300 py-3 mb-4 space-y-1.5 text-[11px]">
            <div className="flex justify-between"><span className="text-gray-600">Total Term Fee:</span><span className="font-semibold">{fmt(receipt.fee)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Previously Paid:</span><span className="font-semibold">{fmt(receipt.previouslyPaid)}</span></div>
            <div className="flex justify-between text-base font-extrabold text-gray-900 pt-1">
              <span>Amount Paid Now:</span>
              <span className="text-blue-700">{fmt(receipt.amount)}</span>
            </div>
            <div className="flex justify-between"><span className="text-gray-600">Payment Method:</span><span className="font-semibold">{receipt.payment_method}{receipt.reference ? ` (${receipt.reference})` : ''}</span></div>
            <div className="flex justify-between font-semibold">
              <span className="text-gray-600">Remaining Balance:</span>
              <span className={receipt.newBalance <= 0 ? 'text-emerald-600' : 'text-red-600'}>{fmt(receipt.newBalance)}</span>
            </div>
          </div>

          <p className="text-[10px] text-gray-600 italic mb-4">
            Amount in words: <strong>{receipt.amountInWords}</strong>
          </p>

          <div className="grid grid-cols-2 gap-6 mt-4">
            <div className="border-t border-gray-400 pt-1 text-center">
              <p className="text-[10px] text-gray-500">Cashier Signature</p>
              <p className="text-[10px] font-medium text-gray-700">{receipt.cashier}</p>
            </div>
            <div className="border-t border-gray-400 pt-1 text-center">
              <p className="text-[10px] text-gray-500">Parent / Guardian</p>
            </div>
          </div>
          <p className="text-center text-[9px] text-gray-400 mt-4">This is an official receipt. Please keep for your records.</p>
        </div>

        <div className="border-t border-gray-100 p-4 flex gap-3 bg-gray-50">
          <button onClick={onClose} className="flex-1 bg-white border border-gray-200 text-gray-700 text-xs font-semibold py-2 rounded-lg hover:bg-gray-100">
            Close
          </button>
          <button onClick={() => window.print()} className="flex-1 bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg hover:bg-blue-800 flex items-center justify-center gap-2">
            <Printer className="w-3.5 h-3.5" /> Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CollectPayment() {
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState([]);
  const [searching,setSearching]= useState(false);
  const [selected, setSelected] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [amount,   setAmount]   = useState('');
  const [method,   setMethod]   = useState('Cash');
  const [ref,      setRef]      = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,    setError]    = useState('');
  const [receipt,  setReceipt]  = useState(null);
  const [school,   setSchool]   = useState(null);

  // Load school config
  useEffect(() => {
    api.get('/settings').then(r => setSchool(r.data?.config)).catch(() => {});
  }, []);

  // Debounced search
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

  // Load full student data when selected
  useEffect(() => {
    if (!selected) { setStudentData(null); return; }
    api.get(`/students/${selected.id}`).then(r => setStudentData(r.data)).catch(() => {});
  }, [selected]);

  const handleConfirm = async () => {
    if (!selected || !amount || Number(amount) <= 0) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/payments', {
        student_id: selected.id,
        amount: Number(amount),
        payment_method: method,
        reference: ref || undefined,
      });
      setReceipt(res.data.receipt);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setReceipt(null); setSelected(null); setQuery('');
    setAmount(''); setRef(''); setResults([]);
  };

  const summary = studentData?.summary || {};
  const feeStr  = studentData?.feeStructure;
  const student = studentData?.student;
  const payments = studentData?.payments || [];
  const balance = summary.balance || 0;
  const pct     = summary.fee ? Math.round((summary.paid / summary.fee) * 100) : 0;

  const payStatus = !summary.fee ? 'No Invoice'
    : summary.paid >= summary.fee ? 'Cleared'
    : summary.paid > 0 ? 'Partial' : 'Unpaid';

  return (
    <div className="max-w-4xl space-y-5">

      {/* Step 1 – Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</div>
          <p className="text-sm font-bold text-gray-900">Search Student</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" value={query}
            onChange={e => { setQuery(e.target.value); setSelected(null); }}
            placeholder="Type student name or admission number..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searching && <Loader2 className="w-4 h-4 text-blue-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />}
        </div>

        {results.length > 0 && !selected && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {results.map(s => (
              <button key={s.id} onClick={() => setSelected(s)}
                className="text-left bg-white border border-gray-200 rounded-xl p-3 hover:border-blue-400 hover:shadow-md transition-all">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{s.full_name}</p>
                    <p className="text-[11px] text-gray-500">{s.admission_no} · Class {s.class} {s.stream}</p>
                  </div>
                  <Badge label={s.paymentStatus || 'No Invoice'} />
                </div>
                <p className="text-[11px] text-red-600 mt-1 font-semibold">Balance: {fmt(s.balance || 0)}</p>
              </button>
            ))}
          </div>
        )}
        {query.length >= 2 && !searching && results.length === 0 && (
          <p className="mt-3 text-sm text-gray-400 text-center py-4">No student found matching "{query}"</p>
        )}
      </div>

      {/* Step 2 – Student Fee Card */}
      {selected && studentData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</div>
              <p className="text-sm font-bold text-gray-900">Student Fee Card</p>
            </div>
            <button onClick={() => { setSelected(null); setQuery(''); }} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Identity */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-base font-extrabold shrink-0">
                {student?.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
              </div>
              <div className="flex-1">
                <p className="text-base font-extrabold text-gray-900">{student?.full_name}</p>
                <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-gray-600">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {student?.admission_no}</span>
                  <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Class {student?.class} {student?.stream}</span>
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {student?.guardian_name} · {student?.guardian_tel}</span>
                </div>
              </div>
              <Badge label={payStatus} />
            </div>
          </div>

          {/* Fee Breakdown */}
          {feeStr && (
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
              <div className="bg-gray-800 text-white px-4 py-2 text-xs font-bold">Fee Structure — Class {student?.class}</div>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-gray-100">
                  <tr className="bg-white"><td className="px-4 py-2 text-gray-600">Tuition Fee</td><td className="px-4 py-2 text-right font-semibold">{fmt(feeStr.tuition)}</td></tr>
                  <tr className="bg-gray-50"><td className="px-4 py-2 text-gray-600">Activity Fee</td><td className="px-4 py-2 text-right font-semibold">{fmt(feeStr.activity)}</td></tr>
                  {feeStr.transport > 0 && <tr className="bg-white"><td className="px-4 py-2 text-gray-600">Transport</td><td className="px-4 py-2 text-right font-semibold">{fmt(feeStr.transport)}</td></tr>}
                  <tr className="bg-blue-700 text-white font-bold"><td className="px-4 py-2">Total Term Fee</td><td className="px-4 py-2 text-right">{fmt(summary.fee)}</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
              <p className="text-[10px] text-gray-500">Total Fee</p>
              <p className="text-sm font-extrabold text-gray-900 mt-0.5">{fmt(summary.fee)}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 text-center border border-emerald-200">
              <p className="text-[10px] text-emerald-600">Paid</p>
              <p className="text-sm font-extrabold text-emerald-700 mt-0.5">{fmt(summary.paid)}</p>
            </div>
            <div className={`rounded-lg p-3 text-center border ${balance > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <p className={`text-[10px] ${balance > 0 ? 'text-red-500' : 'text-emerald-600'}`}>Balance</p>
              <p className={`text-sm font-extrabold mt-0.5 ${balance > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{fmt(balance)}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
              <span>Payment Progress</span><span className="font-bold">{pct}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div className={`h-2.5 rounded-full ${pct===100?'bg-emerald-500':pct>50?'bg-blue-500':'bg-orange-400'}`} style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Payment history */}
          {payments.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-gray-700 mb-2">Previous Payments This Term</p>
              <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-600 font-semibold">Receipt</th>
                    <th className="px-3 py-2 text-left text-gray-600 font-semibold">Date</th>
                    <th className="px-3 py-2 text-left text-gray-600 font-semibold">Method</th>
                    <th className="px-3 py-2 text-right text-gray-600 font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map(p => (
                    <tr key={p.receipt_no} className="bg-white">
                      <td className="px-3 py-2 font-mono text-gray-500">{p.receipt_no}</td>
                      <td className="px-3 py-2 text-gray-600">{String(p.payment_date || '').slice(0,10)}</td>
                      <td className="px-3 py-2"><Badge label={p.payment_method} /></td>
                      <td className="px-3 py-2 text-right font-semibold">{fmt(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Step 3 – Payment Entry */}
      {selected && studentData && balance > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">3</div>
            <p className="text-sm font-bold text-gray-900">Enter Payment</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Amount (RWF) <span className="text-red-500">*</span></label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder={`Max: ${balance.toLocaleString()}`}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {amount && Number(amount) > 0 && (
                <p className="text-[10px] text-gray-500 mt-1 italic">{amountInWords(Number(amount))}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Payment Method <span className="text-red-500">*</span></label>
              <select value={method} onChange={e => setMethod(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Cash</option>
                <option>MoMo</option>
                <option>Bank</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Reference</label>
              <input type="text" value={ref} onChange={e => setRef(e.target.value)}
                placeholder={method === 'Cash' ? 'N/A for cash' : 'MoMo ID or bank ref'}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button onClick={handleConfirm}
              disabled={!amount || Number(amount) <= 0 || submitting}
              className="flex items-center gap-2 bg-blue-700 text-white text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {submitting ? 'Processing...' : 'Confirm & Generate Receipt'}
            </button>
          </div>
        </div>
      )}

      {selected && studentData && balance <= 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-800">Account Fully Cleared</p>
            <p className="text-xs text-emerald-600">Full fee of {fmt(summary.fee)} has been paid.</p>
          </div>
        </div>
      )}

      {receipt && <ReceiptModal receipt={receipt} school={school} onClose={handleClose} />}
    </div>
  );
}
