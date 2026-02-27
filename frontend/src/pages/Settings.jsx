import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../api/client';
import { fmt } from '../utils/format';

export default function Settings() {
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState('');
  const [msg,      setMsg]      = useState('');
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
      setMsg(`Fee for ${cls} saved ✓`);
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
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
    <div className="max-w-3xl space-y-5">
      {msg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-xs text-emerald-700 font-medium">{msg}</p>
        </div>
      )}

      {/* School Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-900 text-white px-5 py-3">
          <p className="text-xs font-bold uppercase tracking-widest">School Information</p>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4 text-xs">
          {Object.entries(data?.config || {}).filter(([k]) => !['receipt_prefix','invoice_prefix','expense_prefix'].includes(k)).map(([k, v]) => (
            <div key={k}>
              <label className="block font-semibold text-gray-700 mb-1 capitalize">{k.replace(/_/g,' ')}</label>
              <input type="text" defaultValue={v}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs" />
            </div>
          ))}
        </div>
      </div>

      {/* Fee Structure */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-900 text-white px-5 py-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest">Fee Structure Per Class</p>
          <p className="text-[10px] text-gray-400">All amounts in RWF · Click Save to apply</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                {['Class','Tuition','Activity','Transport','Total','Action'].map(h => (
                  <th key={h} className={`px-4 py-3 font-bold text-gray-700 ${h==='Total'||h==='Action'?'text-right':h==='Class'?'text-left':'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data?.feeStructure || []).map((f, i) => {
                const edit  = feeEdits[f.class] || f;
                const total = Number(edit.tuition||0) + Number(edit.activity||0) + Number(edit.transport||0);
                return (
                  <tr key={f.class} className={i%2===0?'bg-white':'bg-gray-50/50'}>
                    <td className="px-4 py-2.5 font-bold text-gray-900">{f.class}</td>
                    {['tuition','activity','transport'].map(field => (
                      <td key={field} className="px-4 py-2.5 text-right">
                        <input type="number" value={edit[field] || 0}
                          onChange={e => setFeeEdits(prev => ({
                            ...prev,
                            [f.class]: { ...prev[f.class], [field]: Number(e.target.value) }
                          }))}
                          className="w-28 text-right border border-gray-200 rounded px-2 py-1 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs" />
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-right font-extrabold text-blue-700">{total.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => saveFee(f.class)} disabled={saving === f.class}
                        className="bg-blue-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-blue-800 disabled:opacity-60 flex items-center gap-1 ml-auto">
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

      {/* Receipt Config */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-900 text-white px-5 py-3">
          <p className="text-xs font-bold uppercase tracking-widest">Receipt & Invoice Numbering</p>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4 text-xs">
          {['receipt_prefix','invoice_prefix','expense_prefix'].map(k => (
            <div key={k}>
              <label className="block font-semibold text-gray-700 mb-1 capitalize">{k.replace(/_/g,' ')}</label>
              <input type="text" defaultValue={data?.config?.[k] || ''}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs" />
            </div>
          ))}
        </div>
      </div>

      {/* Active Term */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-900 text-white px-5 py-3">
          <p className="text-xs font-bold uppercase tracking-widest">Academic Terms</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                {['Term','Year','Start','End','Active'].map(h=>(
                  <th key={h} className="px-4 py-2.5 text-left font-bold text-gray-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data?.terms || []).map(t => (
                <tr key={t.id} className={t.is_active?'bg-blue-50':''}>
                  <td className="px-4 py-2.5 font-semibold text-gray-900">{t.term_name}</td>
                  <td className="px-4 py-2.5 text-gray-600">{t.academic_year}</td>
                  <td className="px-4 py-2.5 text-gray-500">{String(t.start_date||'').slice(0,10)}</td>
                  <td className="px-4 py-2.5 text-gray-500">{String(t.end_date||'').slice(0,10)}</td>
                  <td className="px-4 py-2.5">
                    {t.is_active && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Active</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
