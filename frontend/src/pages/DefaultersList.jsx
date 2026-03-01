import { useState, useEffect } from 'react';
import { FileDown, AlertTriangle, Loader2, Search, X } from 'lucide-react';
import Badge from '../components/Badge';
import api from '../api/client';
import { fmt } from '../utils/format';
import { exportPDF } from '../utils/pdfExport';

export default function DefaultersList() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('All');
  const [search,  setSearch]  = useState('');
  const [school,  setSchool]  = useState({});

  useEffect(() => {
    api.get('/settings').then(r => setSchool(r.data?.config || {})).catch(() => {});
    api.get('/reports/defaulters')
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  const all         = data?.defaulters || [];
  const outstanding = data?.totalOutstanding || 0;
  const filtered    = all.filter(s =>
    (filter === 'All' || s.paymentStatus === filter) &&
    (!search || s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                s.class?.toLowerCase().includes(search.toLowerCase()) ||
                s.admission_no?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleExport = () => {
    exportPDF({
      title:      'Fee Defaulters Report',
      subtitle:   `Status: ${filter}  ·  ${filtered.length} students`,
      schoolName: school.school_name,
      filename:   `defaulters-${new Date().toISOString().slice(0,10)}.pdf`,
      summaryRows: [
        { label: 'Total Defaulters',  value: all.length          },
        { label: 'Total Outstanding', value: fmt(outstanding)    },
        { label: 'Fully Unpaid',      value: all.filter(s=>s.paymentStatus==='Unpaid').length  },
        { label: 'Partial Payment',   value: all.filter(s=>s.paymentStatus==='Partial').length },
      ],
      columns: ['#','Student Name','Adm. No.','Class','Guardian','Tel','Total Fee','Paid','Balance Due','Status'],
      rows: filtered.map((s, i) => [
        String(i+1).padStart(2,'0'),
        s.full_name, s.admission_no, `${s.class} ${s.stream}`,
        s.guardian_name, s.guardian_tel,
        Number(s.fee||0).toLocaleString(),
        Number(s.paid||0).toLocaleString(),
        Number(s.balance||0).toLocaleString(),
        s.paymentStatus,
      ]),
    });
  };

  const today = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' });

  return (
    <div className="space-y-5">
      {/* Red Alert Banner */}
      <div className="bg-red-50 border-l-4 border-red-500 border border-red-200 rounded-2xl p-5 flex items-start gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-red-800">
            {all.length} students have outstanding balances totalling {fmt(outstanding)}
          </p>
          <p className="text-xs text-red-500 mt-1">As of {today} — Immediate follow-up is required.</p>
        </div>
      </div>

      {/* Filter + Search + Export Toolbar */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-100 px-5 py-4 space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-medium mr-1">Filter:</span>
            {['All','Unpaid','Partial'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all
                  ${filter === f
                    ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-700'}`}>
                {f}
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold
                  ${filter === f ? 'bg-blue-600 text-blue-100' : 'bg-gray-100 text-gray-500'}`}>
                  {f === 'All' ? all.length : all.filter(s => s.paymentStatus === f).length}
                </span>
              </button>
            ))}
          </div>
          <button onClick={handleExport}
            className="flex items-center gap-2 bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-800 transition-colors shadow-sm">
            <FileDown className="w-3.5 h-3.5" /> Export PDF
          </button>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, admission no or class…"
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
          <span className="ml-2 text-sm text-gray-500">Loading defaulters list...</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">
          {/* Dark Header with Stats */}
          <div className="bg-slate-900 text-white px-5 py-3.5">
            <div className="text-center mb-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-400">{school.school_name}</p>
              <p className="text-base font-extrabold tracking-wide mt-0.5">FEE DEFAULTERS LIST</p>
              <p className="text-xs text-slate-400 mt-0.5">Printed: {today}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Defaulters',  value: all.length,                                           border: 'border-red-500',    text: 'text-red-300',    icon: '⚠' },
                { label: 'Total Outstanding', value: fmt(outstanding),                                      border: 'border-orange-500', text: 'text-orange-300', icon: '₣' },
                { label: 'Fully Unpaid',      value: all.filter(s => s.paymentStatus === 'Unpaid').length,  border: 'border-red-700',    text: 'text-red-400',    icon: '✕' },
              ].map(s => (
                <div key={s.label} className={`bg-white/5 border-t-2 ${s.border} rounded-xl p-3 text-center`}>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-1">{s.label}</p>
                  <p className={`font-extrabold text-lg leading-none ${s.text}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  {['No.','Student Name','Adm. No.','Class','Guardian','Tel','Total Fee','Paid','Balance Due','Status'].map(h => (
                    <th key={h} className={`px-4 py-3 font-bold text-gray-600 text-[11px] uppercase tracking-wide
                      ${['Total Fee','Paid','Balance Due'].includes(h) ? 'text-right' : h === 'Status' ? 'text-center' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s, i) => (
                  <tr key={s.id}
                    className={`transition-colors
                      ${s.paymentStatus === 'Unpaid' ? 'bg-red-50 hover:bg-red-100/60' : 'bg-orange-50/30 hover:bg-orange-50/70'}`}>
                    <td className="px-4 py-3 text-gray-400 font-mono text-[11px]">{String(i+1).padStart(2,'0')}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{s.full_name}</td>
                    <td className="px-4 py-3 font-mono text-gray-500">{s.admission_no}</td>
                    <td className="px-4 py-3 text-gray-700">{s.class} {s.stream}</td>
                    <td className="px-4 py-3 text-gray-600">{s.guardian_name}</td>
                    <td className="px-4 py-3 text-gray-500">{s.guardian_tel}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{Number(s.fee||0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">{Number(s.paid||0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-extrabold text-red-700">{Number(s.balance||0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center"><Badge label={s.paymentStatus} /></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-gray-400 text-sm">
                      No defaulters match the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-red-900 text-white font-bold">
                  <td colSpan={6} className="px-4 py-3 text-sm uppercase tracking-wide">
                    Total — {filtered.length} students
                  </td>
                  <td className="px-4 py-3 text-right">{filtered.reduce((s,r)=>s+Number(r.fee||0),0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-emerald-300">{filtered.reduce((s,r)=>s+Number(r.paid||0),0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-red-200">{filtered.reduce((s,r)=>s+Number(r.balance||0),0).toLocaleString()}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Signature Footer */}
          <div className="border-t-2 border-gray-200 p-5">
            <p className="text-[10px] text-gray-400 italic mb-5">
              This list is to be distributed to class teachers and the principal for follow-up.
            </p>
            <div className="grid grid-cols-3 gap-8">
              {['Bursar','Accountant','Principal'].map(r => (
                <div key={r}>
                  <div className="border-b-2 border-gray-300 mb-1" style={{ minHeight: '36px' }} />
                  <p className="text-[10px] text-gray-500">{r}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
