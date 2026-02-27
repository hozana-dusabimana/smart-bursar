import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, CreditCard, Clock, CheckCircle2,
  AlertTriangle, Phone, LogOut, Printer, ChevronDown,
  ChevronUp, BookOpen, Loader2, RefreshCw, User
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { fmt, amountInWords } from '../../utils/format';

function ProgressRing({ pct, size = 72, stroke = 7 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#dcfce7" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={pct === 100 ? '#16a34a' : pct > 50 ? '#22c55e' : '#f59e0b'}
        strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
    </svg>
  );
}

function PaymentCard({ p, idx }) {
  const [open, setOpen] = useState(false);
  const methods = { Cash: 'bg-green-100 text-green-700', MoMo: 'bg-amber-100 text-amber-700', Bank: 'bg-blue-100 text-blue-700' };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors">
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 text-xs font-bold text-green-700">
          {String(idx + 1).padStart(2, '0')}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-900">{fmt(p.amount)}</p>
          <p className="text-[10px] text-gray-500">{String(p.payment_date || '').slice(0, 10)} · {p.receipt_no}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${methods[p.payment_method] || 'bg-gray-100 text-gray-600'}`}>
          {p.payment_method}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-2 text-xs text-gray-600 bg-gray-50">
          {[
            ['Receipt No.', p.receipt_no],
            ['Date', String(p.payment_date || '').slice(0, 10)],
            ['Time', String(p.payment_time || '').slice(0, 5)],
            ['Method', p.payment_method],
            ['Reference', p.reference || 'N/A'],
            ['Processed by', p.cashier_name],
            ['Amount in words', amountInWords(Number(p.amount))],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-2">
              <span className="text-gray-400 shrink-0">{k}</span>
              <span className="font-semibold text-gray-700 text-right">{v}</span>
            </div>
          ))}
          <button onClick={() => window.print()} className="mt-2 w-full flex items-center justify-center gap-2 bg-green-700 text-white text-xs font-bold py-2 rounded-xl hover:bg-green-800">
            <Printer className="w-3.5 h-3.5" /> Print Receipt
          </button>
        </div>
      )}
    </div>
  );
}

export default function ParentPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cardLoading, setCardLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load all students (a parent might have multiple children)
  const loadStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(res.data || []);
      // Auto-select first child
      if ((res.data || []).length > 0 && !selected) {
        setSelected(res.data[0]);
      }
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { loadStudents(); }, []);

  useEffect(() => {
    if (!selected) { setStudentData(null); return; }
    setCardLoading(true);
    api.get(`/students/${selected.id}`)
      .then(r => setStudentData(r.data))
      .finally(() => setCardLoading(false));
  }, [selected?.id]);

  const refresh = async () => {
    setRefreshing(true);
    if (selected) {
      try {
        const r = await api.get(`/students/${selected.id}`);
        setStudentData(r.data);
      } catch { }
    }
    setRefreshing(false);
  };

  const s = studentData?.student;
  const sum = studentData?.summary;
  const fs = studentData?.feeStructure;
  const pmts = studentData?.payments || [];
  const fee = Number(sum?.fee || 0);
  const paid = Number(sum?.paid || 0);
  const bal = Number(sum?.balance || 0);
  const pct = fee ? Math.round((paid / fee) * 100) : 0;
  const status = !fee ? null : paid >= fee ? 'cleared' : paid > 0 ? 'partial' : 'unpaid';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-green-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-gray-900 leading-tight">{user?.school_name || 'Smart Bursar'}</p>
              <p className="text-[10px] text-gray-400">Parent Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refresh} disabled={refreshing} className="p-1.5 text-gray-400 hover:text-green-700">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => { logout(); navigate('/login'); }}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Greeting */}
        <div>
          <p className="text-xs text-gray-500">Welcome back,</p>
          <h1 className="text-lg font-extrabold text-gray-900">{user?.name?.split(' ')[0] || 'Parent'} 👋</h1>
        </div>

        {/* Child selector (if multiple) */}
        {students.length > 1 && (
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Select Child</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {students.map(st => (
                <button key={st.id} onClick={() => setSelected(st)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border whitespace-nowrap transition-all
                    ${selected?.id === st.id ? 'bg-green-700 text-white border-green-700 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'}`}>
                  <GraduationCap className="w-3.5 h-3.5" />
                  {st.full_name.split(' ')[0]} · {st.class}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading || cardLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin mx-auto" />
              <p className="text-xs text-gray-400 mt-2">Loading your child's account…</p>
            </div>
          </div>
        ) : !selected || !studentData ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No student records linked to this account.</p>
            <p className="text-xs text-gray-400 mt-1">Contact the bursar's office.</p>
          </div>
        ) : (
          <>
            {/* Student Identity Card */}
            <div className="bg-gradient-to-br from-green-800 to-green-700 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative">
                <p className="text-[10px] text-green-300 uppercase tracking-widest font-bold">Student Profile</p>
                <div className="flex items-start gap-4 mt-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-extrabold shrink-0">
                    {s?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-extrabold leading-tight">{s?.full_name}</p>
                    <p className="text-xs text-green-300 mt-0.5">{s?.admission_no}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-green-200">
                      <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Class {s?.class} {s?.stream}</span>
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {s?.guardian_name}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {s?.guardian_tel}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fee Status Card */}
            {sum ? (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Term Fee Status</p>
                    <div className="mt-3 space-y-2">
                      {[
                        { label: 'Total Fee', value: fmt(fee), color: 'text-gray-900' },
                        { label: 'Paid', value: fmt(paid), color: 'text-emerald-700' },
                        { label: 'Balance', value: fmt(bal), color: bal > 0 ? 'text-red-600' : 'text-emerald-600' },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">{r.label}</span>
                          <span className={`text-sm font-extrabold ${r.color}`}>{r.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div className={`h-2.5 rounded-full transition-all duration-700 ${pct === 100 ? 'bg-emerald-500' : pct > 50 ? 'bg-green-500' : 'bg-amber-400'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{pct}% of term fee paid</p>
                    </div>
                  </div>
                  <div className="relative shrink-0">
                    <ProgressRing pct={pct} size={80} stroke={8} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-base font-extrabold text-gray-900">{pct}%</span>
                    </div>
                  </div>
                </div>

                {/* Status badge */}
                <div className={`mt-4 flex items-center gap-2 rounded-2xl p-3
                  ${status === 'cleared' ? 'bg-emerald-50 border border-emerald-200'
                    : status === 'partial' ? 'bg-blue-50 border border-blue-200'
                      : 'bg-red-50 border border-red-200'}`}>
                  {status === 'cleared'
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    : <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                  <div>
                    {status === 'cleared'
                      ? <p className="text-xs font-bold text-emerald-800">Fully paid — thank you! ✓</p>
                      : status === 'partial'
                        ? <p className="text-xs font-bold text-blue-800">Partial payment — {fmt(bal)} remaining</p>
                        : <p className="text-xs font-bold text-red-800">No payment recorded yet this term</p>}
                    <p className="text-[10px] text-gray-500 mt-0.5">Contact the bursar's office</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                <p className="text-xs font-bold text-amber-800">No invoice generated yet for this term.</p>
                <p className="text-xs text-amber-600 mt-0.5">Please visit or call the school bursar.</p>
              </div>
            )}

            {/* Fee Breakdown */}
            {fs && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-900">Fee Breakdown — Class {s?.class}</p>
                </div>
                <div className="p-5 space-y-2">
                  {[
                    { label: 'Tuition Fee', value: fs.tuition, icon: '📚' },
                    { label: 'Activity Fee', value: fs.activity, icon: '⚽' },
                    ...(fs.transport > 0 ? [{ label: 'Transport', value: fs.transport, icon: '🚌' }] : []),
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-dashed border-gray-100 last:border-0">
                      <span className="text-sm text-gray-600 flex items-center gap-2"><span>{item.icon}</span>{item.label}</span>
                      <span className="text-sm font-bold text-gray-900">{fmt(item.value)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-extrabold text-gray-900">Total Per Term</span>
                    <span className="text-sm font-extrabold text-green-700">{fmt(fee)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment History */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-900">Payment History</p>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">{pmts.length} payments</span>
              </div>
              {pmts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center">
                  <CreditCard className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-semibold">No payments recorded this term</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pmts.map((p, i) => <PaymentCard key={p.receipt_no} p={p} idx={i} />)}
                </div>
              )}
            </div>

            {/* Contact School */}
            <div className="bg-green-800 rounded-3xl p-5 text-white">
              <p className="text-xs font-bold mb-1">Need Help?</p>
              <p className="text-[10px] text-green-300 mb-3">Contact the bursar's office for any fee queries.</p>
              <div className="space-y-2 text-xs">
                {user?.school_tel && (
                  <a href={`tel:${user.school_tel}`} className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2.5 hover:bg-white/20 transition-colors">
                    <Phone className="w-4 h-4 text-green-300 shrink-0" /> {user.school_tel}
                  </a>
                )}
                <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2.5 text-green-200">
                  <Clock className="w-4 h-4 text-green-300 shrink-0" /> Mon–Fri, 7:30am – 4:30pm
                </div>
              </div>
            </div>

            {/* Bottom padding for mobile */}
            <div className="h-4" />
          </>
        )}
      </div>
    </div>
  );
}
