import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Save } from 'lucide-react';
import api from '../../api/client';
import { fmt } from '../../utils/format';

export default function SystemSettings() {
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [feeEdits, setFeeEdits] = useState({});
  const [cfgEdits, setCfgEdits] = useState({});
  const [savingFee,setSavingFee]= useState('');
  const [savingCfg,setSavingCfg]= useState(false);
  const [msg,      setMsg]      = useState('');

  const load = () => {
    setLoading(true);
    api.get('/settings').then(r=>{
      setData(r.data);
      const fe={};(r.data?.feeStructure||[]).forEach(f=>{fe[f.class]={tuition:f.tuition,activity:f.activity,transport:f.transport};});
      setFeeEdits(fe);
      setCfgEdits(r.data?.config||{});
    }).finally(()=>setLoading(false));
  };
  useEffect(()=>{ load(); },[]);

  const flash = (m) => { setMsg(m); setTimeout(()=>setMsg(''),3000); };

  const saveFee = async (cls) => {
    setSavingFee(cls);
    try { await api.put('/settings/fees',{class:cls,...feeEdits[cls]}); flash(`Fee for ${cls} saved ✓`); }
    catch(e){ flash(`Error: ${e.message}`); } finally{ setSavingFee(''); }
  };

  const saveCfg = async () => {
    setSavingCfg(true);
    try { await api.put('/settings/config',{settings:cfgEdits}); flash('School settings saved ✓'); }
    catch(e){ flash(`Error: ${e.message}`); } finally{ setSavingCfg(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 text-orange-500 animate-spin"/></div>;

  return (
    <div className="max-w-4xl space-y-6">
      {msg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0"/><p className="text-xs text-emerald-700 font-medium">{msg}</p>
        </div>
      )}

      {/* School Config */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-900 text-white px-5 py-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest">School Information</p>
          <button onClick={saveCfg} disabled={savingCfg} className="flex items-center gap-1.5 bg-orange-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-orange-700 disabled:opacity-60">
            {savingCfg?<Loader2 className="w-3 h-3 animate-spin"/>:<Save className="w-3 h-3"/>} Save All
          </button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          {Object.entries(cfgEdits).map(([k,v])=>(
            <div key={k}>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 capitalize">{k.replace(/_/g,' ')}</label>
              <input type="text" value={v||''} onChange={e=>setCfgEdits({...cfgEdits,[k]:e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"/>
            </div>
          ))}
        </div>
      </div>

      {/* Fee Structure */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-900 text-white px-5 py-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest">Fee Structure Per Class (RWF)</p>
          <p className="text-[10px] text-gray-400">Edit and click Save per row</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                {['Class','Tuition','Activity','Transport','Total',''].map(h=>(
                  <th key={h} className={`px-4 py-3 font-bold text-gray-700 ${['Tuition','Activity','Transport','Total'].includes(h)?'text-right':'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data?.feeStructure||[]).map((f,i)=>{
                const e=feeEdits[f.class]||f;
                const total=Number(e.tuition||0)+Number(e.activity||0)+Number(e.transport||0);
                return (
                  <tr key={f.class} className={i%2===0?'bg-white':'bg-gray-50/30'}>
                    <td className="px-4 py-2.5 font-extrabold text-gray-900">{f.class}</td>
                    {['tuition','activity','transport'].map(field=>(
                      <td key={field} className="px-4 py-2.5 text-right">
                        <input type="number" value={e[field]||0}
                          onChange={ev=>setFeeEdits(prev=>({...prev,[f.class]:{...prev[f.class],[field]:Number(ev.target.value)}}))}
                          className="w-28 text-right border border-gray-200 rounded px-2 py-1 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-orange-500 text-xs"/>
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-right font-extrabold text-orange-700">{total.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={()=>saveFee(f.class)} disabled={savingFee===f.class}
                        className="bg-orange-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-orange-700 disabled:opacity-60 flex items-center gap-1 ml-auto">
                        {savingFee===f.class?<Loader2 className="w-3 h-3 animate-spin"/>:<Save className="w-3 h-3"/>} Save
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Academic Terms */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-900 text-white px-5 py-3"><p className="text-xs font-bold uppercase tracking-widest">Academic Terms</p></div>
        <table className="w-full text-xs">
          <thead><tr className="bg-gray-100 border-b border-gray-200">{['Term','Year','Start','End','Status'].map(h=><th key={h} className="px-4 py-2.5 text-left font-bold text-gray-700">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {(data?.terms||[]).map(t=>(
              <tr key={t.id} className={t.is_active?'bg-orange-50':''}>
                <td className="px-4 py-2.5 font-semibold text-gray-900">{t.term_name}</td>
                <td className="px-4 py-2.5 text-gray-600">{t.academic_year}</td>
                <td className="px-4 py-2.5 text-gray-500">{String(t.start_date||'').slice(0,10)}</td>
                <td className="px-4 py-2.5 text-gray-500">{String(t.end_date||'').slice(0,10)}</td>
                <td className="px-4 py-2.5">
                  {t.is_active?<span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">● Active</span>
                  :<span className="text-[10px] text-gray-400">Inactive</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
