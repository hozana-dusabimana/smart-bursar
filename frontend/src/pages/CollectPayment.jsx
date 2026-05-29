import { useState, useEffect, useCallback } from 'react';
import { Search, Printer, CheckCircle2, X, User, Phone, GraduationCap, Loader2, AlertCircle, Receipt } from 'lucide-react';
import api from '../api/client';
import { fmt, amountInWords } from '../utils/format';
import Badge from '../components/Badge';

// ─── Receipt Modal ────────────────────────────────────────────────────────────
function ReceiptModal({ receipt, school, onClose }) {
  if (!receipt) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
        {/* Close button top-right */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

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
              ['Student Name', receipt.student?.full_name],
              ['Admission No', receipt.student?.admission_no],
              ['Class', `${receipt.student?.class} ${receipt.student?.stream}`],
              ['Guardian', receipt.student?.guardian_name],
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
          <button onClick={onClose} className="flex-1 bg-white border border-gray-200 text-gray-700 text-xs font-semibold py-2.5 rounded-xl hover:bg-gray-100 transition-colors">
            Close
          </button>
          <button onClick={() => window.print()} className="flex-1 bg-blue-700 text-white text-xs font-semibold py-2.5 rounded-xl hover:bg-blue-800 flex items-center justify-center gap-2 transition-colors">
            <Printer className="w-3.5 h-3.5" /> Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CollectPayment() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [ref, setRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [school, setSchool] = useState(null);
  const [generating, setGenerating] = useState(false);

  // Load school config
  useEffect(() => {
    api.get('/settings').then(r => setSchool(r.data?.config)).catch(() => { });
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
    api.get(`/students/${selected.id}`).then(r => setStudentData(r.data)).catch(() => { });
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

  const generateInvoice = async () => {
    if (!selected) return;
    setGenerating(true);
    setError('');
    try {
      await api.post('/invoices/generate', { student_id: selected.id });
      // Reload student data
      const r = await api.get(`/students/${selected.id}`);
      setStudentData(r.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => {
    setReceipt(null); setSelected(null); setQuery('');
    setAmount(''); setRef(''); setResults([]);
  };

  const summary = studentData?.summary || {};
  const feeStr = studentData?.feeStructure;
  const student = studentData?.student;
  const payments = studentData?.payments || [];
  const balance = summary.balance || 0;
  const pct = summary.fee ? Math.round((summary.paid / summary.fee) * 100) : 0;

  const payStatus = !summary.fee ? 'No Invoice'
    : summary.paid >= summary.fee ? 'Cleared'
      : summary.paid > 0 ? 'Partial' : 'Unpaid';

  return (
    <div className="space-y-5">

      {/* Step 1 – Search */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">1</div>
            <p className="text-sm font-bold">Search Student</p>
          </div>
        </div>
        <div className="p-5">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" value={query}
              onChange={e => { setQuery(e.target.value); setSelected(null); }}
              placeholder="Type student name or admission number..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-[13px] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searching && <Loader2 className="w-4 h-4 text-blue-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />}
          </div>

          {results.length > 0 && !selected && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {results.map(s => (
                <button key={s.id} onClick={() => setSelected(s)}
                  className="text-left bg-white border border-gray-200 rounded-2xl p-4 hover:border-blue-400 hover:shadow-md transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-xs font-extrabold shrink-0">
                      {s.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-gray-900 truncate">{s.full_name}</p>
                      <p className="text-[11px] text-gray-500">{s.admission_no} · Class {s.class} {s.stream}</p>
                    </div>
                    <Badge label={s.paymentStatus || 'No Invoice'} />
                  </div>
                  <p className="text-[11px] text-red-600 mt-2 font-semibold pl-12">Balance: {fmt(s.balance || 0)}</p>
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

      {/* Step 2 – Student Fee Card */}
      {selected && studentData && (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
          {/* Dark gradient header */}
          <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">2</div>
              <p className="text-sm font-bold">Student Fee Card</p>
            </div>
            <button onClick={() => { setSelected(null); setQuery(''); }} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Identity – gradient header card */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-base font-extrabold shrink-0 ring-2 ring-white/20">
                  {student?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-base font-extrabold text-white">{student?.full_name}</p>
                  <div className="flex flex-wrap gap-3 mt-1.5 text-[11px] text-slate-300">
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
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider">Fee Structure — Class {student?.class}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <tbody className="divide-y divide-gray-100">
                      <tr className="bg-white"><td className="px-5 py-2.5 text-gray-600">Tuition Fee</td><td className="px-5 py-2.5 text-right font-semibold">{fmt(feeStr.tuition)}</td></tr>
                      <tr className="bg-gray-50"><td className="px-5 py-2.5 text-gray-600">Activity Fee</td><td className="px-5 py-2.5 text-right font-semibold">{fmt(feeStr.activity)}</td></tr>
                      {feeStr.transport > 0 && <tr className="bg-white"><td className="px-5 py-2.5 text-gray-600">Transport</td><td className="px-5 py-2.5 text-right font-semibold">{fmt(feeStr.transport)}</td></tr>}
                      <tr className="bg-blue-700 text-white font-bold"><td className="px-5 py-2.5">Total Term Fee</td><td className="px-5 py-2.5 text-right">{fmt(summary.fee)}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Summary stat pills */}
            <div className="grid grid-cols-3 gap-3">
              <div className="border-l-4 border-gray-400 bg-white rounded-2xl shadow-card p-4 border border-gray-100">
                <p className="text-[11px] text-gray-500 font-medium">Total Fee</p>
                <p className="text-base font-extrabold text-gray-900 mt-0.5">{fmt(summary.fee)}</p>
              </div>
              <div className="border-l-4 border-emerald-500 bg-white rounded-2xl shadow-card p-4 border border-gray-100">
                <p className="text-[11px] text-emerald-600 font-medium">Paid</p>
                <p className="text-base font-extrabold text-emerald-700 mt-0.5">{fmt(summary.paid)}</p>
              </div>
              <div className={`border-l-4 bg-white rounded-2xl shadow-card p-4 border border-gray-100 ${balance > 0 ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
                <p className={`text-[11px] font-medium ${balance > 0 ? 'text-red-500' : 'text-emerald-600'}`}>Balance</p>
                <p className={`text-base font-extrabold mt-0.5 ${balance > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{fmt(balance)}</p>
              </div>
            </div>

            {/* Progress */}
            <div>
              <div className="flex justify-between text-[11px] text-gray-500 mb-1.5">
                <span>Payment Progress</span><span className="font-bold">{pct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className={`h-2.5 rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : pct > 50 ? 'bg-blue-500' : 'bg-orange-400'}`} style={{ width: `${pct}%` }} />
              </div>
            </div>

            {/* Payment history */}
            {payments.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">Previous Payments This Term</p>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200">
                        <th className="px-4 py-2.5 text-left text-gray-600 font-semibold">Receipt</th>
                        <th className="px-4 py-2.5 text-left text-gray-600 font-semibold">Date</th>
                        <th className="px-4 py-2.5 text-left text-gray-600 font-semibold">Method</th>
                        <th className="px-4 py-2.5 text-right text-gray-600 font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {payments.map(p => (
                        <tr key={p.receipt_no} className="bg-white hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-gray-500 text-xs">{p.receipt_no}</td>
                          <td className="px-4 py-2.5 text-gray-600">{String(p.payment_date || '').slice(0, 10)}</td>
                          <td className="px-4 py-2.5"><Badge label={p.payment_method} /></td>
                          <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{fmt(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3 – Payment Entry */}
      {selected && studentData && (payStatus === 'No Invoice' ? (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6 text-orange-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-orange-800">No Invoice Found</p>
            <p className="text-[13px] text-orange-600 mb-4">An invoice is required before recording a payment. This usually happens if the fee structure hasn't been set for this term.</p>
            <button
              onClick={generateInvoice}
              disabled={generating}
              className="bg-orange-600 text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-orange-700 disabled:opacity-50 transition-all flex items-center gap-2 mx-auto shadow-lg shadow-orange-200"
            >
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Receipt className="w-3.5 h-3.5" />}
              Generate Invoice Now
            </button>
          </div>
        </div>
      ) : balance > 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
          <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">3</div>
              <p className="text-sm font-bold">Enter Payment</p>
            </div>
          </div>

          <div className="p-5">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-[13px] text-red-700">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Amount (RWF) <span className="text-red-500">*</span>
                </label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder={`Max: ${balance.toLocaleString()}`}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                {amount && Number(amount) > 0 && (
                  <p className="text-[10px] text-gray-500 mt-1 italic">{amountInWords(Number(amount))}</p>
                )}
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select value={method} onChange={e => setMethod(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Cash</option>
                  <option>MoMo</option>
                  <option>Bank</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Reference</label>
                <input type="text" value={ref} onChange={e => setRef(e.target.value)}
                  placeholder={method === 'Cash' ? 'N/A for cash' : 'MoMo ID or bank ref'}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>

            <div className="mt-5">
              <button onClick={handleConfirm}
                disabled={!amount || Number(amount) <= 0 || submitting}
                className="flex items-center gap-2 bg-blue-700 text-white text-sm font-bold px-8 py-3 rounded-xl hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {submitting ? 'Processing...' : 'Confirm & Generate Receipt'}
              </button>
            </div>
          </div>
        </div>
      ) : null)}

      {selected && studentData && balance <= 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-800">Account Fully Cleared</p>
            <p className="text-[13px] text-emerald-600">Full fee of {fmt(summary.fee)} has been paid. No balance outstanding.</p>
          </div>
        </div>
      )}

      {receipt && <ReceiptModal receipt={receipt} school={school} onClose={handleClose} />}
    </div>
  );
}
