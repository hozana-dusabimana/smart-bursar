import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, UserCheck, UserX, Loader2, X, AlertCircle, CheckCircle2, GraduationCap, Send, FileDown } from 'lucide-react';
import api from '../api/client';
import Badge from '../components/Badge';
import { fmt } from '../utils/format';
import { exportPDF } from '../utils/pdfExport';

const CLASSES = ['Nursery', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
const STREAMS = ['A', 'B', 'C', 'D'];

const EMPTY_FORM = {
  full_name: '', admission_no: '', class_name: 'P1', stream: 'A',
  guardian_name: '', guardian_tel: '', guardian_email: '', enrolled_at: ''
};

function StudentModal({ student, onClose, onSaved }) {
  const [form, setForm] = useState(student ? {
    full_name: student.full_name, admission_no: student.admission_no,
    class_name: student.class, stream: student.stream,
    guardian_name: student.guardian_name || '', guardian_tel: student.guardian_tel || '',
    guardian_email: student.guardian_email || '', enrolled_at: String(student.enrolled_at || '').slice(0, 10)
  } : { ...EMPTY_FORM, enrolled_at: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [genInv, setGenInv] = useState(!student); // Auto-generate invoice for new students

  const handleResend = async () => {
    if (!student?.guardian_email) return;
    setResending(true); setError(''); setSuccess('');
    try {
      await api.post(`/students/${student.id}/resend-invitation`);
      setSuccess('Invitation resent successfully ✓');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to resend invitation');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.full_name || !form.admission_no || !form.class_name)
      return setError('Full name, admission number, and class are required.');

    setSaving(true); setError('');
    try {
      if (student) {
        await api.put(`/students/${student.id}`, form);
      } else {
        const res = await api.post('/students', form);
        // Auto-generate invoice for new student
        if (genInv) {
          await api.post('/invoices/generate', { student_id: res.data.id }).catch(() => { });
        }
      }
      onSaved();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const fields = [
    { label: 'Full Name *', key: 'full_name', type: 'text', placeholder: 'e.g. Amara Uwase', col: 2 },
    { label: 'Admission Number *', key: 'admission_no', type: 'text', placeholder: 'e.g. KIS/2025/0001', col: 1, disabled: !!student },
    { label: 'Enrolled Date', key: 'enrolled_at', type: 'date', placeholder: '', col: 1 },
    { label: 'Guardian Name', key: 'guardian_name', type: 'text', placeholder: 'e.g. Uwase Emmanuel', col: 1 },
    { label: 'Guardian Phone', key: 'guardian_tel', type: 'text', placeholder: '+250 788 000 000', col: 1 },
    { label: 'Guardian Email', key: 'guardian_email', type: 'email', placeholder: 'guardian@email.com', col: 2 },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <p className="text-sm font-extrabold">{student ? 'Edit Student' : 'Enrol New Student'}</p>
            <p className="text-[10px] text-slate-400">{student ? `Editing: ${student.full_name}` : 'Register a new student in the system'}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" /><p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /><p className="text-xs text-emerald-700">{success}</p>
            </div>
          )}

          {/* Class + Stream row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Class *</label>
              <select value={form.class_name} onChange={e => setForm({ ...form, class_name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CLASSES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Stream</label>
              <select value={form.stream} onChange={e => setForm({ ...form, stream: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {STREAMS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Other fields */}
          <div className="grid grid-cols-2 gap-4">
            {fields.map(f => (
              <div key={f.key} className={f.col === 2 ? 'col-span-2' : ''}>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder} disabled={f.disabled}
                  className={`w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${f.disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-gray-50'}`} />
              </div>
            ))}
          </div>

          {/* Auto-invoice toggle (new students only) */}
          {!student && (
            <label className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 cursor-pointer">
              <input type="checkbox" checked={genInv} onChange={e => setGenInv(e.target.checked)} className="w-4 h-4 accent-blue-600" />
              <div>
                <p className="text-xs font-bold text-blue-800">Auto-generate term invoice</p>
                <p className="text-[10px] text-blue-600">Creates fee invoice for the current active term</p>
              </div>
            </label>
          )}
        </div>

        <div className="border-t border-gray-100 px-6 py-4 flex gap-3 bg-gray-50 shrink-0">
          <button onClick={onClose} className="bg-white border border-gray-200 text-gray-700 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-gray-100">
            Cancel
          </button>

          {student && student.guardian_email && (
            <button
              onClick={handleResend}
              disabled={resending || saving}
              className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-emerald-100 disabled:opacity-50"
            >
              {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Resend Invitation
            </button>
          )}

          <button onClick={handleSubmit} disabled={saving || resending}
            className="flex-1 bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-blue-800 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {student ? 'Save Changes' : 'Enrol Student'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentEnrollment() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cls, setCls] = useState('All');
  const [modal, setModal] = useState(null); // null | 'add' | student_object
  const [msg, setMsg] = useState('');
  const [quickResending, setQuickResending] = useState(null); // studentId

  const handleQuickResend = async (e, s) => {
    e.stopPropagation();
    if (!s.guardian_email) return;
    setQuickResending(s.id);
    try {
      await api.post(`/students/${s.id}/resend-invitation`);
      flash('Invitation resent successfully ✓');
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to resend invitation');
    } finally {
      setQuickResending(null);
    }
  };

  const load = () => {
    setLoading(true);
    api.get('/students').then(r => setStudents(r.data || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3500); };

  const onSaved = () => {
    setModal(null);
    load();
    flash('Student saved successfully ✓');
  };

  const filtered = students.filter(s =>
    (cls === 'All' || s.class === cls) &&
    (!search || s.full_name.toLowerCase().includes(search.toLowerCase()) || s.admission_no.includes(search))
  );

  const stats = {
    total: students.length,
    cleared: students.filter(s => s.paymentStatus === 'Cleared').length,
    partial: students.filter(s => s.paymentStatus === 'Partial').length,
    unpaid: students.filter(s => s.paymentStatus === 'Unpaid').length,
  };

  const handleExport = () => {
    exportPDF({
      title:      'Student Register',
      subtitle:   `Class: ${cls === 'All' ? 'All Classes' : cls}  ·  ${filtered.length} students`,
      filename:   `student-register-${new Date().toISOString().slice(0,10)}.pdf`,
      orientation: 'landscape',
      summaryRows: [
        { label: 'Total',   value: stats.total   },
        { label: 'Cleared', value: stats.cleared  },
        { label: 'Partial', value: stats.partial  },
        { label: 'Unpaid',  value: stats.unpaid   },
      ],
      columns: ['#','Adm. No.','Full Name','Class','Guardian','Phone','Total Fee','Paid','Balance','Status'],
      rows: filtered.map((s, i) => [
        String(i+1).padStart(3,'0'), s.admission_no, s.full_name,
        `${s.class} ${s.stream}`, s.guardian_name||'—', s.guardian_tel||'—',
        Number(s.fee||0).toLocaleString(), Number(s.paid||0).toLocaleString(),
        Number(s.balance||0).toLocaleString(), s.paymentStatus||'—',
      ]),
    });
  };

  return (
    <div className="space-y-5">
      {msg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /><p className="text-xs text-emerald-700 font-medium">{msg}</p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Students', value: stats.total, color: 'border-blue-600' },
          { label: 'Fully Cleared', value: stats.cleared, color: 'border-emerald-500' },
          { label: 'Partial Payment', value: stats.partial, color: 'border-blue-400' },
          { label: 'No Payment', value: stats.unpaid, color: 'border-red-500' },
        ].map(s => (
          <div key={s.label} className={`border-l-4 ${s.color} rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-100`}>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">{s.label}</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-100 p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or admission no…"
              className="w-full sm:w-56 pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={cls} onChange={e => setCls(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="All">All Classes</option>
            {CLASSES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={handleExport} className="flex items-center justify-center gap-2 bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-800">
            <FileDown className="w-3.5 h-3.5" /> Export PDF
          </button>
          <button onClick={() => setModal('add')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-700 text-white text-xs font-extrabold px-5 py-2 rounded-xl hover:bg-blue-800 shadow-sm">
            <Plus className="w-3.5 h-3.5" /> Enrol Student
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <p className="text-xs font-extrabold uppercase tracking-widest">
            <GraduationCap className="w-3.5 h-3.5 inline mr-2" />Student Register — {filtered.length} students
          </p>
          <p className="text-[10px] text-slate-400 hidden sm:block">Click a row to edit</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 text-blue-600 animate-spin" /><span className="ml-2 text-sm text-gray-500">Loading students…</span></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
              <GraduationCap className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-600">No students found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search or class filter</p>
            <button onClick={() => setModal('add')} className="mt-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors">
              + Enrol First Student
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['#', 'Admission No.', 'Full Name', 'Class', 'Guardian', 'Phone', 'Email', 'Fee', 'Paid', 'Balance', 'Status', ''].map(h => (
                    <th key={h} className={`px-3 py-2.5 text-[11px] uppercase tracking-wide font-bold text-gray-500 ${['Fee', 'Paid', 'Balance'].includes(h) ? 'text-right' : h === '' ? 'text-center' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s, i) => (
                  <tr key={s.id}
                    onClick={() => setModal(s)}
                    className={`cursor-pointer transition-colors
                      ${s.paymentStatus === 'Unpaid' ? 'bg-red-50/40 hover:bg-red-50'
                        : s.paymentStatus === 'Cleared' ? 'bg-emerald-50/20 hover:bg-emerald-50'
                          : 'bg-white hover:bg-blue-50/40'}`}>
                    <td className="px-3 py-2.5 text-gray-400">{String(i + 1).padStart(3, '0')}</td>
                    <td className="px-3 py-2.5 font-mono text-gray-600 text-[11px]">{s.admission_no}</td>
                    <td className="px-3 py-2.5 font-bold text-gray-900">{s.full_name}</td>
                    <td className="px-3 py-2.5 text-gray-700">{s.class} {s.stream}</td>
                    <td className="px-3 py-2.5 text-gray-600 max-w-[100px] truncate">{s.guardian_name || '—'}</td>
                    <td className="px-3 py-2.5 text-gray-500">{s.guardian_tel || '—'}</td>
                    <td className="px-3 py-2.5 text-gray-400 text-[10px]">{s.guardian_email || '—'}</td>
                    <td className="px-3 py-2.5 text-right text-gray-700">{Number(s.fee || 0).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-emerald-700">{Number(s.paid || 0).toLocaleString()}</td>
                    <td className={`px-3 py-2.5 text-right font-bold ${Number(s.balance || 0) > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{Number(s.balance || 0).toLocaleString()}</td>
                    <td className="px-3 py-2.5"><Badge label={s.paymentStatus || 'No Invoice'} /></td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {s.guardian_email && (
                          <button
                            onClick={(e) => handleQuickResend(e, s)}
                            disabled={quickResending === s.id}
                            title="Resend Invitation"
                            className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors disabled:opacity-50"
                          >
                            {quickResending === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); setModal(s); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!!modal && (
        <StudentModal
          student={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
