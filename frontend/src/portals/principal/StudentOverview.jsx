import { useEffect, useState } from 'react';
import { Loader2, FileDown, Search, X } from 'lucide-react';
import api from '../../api/client';
import { fmt } from '../../utils/format';
import Badge from '../../components/Badge';
import { exportPDF } from '../../utils/pdfExport';

export default function StudentOverview() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [school,  setSchool]  = useState({});

  useEffect(() => {
    api.get('/settings').then(r => setSchool(r.data?.config || {})).catch(() => {});
    api.get('/reports/class-collection').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const all   = data?.students || [];
  const shown = all.filter(s =>
    !search ||
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.admission_no?.includes(search)
  );

  const handleExport = () => {
    exportPDF({
      title:      'Student Directory',
      subtitle:   `${shown.length} of ${all.length} students`,
      schoolName: school.school_name,
      filename:   `student-directory-${new Date().toISOString().slice(0, 10)}.pdf`,
      orientation: 'landscape',
      summaryRows: [
        { label: 'Total Enrolled',   value: all.length   },
        { label: 'Cleared',          value: all.filter(s => s.paymentStatus === 'Cleared').length  },
        { label: 'Partial',          value: all.filter(s => s.paymentStatus === 'Partial').length  },
        { label: 'Unpaid',           value: all.filter(s => s.paymentStatus === 'Unpaid').length   },
      ],
      columns: ['#', 'Name', 'Adm. No.', 'Class', 'Guardian', 'Fee', 'Paid', 'Balance', 'Status'],
      rows: shown.map((s, i) => [
        String(i + 1).padStart(3, '0'),
        s.full_name, s.admission_no,
        `${s.class} ${s.stream}`,
        s.guardian_name || '—',
        Number(s.fee || 0).toLocaleString(),
        Number(s.paid || 0).toLocaleString(),
        Number(s.balance || 0).toLocaleString(),
        s.paymentStatus || '—',
      ]),
    });
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center gap-3 justify-between">
        <p className="text-sm font-bold text-gray-900">All Students — {all.length} enrolled</p>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or admission no…"
              className="w-full pl-9 pr-8 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <button onClick={handleExport}
          className="flex items-center gap-2 bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-indigo-800 transition-colors shrink-0">
          <FileDown className="w-3.5 h-3.5" /> Export PDF
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-indigo-950 text-white px-5 py-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest">Student Directory</p>
            <span className="text-[10px] text-indigo-300 bg-white/10 px-2 py-0.5 rounded-full">{shown.length} shown</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-gray-100 border-b-2 border-gray-300">
                {['#', 'Name', 'Adm. No.', 'Class', 'Guardian', 'Fee', 'Paid', 'Balance', 'Status'].map(h => (
                  <th key={h} className={`px-3 py-2.5 font-bold text-gray-700
                    ${['Fee', 'Paid', 'Balance'].includes(h) ? 'text-right' : h === 'Status' ? 'text-center' : 'text-left'}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {shown.map((s, i) => (
                  <tr key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                    <td className="px-3 py-2.5 text-gray-400 font-mono">{String(i + 1).padStart(3, '0')}</td>
                    <td className="px-3 py-2.5 font-semibold text-gray-900">{s.full_name}</td>
                    <td className="px-3 py-2.5 font-mono text-gray-500">{s.admission_no}</td>
                    <td className="px-3 py-2.5 text-gray-600">{s.class} {s.stream}</td>
                    <td className="px-3 py-2.5 text-gray-500">{s.guardian_name}</td>
                    <td className="px-3 py-2.5 text-right text-gray-700">{Number(s.fee || 0).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-emerald-700">{Number(s.paid || 0).toLocaleString()}</td>
                    <td className={`px-3 py-2.5 text-right font-bold ${Number(s.balance || 0) > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{Number(s.balance || 0).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-center"><Badge label={s.paymentStatus || 'No Invoice'} /></td>
                  </tr>
                ))}
                {shown.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400 text-sm">No students found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
