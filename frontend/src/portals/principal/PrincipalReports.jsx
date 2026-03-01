import { useEffect, useState } from 'react';
import { Loader2, FileDown, Search, X } from 'lucide-react';
import api from '../../api/client';
import { fmt } from '../../utils/format';
import { exportPDF } from '../../utils/pdfExport';

export default function PrincipalReports() {
  const [defaulters, setDefaulters] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [school,     setSchool]     = useState({});

  useEffect(() => {
    api.get('/settings').then(r => setSchool(r.data?.config || {})).catch(() => {});
    api.get('/reports/defaulters').then(r => setDefaulters(r.data)).finally(() => setLoading(false));
  }, []);

  const allDefaulters = defaulters?.defaulters || [];
  const shown = allDefaulters.filter(s =>
    !search ||
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.admission_no?.toLowerCase().includes(search.toLowerCase()) ||
    `${s.class} ${s.stream}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    exportPDF({
      title:      'Fee Defaulters Report',
      subtitle:   `${shown.length} students with outstanding balances`,
      schoolName: school.school_name,
      filename:   `defaulters-report-${new Date().toISOString().slice(0, 10)}.pdf`,
      orientation: 'landscape',
      summaryRows: [
        { label: 'Total Defaulters',  value: allDefaulters.length },
        { label: 'Total Outstanding', value: fmt(defaulters?.totalOutstanding || 0) },
        { label: 'Shown (filtered)',  value: shown.length },
      ],
      columns: ['#', 'Student Name', 'Adm. No.', 'Class', 'Guardian', 'Tel', 'Balance Due'],
      rows: shown.map((s, i) => [
        String(i + 1).padStart(2, '0'),
        s.full_name, s.admission_no,
        `${s.class} ${s.stream}`,
        s.guardian_name || '—',
        s.guardian_tel  || '—',
        fmt(s.balance),
      ]),
    });
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-bold text-gray-900">Defaulters Report</p>
            <p className="text-xs text-gray-500">{allDefaulters.length} students with outstanding balances</p>
          </div>
          <button onClick={handleExport}
            className="flex items-center gap-2 bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-indigo-800 transition-colors shrink-0">
            <FileDown className="w-3.5 h-3.5" /> Export PDF
          </button>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, admission no, or class…"
            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-indigo-950 text-white px-5 py-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest">Fee Defaulters List</p>
            <p className="text-xs text-indigo-300">Outstanding: {fmt(defaulters?.totalOutstanding || 0)}</p>
          </div>
          <table className="w-full text-xs">
            <thead><tr className="bg-gray-100 border-b-2 border-gray-300">
              {['#', 'Student Name', 'Adm. No.', 'Class', 'Guardian', 'Tel', 'Balance Due'].map(h => (
                <th key={h} className={`px-4 py-2.5 font-bold text-gray-700 ${h === 'Balance Due' ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {shown.map((s, i) => (
                <tr key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-red-50/20'}>
                  <td className="px-4 py-2.5 text-gray-400 font-mono">{String(i + 1).padStart(2, '0')}</td>
                  <td className="px-4 py-2.5 font-semibold text-gray-900">{s.full_name}</td>
                  <td className="px-4 py-2.5 font-mono text-gray-500">{s.admission_no}</td>
                  <td className="px-4 py-2.5 text-gray-600">{s.class} {s.stream}</td>
                  <td className="px-4 py-2.5 text-gray-600">{s.guardian_name}</td>
                  <td className="px-4 py-2.5 text-gray-500">{s.guardian_tel}</td>
                  <td className="px-4 py-2.5 text-right font-extrabold text-red-700">{fmt(s.balance)}</td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">No defaulters match the search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
