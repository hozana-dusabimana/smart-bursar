import { useEffect, useState } from 'react';
import { Loader2, FileDown, Search, X } from 'lucide-react';
import api from '../../api/client';
import { fmt } from '../../utils/format';
import Badge from '../../components/Badge';
import { exportPDF } from '../../utils/pdfExport';

export default function FullLedger() {
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [method,   setMethod]   = useState('All');
  const [search,   setSearch]   = useState('');
  const [school,   setSchool]   = useState({});

  useEffect(() => {
    api.get('/settings').then(r => setSchool(r.data?.config || {})).catch(() => {});
    api.get('/payments').then(r => setPayments(r.data || [])).finally(() => setLoading(false));
  }, []);

  const filtered = payments.filter(p =>
    (method === 'All' || p.payment_method === method) &&
    (!search || p.student_name?.toLowerCase().includes(search.toLowerCase()) ||
                p.receipt_no?.toLowerCase().includes(search.toLowerCase()) ||
                p.admission_no?.toLowerCase().includes(search.toLowerCase()))
  );
  const total = filtered.reduce((s, p) => s + Number(p.amount), 0);

  const handleExport = () => {
    exportPDF({
      title:      'Full Payment Ledger',
      subtitle:   `Method: ${method} · ${filtered.length} entries`,
      schoolName: school.school_name,
      filename:   `payment-ledger-${new Date().toISOString().slice(0, 10)}.pdf`,
      orientation: 'landscape',
      summaryRows: [
        { label: 'Cash',   value: fmt(payments.filter(p => p.payment_method === 'Cash').reduce((s, p) => s + Number(p.amount), 0)) },
        { label: 'MoMo',   value: fmt(payments.filter(p => p.payment_method === 'MoMo').reduce((s, p) => s + Number(p.amount), 0)) },
        { label: 'Bank',   value: fmt(payments.filter(p => p.payment_method === 'Bank').reduce((s, p) => s + Number(p.amount), 0)) },
        { label: 'Total',  value: fmt(total) },
      ],
      columns: ['#', 'Receipt No.', 'Date', 'Student', 'Adm. No.', 'Class', 'Method', 'Reference', 'Cashier', 'Amount'],
      rows: filtered.map((p, i) => [
        String(i + 1).padStart(3, '0'),
        p.receipt_no,
        String(p.payment_date || '').slice(0, 10),
        p.student_name,
        p.admission_no,
        `${p.class}${p.stream}`,
        p.payment_method,
        p.reference || '—',
        p.cashier_name,
        Number(p.amount).toLocaleString(),
      ]),
    });
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-bold text-gray-900">Full Payment Ledger</p>
            <p className="text-xs text-gray-500">All recorded payments this term</p>
          </div>
          <button onClick={handleExport}
            className="flex items-center gap-2 bg-teal-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors shrink-0">
            <FileDown className="w-3.5 h-3.5" /> Export PDF
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by student name, receipt or admission no…"
              className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-1.5 shrink-0">
            {['All', 'Cash', 'MoMo', 'Bank'].map(m => (
              <button key={m} onClick={() => setMethod(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
                  ${method === m ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-200 hover:border-teal-400'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-slate-800 text-white px-5 py-3 flex justify-between">
          <p className="text-xs font-bold uppercase tracking-widest">Payment Records — {filtered.length} entries</p>
          <p className="text-xs text-teal-300 font-bold">Total: {fmt(total)}</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
            <span className="ml-2 text-sm text-gray-500">Loading...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  {['#', 'Receipt No.', 'Date', 'Student', 'Adm. No.', 'Class', 'Method', 'Reference', 'Cashier', 'Amount'].map(h => (
                    <th key={h} className={`px-3 py-2.5 font-bold text-gray-700 ${h === 'Amount' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p, i) => (
                  <tr key={p.receipt_no} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-3 py-2 text-gray-400 font-mono">{String(i + 1).padStart(3, '0')}</td>
                    <td className="px-3 py-2 font-mono text-gray-600">{p.receipt_no}</td>
                    <td className="px-3 py-2 text-gray-600">{String(p.payment_date || '').slice(0, 10)}</td>
                    <td className="px-3 py-2 font-semibold text-gray-900">{p.student_name}</td>
                    <td className="px-3 py-2 font-mono text-gray-500">{p.admission_no}</td>
                    <td className="px-3 py-2 text-gray-600">{p.class}{p.stream}</td>
                    <td className="px-3 py-2"><Badge label={p.payment_method} /></td>
                    <td className="px-3 py-2 text-gray-400">{p.reference || '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{p.cashier_name}</td>
                    <td className="px-3 py-2 text-right font-bold text-gray-900">{Number(p.amount).toLocaleString()}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-400 text-sm">No payments match the filter.</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-teal-700 text-white font-bold">
                  <td colSpan={9} className="px-3 py-3 text-sm uppercase">Total — {filtered.length} payments</td>
                  <td className="px-3 py-3 text-right">{total.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
