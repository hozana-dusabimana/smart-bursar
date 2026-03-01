import { useEffect, useState } from 'react';
import { Loader2, FileDown, Search, X } from 'lucide-react';
import api from '../../api/client';
import { fmt } from '../../utils/format';
import Badge from '../../components/Badge';
import { exportPDF } from '../../utils/pdfExport';

export default function FeeCollection() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [cls,     setCls]     = useState('');
  const [search,  setSearch]  = useState('');
  const [school,  setSchool]  = useState({});

  useEffect(() => {
    api.get('/settings').then(r => setSchool(r.data?.config || {})).catch(() => {});
    api.get('/reports/class-collection')
      .then(r => {
        setData(r.data);
        const classes = [...new Set((r.data?.students || []).map(s => s.class))].sort();
        if (classes.length > 0) setCls(classes[0]);
      }).finally(() => setLoading(false));
  }, []);

  const all     = data?.students || [];
  const classes = [...new Set(all.map(s => s.class))].sort();
  const shown   = all.filter(s =>
    (cls ? s.class === cls : true) &&
    (!search || s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                s.admission_no?.toLowerCase().includes(search.toLowerCase()))
  );
  const totals  = shown.reduce((a, s) => ({
    fee:  a.fee  + Number(s.fee     || 0),
    paid: a.paid + Number(s.paid    || 0),
    bal:  a.bal  + Number(s.balance || 0),
  }), { fee: 0, paid: 0, bal: 0 });

  const handleExport = () => {
    exportPDF({
      title:      `Fee Collection — Class ${cls || 'All'}`,
      subtitle:   `${shown.length} students`,
      schoolName: school.school_name,
      filename:   `fee-collection-${cls || 'all'}-${new Date().toISOString().slice(0, 10)}.pdf`,
      orientation: 'landscape',
      summaryRows: [
        { label: 'Students',        value: shown.length    },
        { label: 'Total Expected',  value: fmt(totals.fee) },
        { label: 'Total Collected', value: fmt(totals.paid)},
        { label: 'Outstanding',     value: fmt(totals.bal) },
      ],
      columns: ['#', 'Student Name', 'Adm. No.', 'Total Fee', 'Paid', 'Balance', 'Progress', 'Status'],
      rows: shown.map((s, i) => {
        const fee  = Number(s.fee     || 0);
        const paid = Number(s.paid    || 0);
        const pct  = fee ? Math.round((paid / fee) * 100) : 0;
        return [
          String(i + 1).padStart(2, '0'),
          s.full_name, s.admission_no,
          fee.toLocaleString(), paid.toLocaleString(),
          Number(s.balance || 0).toLocaleString(),
          `${pct}%`, s.paymentStatus || '—',
        ];
      }),
    });
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <p className="text-sm font-bold text-gray-900">Fee Collection by Class</p>
          <button onClick={handleExport}
            className="flex items-center gap-2 bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-indigo-800 transition-colors shrink-0">
            <FileDown className="w-3.5 h-3.5" /> Export PDF
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {classes.map(c => (
            <button key={c} onClick={() => setCls(c)}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all
                ${cls === c ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400'}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by student name or admission no…"
            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Students',        value: shown.length    },
          { label: 'Total Expected',  value: fmt(totals.fee) },
          { label: 'Total Collected', value: fmt(totals.paid), highlight: true },
          { label: 'Outstanding',     value: fmt(totals.bal) },
        ].map(c => (
          <div key={c.label} className={`rounded-xl p-4 shadow-sm border ${c.highlight ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-gray-100'}`}>
            <p className={`text-[10px] uppercase tracking-wide font-semibold ${c.highlight ? 'text-indigo-200' : 'text-gray-500'}`}>{c.label}</p>
            <p className={`text-sm font-extrabold mt-1 ${c.highlight ? 'text-white' : 'text-gray-900'}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-indigo-950 text-white px-5 py-3">
            <p className="text-xs font-bold uppercase tracking-widest">Class {cls} · {shown.length} Students</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-gray-100 border-b-2 border-gray-300">
                {['#', 'Student Name', 'Adm. No.', 'Total Fee', 'Paid', 'Balance', 'Progress', 'Status'].map(h => (
                  <th key={h} className={`px-4 py-2.5 font-bold text-gray-700
                    ${['Total Fee', 'Paid', 'Balance'].includes(h) ? 'text-right' : h === 'Progress' || h === 'Status' ? 'text-center' : 'text-left'}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {shown.map((s, i) => {
                  const fee  = Number(s.fee     || 0);
                  const paid = Number(s.paid    || 0);
                  const bal  = Number(s.balance || 0);
                  const pct  = fee ? Math.round((paid / fee) * 100) : 0;
                  return (
                    <tr key={s.id} className={s.paymentStatus === 'Unpaid' ? 'bg-red-50/40' : s.paymentStatus === 'Cleared' ? 'bg-emerald-50/30' : 'bg-white'}>
                      <td className="px-4 py-2.5 text-gray-400 font-mono">{String(i + 1).padStart(2, '0')}</td>
                      <td className="px-4 py-2.5 font-semibold text-gray-900">{s.full_name}</td>
                      <td className="px-4 py-2.5 font-mono text-gray-500">{s.admission_no}</td>
                      <td className="px-4 py-2.5 text-right text-gray-700">{fee.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-emerald-700">{paid.toLocaleString()}</td>
                      <td className={`px-4 py-2.5 text-right font-bold ${bal > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{bal.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center gap-1.5 justify-center">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${pct === 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-indigo-500' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-gray-500 text-[10px]">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center"><Badge label={s.paymentStatus || 'No Invoice'} /></td>
                    </tr>
                  );
                })}
                {shown.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">No students found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
