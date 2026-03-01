import { useState, useEffect } from 'react';
import { FileDown, Loader2, Search, X } from 'lucide-react';
import Badge from '../components/Badge';
import api from '../api/client';
import { fmt } from '../utils/format';
import { exportPDF } from '../utils/pdfExport';

export default function ClassCollection() {
  const [allData,       setAllData]       = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading,       setLoading]       = useState(true);
  const [school,        setSchool]        = useState({});
  const [search,        setSearch]        = useState('');

  useEffect(() => {
    api.get('/settings').then(r => setSchool(r.data?.config || {})).catch(() => {});
    api.get('/reports/class-collection')
      .then(r => {
        setAllData(r.data);
        const classes = [...new Set((r.data?.students || []).map(s => s.class))].sort();
        if (classes.length > 0 && !selectedClass) setSelectedClass(classes[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  const allStudents = allData?.students || [];
  const classes     = [...new Set(allStudents.map(s => s.class))].sort();
  const students    = allStudents.filter(s =>
    (selectedClass ? s.class === selectedClass : true) &&
    (!search || s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                s.admission_no?.toLowerCase().includes(search.toLowerCase()))
  );

  const totals = students.reduce((acc, s) => ({
    fee:     acc.fee + Number(s.fee || 0),
    paid:    acc.paid + Number(s.paid || 0),
    balance: acc.balance + Number(s.balance || 0),
  }), { fee: 0, paid: 0, balance: 0 });

  const collectionRate = totals.fee ? Math.round((totals.paid / totals.fee) * 100) : 0;

  const handleExport = () => {
    exportPDF({
      title:      `Class Collection Sheet — Class ${selectedClass || 'All'}`,
      subtitle:   `${students.length} students  ·  Collection rate: ${collectionRate}%`,
      schoolName: school.school_name,
      filename:   `class-collection-${selectedClass || 'all'}-${new Date().toISOString().slice(0,10)}.pdf`,
      orientation: 'landscape',
      summaryRows: [
        { label: 'Students',       value: students.length      },
        { label: 'Total Expected', value: fmt(totals.fee)      },
        { label: 'Total Collected',value: fmt(totals.paid)     },
        { label: 'Outstanding',    value: fmt(totals.balance)  },
      ],
      columns: ['#','Student Name','Adm. No.','Stream','Total Fee','Paid','Balance','Progress','Status'],
      rows: students.map((s, i) => {
        const fee=Number(s.fee||0),paid=Number(s.paid||0),bal=Number(s.balance||0);
        const pct=fee?Math.round((paid/fee)*100):0;
        return [String(i+1).padStart(2,'0'),s.full_name,s.admission_no,s.stream,fee.toLocaleString(),paid.toLocaleString(),bal.toLocaleString(),`${pct}%`,s.paymentStatus||'—'];
      }),
    });
  };

  return (
    <div className="space-y-5">
      {/* Class Selector + Search + Export Toolbar */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-100 px-5 py-4 space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-2">Select Class</p>
            <div className="flex flex-wrap gap-2">
              {classes.map(cls => (
                <button key={cls} onClick={() => setSelectedClass(cls)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all
                    ${selectedClass === cls
                      ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-700'}`}>
                  {cls}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleExport}
            className="flex items-center gap-2 bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-800 transition-colors shadow-sm shrink-0">
            <FileDown className="w-3.5 h-3.5" /> Export PDF
          </button>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by student name or admission no…"
            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="ml-2 text-sm text-gray-500">Loading class collection data...</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">
          {/* Dark Header with Stats */}
          <div className="bg-slate-900 text-white px-5 py-3.5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">{school.school_name}</p>
                <p className="text-base font-extrabold mt-0.5">
                  Fee Collection Sheet — Class {selectedClass || 'All'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-3xl font-extrabold text-blue-400 leading-none">{collectionRate}%</p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wide">Collection Rate</p>
                <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
                  <div
                    className={`h-1.5 rounded-full transition-all ${collectionRate >= 80 ? 'bg-emerald-400' : collectionRate >= 50 ? 'bg-blue-400' : 'bg-red-400'}`}
                    style={{ width: `${collectionRate}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Students',    value: students.length,                                          border: 'border-blue-400' },
                { label: 'Cleared',           value: students.filter(s => s.paymentStatus === 'Cleared').length, border: 'border-emerald-400' },
                { label: 'Total Expected',    value: fmt(totals.fee),                                          border: 'border-slate-400' },
                { label: 'Outstanding',       value: fmt(totals.balance),                                      border: 'border-orange-400' },
              ].map(s => (
                <div key={s.label} className={`bg-white/5 border-t-2 ${s.border} rounded-xl p-3`}>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider">{s.label}</p>
                  <p className="text-sm font-extrabold mt-1 text-white">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  {['No.','Student Name','Adm. No.','Stream','Total Fee','Paid','Balance','Progress','Status'].map(h => (
                    <th key={h} className={`px-4 py-3 font-bold text-gray-600 text-[11px] uppercase tracking-wide
                      ${['Total Fee','Paid','Balance'].includes(h) ? 'text-right' : h === 'Progress' || h === 'Status' ? 'text-center' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s, i) => {
                  const fee     = Number(s.fee || 0);
                  const paid    = Number(s.paid || 0);
                  const balance = Number(s.balance || 0);
                  const pct     = fee ? Math.round((paid / fee) * 100) : 0;
                  return (
                    <tr key={s.id}
                      className={`transition-colors
                        ${s.paymentStatus === 'Unpaid'
                          ? 'bg-red-50 hover:bg-red-100/60'
                          : s.paymentStatus === 'Cleared'
                          ? 'bg-emerald-50/30 hover:bg-emerald-50/70'
                          : 'bg-white hover:bg-blue-50/30'}`}>
                      <td className="px-4 py-3 text-gray-400 font-mono text-[11px]">{String(i+1).padStart(2,'0')}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{s.full_name}</td>
                      <td className="px-4 py-3 font-mono text-gray-500">{s.admission_no}</td>
                      <td className="px-4 py-3 text-gray-600">{s.stream}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{fee.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700">{paid.toLocaleString()}</td>
                      <td className={`px-4 py-3 text-right font-bold ${balance > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                        {balance.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-blue-500' : 'bg-red-400'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-gray-500 w-8 text-right font-medium">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge label={s.paymentStatus || 'No Invoice'} />
                      </td>
                    </tr>
                  );
                })}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-400 text-sm">
                      No students found for the selected class.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-800 text-white font-bold">
                  <td colSpan={4} className="px-4 py-3 text-sm uppercase tracking-wide">
                    Total ({students.length} students)
                  </td>
                  <td className="px-4 py-3 text-right">{totals.fee.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-emerald-300">{totals.paid.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-red-300">{totals.balance.toLocaleString()}</td>
                  <td colSpan={2} className="px-4 py-3 text-center text-blue-300">{collectionRate}% collected</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Signature Footer */}
          <div className="border-t-2 border-gray-200 p-5 grid grid-cols-3 gap-8">
            {['Bursar','Class Teacher','Principal'].map(r => (
              <div key={r}>
                <div className="border-b-2 border-gray-300 mb-1" style={{ minHeight: '36px' }} />
                <p className="text-[10px] text-gray-500">{r}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
