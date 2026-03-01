import { useState, useEffect } from 'react';
import { Plus, Search, FileDown, X, Loader2, AlertCircle, DollarSign, Clock, FileText } from 'lucide-react';
import Badge from '../components/Badge';
import api from '../api/client';
import { fmt } from '../utils/format';
import { exportPDF } from '../utils/pdfExport';

const CATEGORIES = ['Administrative','Transport','Utilities','Operations','Equipment','Payroll','Other'];

export default function Expenses() {
  const [expenses,   setExpenses]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [category,   setCategory]   = useState('All');
  const [showModal,  setShowModal]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState('');
  const [form, setForm] = useState({
    description: '', category: 'Administrative', amount: '', vendor: '', reference: '', expense_date: '', notes: ''
  });

  const load = () => {
    setLoading(true);
    api.get('/expenses')
      .then(r => setExpenses(r.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = expenses.filter(e =>
    (category === 'All' || e.category === category) &&
    (e.description.toLowerCase().includes(search.toLowerCase()) || (e.vendor || '').toLowerCase().includes(search.toLowerCase()))
  );

  const total = filtered.filter(e => e.status !== 'Rejected').reduce((s, e) => s + Number(e.amount), 0);

  const handleExport = () => {
    exportPDF({
      title:    'Expense Ledger',
      subtitle: `Category: ${category === 'All' ? 'All Categories' : category}`,
      filename: `expenses-${new Date().toISOString().slice(0, 10)}.pdf`,
      orientation: 'landscape',
      summaryRows: [
        { label: 'Total Approved',   value: fmt(expenses.filter(e => e.status === 'Approved').reduce((s, e) => s + Number(e.amount), 0)) },
        { label: 'Pending Approval', value: `${expenses.filter(e => e.status === 'Pending').length} items` },
        { label: 'Filtered Entries', value: filtered.length },
      ],
      columns: ['#', 'Description', 'Category', 'Vendor', 'Date', 'Ref', 'Status', 'Amount (RWF)'],
      rows: filtered.map((e, i) => [
        String(i + 1).padStart(2, '0'),
        e.description, e.category, e.vendor || '—',
        String(e.expense_date || '').slice(0, 10),
        e.reference || '—', e.status,
        Number(e.amount || 0).toLocaleString(),
      ]),
    });
  };

  const handleSubmit = async () => {
    if (!form.description || !form.category || !form.amount || !form.expense_date) {
      setFormError('Description, category, amount, and date are required.');
      return;
    }
    setSubmitting(true); setFormError('');
    try {
      await api.post('/expenses', { ...form, amount: Number(form.amount) });
      setShowModal(false);
      setForm({ description: '', category: 'Administrative', amount: '', vendor: '', reference: '', expense_date: '', notes: '' });
      load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border-l-4 border-blue-500 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Total Approved</p>
              <p className="text-sm font-extrabold text-gray-900 mt-0.5">
                {fmt(expenses.filter(e => e.status === 'Approved').reduce((s, e) => s + Number(e.amount), 0))}
              </p>
            </div>
          </div>
        </div>
        <div className="border-l-4 border-amber-500 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Pending Approval</p>
              <p className="text-sm font-extrabold text-gray-900 mt-0.5">
                {expenses.filter(e => e.status === 'Pending').length} items
              </p>
            </div>
          </div>
        </div>
        <div className="border-l-4 border-gray-400 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Total Entries</p>
              <p className="text-sm font-extrabold text-gray-900 mt-0.5">{expenses.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-100 px-5 py-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2.5 flex-wrap flex-1 items-center">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search expenses..."
              className="pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-52 transition-all" />
          </div>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
            <option>All</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
            <FileDown className="w-3.5 h-3.5" /> Export PDF
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-blue-800 transition-colors shadow-sm">
            <Plus className="w-3.5 h-3.5" /> Log Expense
          </button>
        </div>
      </div>

      {/* Expense Ledger Table */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <p className="text-xs font-extrabold uppercase tracking-widest">Expense Ledger</p>
          {!loading && (
            <span className="text-[10px] text-slate-400">{filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}</span>
          )}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-14">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="ml-2 text-sm text-gray-500">Loading expenses...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  {['No.','Description','Category','Vendor','Date','Ref','Status','Amount (RWF)'].map(h => (
                    <th key={h} className={`px-4 py-3 font-bold text-gray-600 text-[11px] uppercase tracking-wide
                      ${h === 'Amount (RWF)' ? 'text-right' : h === 'Status' ? 'text-center' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((e, i) => (
                  <tr key={e.id}
                    className={`transition-colors
                      ${e.status === 'Pending'
                        ? 'bg-amber-50 hover:bg-amber-100/60'
                        : i % 2 === 0
                        ? 'bg-white hover:bg-blue-50/30'
                        : 'bg-gray-50/50 hover:bg-blue-50/30'}`}>
                    <td className="px-4 py-3 text-gray-400 font-mono text-[11px]">{String(i+1).padStart(2,'0')}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{e.description}</td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{e.vendor || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{String(e.expense_date || '').slice(0, 10)}</td>
                    <td className="px-4 py-3 font-mono text-gray-400">{e.reference || '—'}</td>
                    <td className="px-4 py-3 text-center"><Badge label={e.status} /></td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{Number(e.amount || 0).toLocaleString()}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                      No expenses found matching the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-800 text-white font-bold">
                  <td colSpan={7} className="px-4 py-3 text-sm uppercase tracking-wide">Total (Approved)</td>
                  <td className="px-4 py-3 text-right">{total.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Log Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white px-5 py-4 rounded-t-2xl flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold">Log New Expense</h3>
                <p className="text-[11px] text-blue-200 mt-0.5">Record a school expenditure</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1">
              {formError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-xs text-red-700">{formError}</p>
                </div>
              )}
              <div className="space-y-4 text-xs">
                {[
                  { label: 'Description', key: 'description', type: 'text', placeholder: 'e.g. Printer paper for office', required: true },
                  { label: 'Vendor / Supplier', key: 'vendor', type: 'text', placeholder: 'Vendor name' },
                  { label: 'Receipt / Reference No.', key: 'reference', type: 'text', placeholder: 'e.g. REC-005' },
                  { label: 'Notes', key: 'notes', type: 'text', placeholder: 'Optional notes' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block font-semibold text-gray-700 mb-1.5">
                      {f.label}
                      {f.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    <input
                      type={f.type}
                      value={form[f.key]}
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs transition-all" />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1.5">
                      Amount (RWF) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={form.amount}
                      onChange={e => setForm({ ...form, amount: e.target.value })}
                      placeholder="0"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs transition-all" />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1.5">Category</label>
                    <select
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs transition-all">
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1.5">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.expense_date}
                    onChange={e => setForm({ ...form, expense_date: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs transition-all" />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 pb-5 flex gap-3 shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-white border border-gray-200 text-gray-700 text-xs font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-blue-700 text-white text-xs font-semibold py-2.5 rounded-xl hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm">
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Submit Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
