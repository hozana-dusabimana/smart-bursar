import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, AlertCircle, FileDown, Search, X } from 'lucide-react';
import api from '../../api/client';
import { fmt } from '../../utils/format';
import Badge from '../../components/Badge';
import { exportPDF } from '../../utils/pdfExport';

export default function ExpenseApproval() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter,  setFilter]    = useState('Pending');
  const [search,  setSearch]    = useState('');
  const [acting,  setActing]    = useState(null);
  const [msg,     setMsg]       = useState('');
  const [school,  setSchool]    = useState({});

  const load = () => {
    setLoading(true);
    api.get('/expenses').then(r => setExpenses(r.data || [])).finally(() => setLoading(false));
  };
  useEffect(() => {
    api.get('/settings').then(r => setSchool(r.data?.config || {})).catch(() => {});
    load();
  }, []);

  const act = async (id, status) => {
    setActing(id);
    try {
      await api.put(`/expenses/${id}/status`, { status });
      setMsg(`Expense ${status.toLowerCase()}`);
      load();
      setTimeout(() => setMsg(''), 3000);
    } catch(e) { setMsg(`Error: ${e.message}`); }
    finally { setActing(null); }
  };

  const filtered = expenses.filter(e =>
    (filter === 'All' || e.status === filter) &&
    (!search || e.description?.toLowerCase().includes(search.toLowerCase()) ||
                e.category?.toLowerCase().includes(search.toLowerCase()) ||
                (e.vendor || '').toLowerCase().includes(search.toLowerCase()) ||
                (e.submitted_by_name || '').toLowerCase().includes(search.toLowerCase()))
  );

  const handleExport = () => {
    exportPDF({
      title:      'Expense Approval Report',
      subtitle:   `Status: ${filter} · ${filtered.length} records`,
      schoolName: school.school_name,
      filename:   `expense-approval-${new Date().toISOString().slice(0, 10)}.pdf`,
      orientation: 'landscape',
      summaryRows: [
        { label: 'Pending',  value: expenses.filter(e => e.status === 'Pending').length,  },
        { label: 'Approved', value: expenses.filter(e => e.status === 'Approved').length, },
        { label: 'Rejected', value: expenses.filter(e => e.status === 'Rejected').length, },
        { label: 'Total Amount', value: fmt(filtered.reduce((s, e) => s + Number(e.amount || 0), 0)) },
      ],
      columns: ['Ref', 'Description', 'Category', 'Vendor', 'Date', 'Submitted By', 'Status', 'Amount'],
      rows: filtered.map(e => [
        e.expense_no || '—',
        e.description,
        e.category,
        e.vendor || '—',
        String(e.expense_date || '').slice(0, 10),
        e.submitted_by_name || '—',
        e.status,
        Number(e.amount || 0).toLocaleString(),
      ]),
    });
  };

  return (
    <div className="space-y-5">
      {msg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <p className="text-xs text-emerald-700 font-medium">{msg}</p>
        </div>
      )}

      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending Approval', count: expenses.filter(e => e.status === 'Pending').length,  total: expenses.filter(e => e.status === 'Pending').reduce((s, e) => s + Number(e.amount), 0),  color: 'border-l-4 border-amber-500 bg-amber-50'   },
          { label: 'Approved',         count: expenses.filter(e => e.status === 'Approved').length, total: expenses.filter(e => e.status === 'Approved').reduce((s, e) => s + Number(e.amount), 0), color: 'border-l-4 border-emerald-500 bg-emerald-50' },
          { label: 'Rejected',         count: expenses.filter(e => e.status === 'Rejected').length, total: expenses.filter(e => e.status === 'Rejected').reduce((s, e) => s + Number(e.amount), 0), color: 'border-l-4 border-red-500 bg-red-50'         },
        ].map(c => (
          <div key={c.label} className={`${c.color} rounded-xl p-4 shadow-sm`}>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">{c.label}</p>
            <p className="text-xl font-extrabold text-gray-900 mt-1">{c.count}</p>
            <p className="text-xs text-gray-600 mt-0.5">{fmt(c.total)}</p>
          </div>
        ))}
      </div>

      {/* Filter + Search + Export */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {['Pending', 'Approved', 'Rejected', 'All'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
                  ${filter === f ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-200 hover:border-teal-400'}`}>
                {f} ({f === 'All' ? expenses.length : expenses.filter(e => e.status === f).length})
              </button>
            ))}
          </div>
          <button onClick={handleExport}
            className="flex items-center gap-2 bg-teal-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors shrink-0">
            <FileDown className="w-3.5 h-3.5" /> Export PDF
          </button>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by description, category, vendor, or submitted by…"
            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-slate-800 text-white px-5 py-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest">Expense Records</p>
          <span className="text-[10px] text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">{filtered.length} shown</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
            <span className="ml-2 text-sm text-gray-500">Loading...</span>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                {['Ref', 'Description', 'Category', 'Vendor', 'Date', 'Submitted By', 'Status', 'Amount', 'Action'].map(h => (
                  <th key={h} className={`px-3 py-2.5 font-bold text-gray-700 ${h === 'Amount' ? 'text-right' : h === 'Action' ? 'text-center' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((e, i) => (
                <tr key={e.id} className={`${e.status === 'Pending' ? 'bg-amber-50/50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-teal-50/20`}>
                  <td className="px-3 py-2.5 font-mono text-gray-500">{e.expense_no}</td>
                  <td className="px-3 py-2.5 font-semibold text-gray-900 max-w-[140px] truncate">{e.description}</td>
                  <td className="px-3 py-2.5"><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px]">{e.category}</span></td>
                  <td className="px-3 py-2.5 text-gray-600">{e.vendor || '—'}</td>
                  <td className="px-3 py-2.5 text-gray-500">{String(e.expense_date || '').slice(0, 10)}</td>
                  <td className="px-3 py-2.5 text-gray-600">{e.submitted_by_name || '—'}</td>
                  <td className="px-3 py-2.5"><Badge label={e.status} /></td>
                  <td className="px-3 py-2.5 text-right font-bold text-gray-900">{Number(e.amount || 0).toLocaleString()}</td>
                  <td className="px-3 py-2.5">
                    {e.status === 'Pending' ? (
                      <div className="flex items-center gap-1 justify-center">
                        <button onClick={() => act(e.id, 'Approved')} disabled={acting === e.id}
                          className="flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg hover:bg-emerald-700 disabled:opacity-60">
                          {acting === e.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Approve
                        </button>
                        <button onClick={() => act(e.id, 'Rejected')} disabled={acting === e.id}
                          className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg hover:bg-red-700 disabled:opacity-60">
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400 block text-center">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400 text-sm">No expense records match the filter.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
