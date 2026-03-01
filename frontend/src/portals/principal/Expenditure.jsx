import { useEffect, useState } from 'react';
import { Loader2, TrendingDown, FileDown, Search, X } from 'lucide-react';
import api from '../../api/client';
import { fmt } from '../../utils/format';
import Badge from '../../components/Badge';
import { exportPDF } from '../../utils/pdfExport';

export default function Expenditure() {
  const [expenses, setExpenses] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('All');
  const [school,   setSchool]   = useState({});

  useEffect(() => {
    api.get('/settings').then(r => setSchool(r.data?.config || {})).catch(() => {});
    api.get('/expenses').then(r => setExpenses(r.data || [])).finally(() => setLoading(false));
  }, []);

  const approved   = expenses.filter(e => e.status === 'Approved');
  const pending    = expenses.filter(e => e.status === 'Pending');
  const byCategory = approved.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + Number(e.amount); return acc; }, {});
  const total      = approved.reduce((s, e) => s + Number(e.amount), 0);

  const shown = expenses.filter(e =>
    (status === 'All' || e.status === status) &&
    (!search || e.description?.toLowerCase().includes(search.toLowerCase()) ||
                e.category?.toLowerCase().includes(search.toLowerCase()) ||
                (e.submitted_by_name || '').toLowerCase().includes(search.toLowerCase()))
  );

  const handleExport = () => {
    exportPDF({
      title:      'Expenditure Report',
      subtitle:   `Status: ${status}`,
      schoolName: school.school_name,
      filename:   `expenditure-${new Date().toISOString().slice(0, 10)}.pdf`,
      orientation: 'landscape',
      summaryRows: [
        { label: 'Total Approved',    value: fmt(total) },
        { label: 'Pending Approval',  value: `${pending.length} items` },
        { label: 'Shown (filtered)',  value: shown.length },
      ],
      columns: ['Ref', 'Description', 'Category', 'Date', 'Submitted By', 'Status', 'Amount'],
      rows: shown.map(e => [
        e.expense_no || '—',
        e.description,
        e.category,
        String(e.expense_date || '').slice(0, 10),
        e.submitted_by_name || '—',
        e.status,
        Number(e.amount || 0).toLocaleString(),
      ]),
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Approved',   value: fmt(total),              color: 'border-l-4 border-indigo-500 bg-indigo-50' },
          { label: 'Pending Approval', value: `${pending.length} items`, color: 'border-l-4 border-amber-400 bg-amber-50'  },
          { label: 'Categories',       value: Object.keys(byCategory).length, color: 'border-l-4 border-gray-400 bg-gray-50' },
        ].map(c => (
          <div key={c.label} className={`${c.color} rounded-xl p-4 shadow-sm`}>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">{c.label}</p>
            <p className="text-sm font-extrabold text-gray-900 mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Spending by Category */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100"><p className="text-xs font-bold text-gray-900">Spending by Category</p></div>
        <div className="p-5 space-y-3">
          {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => {
            const pct = total ? Math.round((amt / total) * 100) : 0;
            return (
              <div key={cat}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-gray-700">{cat}</span>
                  <span className="font-bold text-gray-900">{fmt(amt)} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                </div>
                <div className="bg-gray-100 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-1.5">
            {['All', 'Approved', 'Pending', 'Rejected'].map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
                  ${status === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400'}`}>
                {s}
              </button>
            ))}
          </div>
          <button onClick={handleExport}
            className="flex items-center gap-2 bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-indigo-800 transition-colors shrink-0">
            <FileDown className="w-3.5 h-3.5" /> Export PDF
          </button>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by description, category, or submitted by…"
            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Expense Records Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-indigo-950 text-white px-5 py-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest">Expense Records</p>
          <span className="text-[10px] text-indigo-300 bg-white/10 px-2 py-0.5 rounded-full">{shown.length} shown</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /></div>
        ) : (
          <table className="w-full text-xs">
            <thead><tr className="bg-gray-100 border-b-2 border-gray-300">
              {['Ref', 'Description', 'Category', 'Date', 'Submitted By', 'Status', 'Amount'].map(h => (
                <th key={h} className={`px-4 py-2.5 font-bold text-gray-700 ${h === 'Amount' ? 'text-right' : h === 'Status' ? 'text-center' : 'text-left'}`}>{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {shown.map((e, i) => (
                <tr key={e.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="px-4 py-2.5 font-mono text-gray-500">{e.expense_no}</td>
                  <td className="px-4 py-2.5 font-semibold text-gray-900">{e.description}</td>
                  <td className="px-4 py-2.5"><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px]">{e.category}</span></td>
                  <td className="px-4 py-2.5 text-gray-500">{String(e.expense_date || '').slice(0, 10)}</td>
                  <td className="px-4 py-2.5 text-gray-600">{e.submitted_by_name}</td>
                  <td className="px-4 py-2.5 text-center"><Badge label={e.status} /></td>
                  <td className="px-4 py-2.5 text-right font-bold text-gray-900">{Number(e.amount).toLocaleString()}</td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">No expenses match the current filter.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
