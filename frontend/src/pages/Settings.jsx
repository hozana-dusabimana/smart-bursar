import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../api/client';
import { fmt } from '../utils/format';

export default function Settings() {
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState('');
  const [msg,      setMsg]      = useState('');
  const [msgType,  setMsgType]  = useState('success'); // 'success' | 'error'
  const [feeEdits, setFeeEdits] = useState({});

  useEffect(() => {
    api.get('/settings')
      .then(r => {
        setData(r.data);
        // Initialize fee edits
        const edits = {};
        (r.data?.feeStructure || []).forEach(f => {
          edits[f.class] = { tuition: f.tuition, activity: f.activity, transport: f.transport };
        });
        setFeeEdits(edits);
      })
      .finally(() => setLoading(false));
  }, []);

  const saveFee = async (cls) => {
    setSaving(cls); setMsg('');
    try {
      await api.put('/settings/fees', { class: cls, ...feeEdits[cls] });
      setMsgType('success');
      setMsg(`Fee structure for ${cls} saved successfully.`);
      setTimeout(() => setMsg(''), 4000);
    } catch (e) {
      setMsgType('error');
      setMsg(`Error: ${e.message}`);
    } finally {
      setSaving('');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
      <span className="ml-2 text-sm text-gray-500">Loading settings...</span>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Status Message */}
      {msg && (
        <div className={`flex items-center gap-3 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]
          ${msgType === 'success'
            ? 'bg-emerald-50 border border-emerald-200'
            : 'bg-red-50 border border-red-200'}`}>
          {msgType === 'success'
            ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            : <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
          <p className={`text-xs font-medium ${msgType === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
            {msg}
          </p>
        </div>
      )}

      {/* School Information */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest">School Information</p>
          <p className="text-[10px] text-slate-400">Update your school details below</p>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {Object.entries(data?.config || {})
              .filter(([k]) => !['receipt_prefix', 'invoice_prefix', 'expense_prefix'].includes(k))
              .map(([k, v]) => (
                <div key={k}>
                  <label className="block font-semibold text-gray-700 mb-1.5 capitalize">
                    {k.replace(/_/g, ' ')}
                  </label>
                  <input
                    type="text"
                    defaultValue={v}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs transition-all" />
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Fee Structure */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest">Fee Structure Per Class</p>
          <p className="text-[10px] text-slate-400">All amounts in RWF</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                {['Class', 'Tuition', 'Activity', 'Transport', 'Total', 'Action'].map(h => (
                  <th key={h} className={`px-4 py-3 font-bold text-gray-600 text-[11px] uppercase tracking-wide
                    ${h === 'Total' || h === 'Action' ? 'text-right' : h === 'Class' ? 'text-left' : 'text-right'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data?.feeStructure || []).map((f, i) => {
                const edit  = feeEdits[f.class] || f;
                const total = Number(edit.tuition || 0) + Number(edit.activity || 0) + Number(edit.transport || 0);
                return (
                  <tr key={f.class} className={`transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/20`}>
                    <td className="px-4 py-3 font-bold text-gray-900">{f.class}</td>
                    {['tuition', 'activity', 'transport'].map(field => (
                      <td key={field} className="px-4 py-3 text-right">
                        <input
                          type="number"
                          value={edit[field] || 0}
                          onChange={e => setFeeEdits(prev => ({
                            ...prev,
                            [f.class]: { ...prev[f.class], [field]: Number(e.target.value) }
                          }))}
                          className="w-28 text-right border border-gray-200 rounded-xl px-2.5 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs transition-all" />
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right font-extrabold text-blue-700">{total.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => saveFee(f.class)}
                        disabled={saving === f.class}
                        className="bg-blue-700 text-white text-[10px] font-bold px-4 py-2 rounded-xl hover:bg-blue-800 disabled:opacity-60 flex items-center gap-1.5 ml-auto transition-colors shadow-sm">
                        {saving === f.class && <Loader2 className="w-3 h-3 animate-spin" />}
                        Save
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt & Invoice Numbering */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest">Receipt & Invoice Numbering</p>
          <p className="text-[10px] text-slate-400">Prefix codes for generated documents</p>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {['receipt_prefix', 'invoice_prefix', 'expense_prefix'].map(k => (
              <div key={k}>
                <label className="block font-semibold text-gray-700 mb-1.5 capitalize">
                  {k.replace(/_/g, ' ')}
                </label>
                <input
                  type="text"
                  defaultValue={data?.config?.[k] || ''}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs transition-all" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Academic Terms */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest">Academic Terms</p>
          <p className="text-[10px] text-slate-400">{(data?.terms || []).length} terms configured</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                {['Term', 'Year', 'Start', 'End', 'Active'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-bold text-gray-600 text-[11px] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data?.terms || []).map(t => (
                <tr key={t.id} className={`transition-colors ${t.is_active ? 'bg-blue-50 hover:bg-blue-100/60' : 'bg-white hover:bg-gray-50/60'}`}>
                  <td className="px-4 py-3 font-semibold text-gray-900">{t.term_name}</td>
                  <td className="px-4 py-3 text-gray-600">{t.academic_year}</td>
                  <td className="px-4 py-3 text-gray-500">{String(t.start_date || '').slice(0, 10)}</td>
                  <td className="px-4 py-3 text-gray-500">{String(t.end_date || '').slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    {t.is_active && (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        Active
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {(data?.terms || []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">
                    No academic terms configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
