import { useEffect, useState } from 'react';
import { Plus, Power, Edit2, Users, Loader2, X, AlertCircle, CheckCircle2, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { saFetch } from './SuperAuthContext';

const SUBS = ['trial', 'basic', 'premium'];

const SUB_BADGE = {
  premium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  basic:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  trial:   'bg-gray-700 text-gray-400 border-gray-600',
};

function AddSchoolModal({ onClose, onSaved }) {
  const [form, setForm]     = useState({ name:'', address:'', tel:'', email:'', subscription:'trial', admin_name:'', admin_email:'' });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [result, setResult] = useState(null);

  const submit = async () => {
    if (!form.name || !form.admin_name || !form.admin_email) return setError('School name, admin name and admin email are required.');
    setSaving(true); setError('');
    try {
      const data = await saFetch('/superadmin/schools', {
        method: 'POST', body: JSON.stringify(form),
      });
      setResult(data);
      onSaved();
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const fields = [
    { label:'School Name *',      key:'name',        col:2, placeholder:'e.g. Groupe Scolaire ABC'  },
    { label:'Address',            key:'address',     col:2, placeholder:'e.g. KG 11 Ave, Kigali'   },
    { label:'Phone',              key:'tel',         col:1, placeholder:'+250 7XX XXX XXX'          },
    { label:'School Email',       key:'email',       col:1, placeholder:'info@school.rw'            },
    { label:'Admin Full Name *',  key:'admin_name',  col:1, placeholder:'e.g. Jean Bosco Habimana'  },
    { label:'Admin Email *',      key:'admin_email', col:1, placeholder:'admin@school.rw'           },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <p className="text-sm font-black text-white">Add New School</p>
            <p className="text-[10px] text-gray-500 mt-0.5">A welcome email is sent to the admin automatically</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white"><X className="w-5 h-5"/></button>
        </div>

        <div className="p-6 space-y-4">
          {result ? (
            <div className="text-center py-4 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-white">School created!</p>
              <div className="bg-gray-800 rounded-xl p-4 text-left space-y-2 text-xs">
                <p className="text-gray-400">Admin temporary password:</p>
                <p className="font-mono text-lg font-black text-orange-400 tracking-wider">{result.tempPassword}</p>
                <p className="text-gray-600">This was also emailed to the admin.</p>
              </div>
              <button onClick={onClose} className="w-full bg-orange-600 text-white font-bold text-sm py-2.5 rounded-xl hover:bg-orange-500 mt-2">
                Done
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0"/><p className="text-xs text-red-300">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {fields.map(f => (
                  <div key={f.key} className={f.col===2 ? 'col-span-2' : ''}>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5">{f.label}</label>
                    <input type="text" value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})}
                      placeholder={f.placeholder}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600
                        focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"/>
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">Subscription</label>
                  <select value={form.subscription} onChange={e=>setForm({...form,subscription:e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 capitalize">
                    {SUBS.map(s=><option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="flex-1 bg-gray-800 text-gray-300 text-xs font-bold py-2.5 rounded-xl hover:bg-gray-700">Cancel</button>
                <button onClick={submit} disabled={saving}
                  className="flex-1 bg-orange-600 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-orange-500 disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin"/>}
                  {saving ? 'Creating…' : 'Create School'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SchoolRow({ school, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [admins,   setAdmins]   = useState([]);
  const [loadingA, setLoadingA] = useState(false);
  const [toggling, setToggling] = useState(null);

  const loadAdmins = async () => {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    setLoadingA(true);
    saFetch(`/superadmin/schools/${school.id}/admins`)
      .then(setAdmins).finally(() => setLoadingA(false));
  };

  const toggleSchool = async () => {
    setToggling('school');
    await saFetch(`/superadmin/schools/${school.id}/toggle`, { method:'PUT' }).catch(()=>{});
    onRefresh();
    setToggling(null);
  };

  const toggleUser = async (userId) => {
    setToggling(userId);
    await saFetch(`/superadmin/schools/${school.id}/users/${userId}/toggle`, { method:'PUT' }).catch(()=>{});
    const updated = await saFetch(`/superadmin/schools/${school.id}/admins`).catch(() => admins);
    setAdmins(updated);
    setToggling(null);
  };

  const roleColors = {
    admin:'bg-orange-500/10 text-orange-400', bursar:'bg-blue-500/10 text-blue-400',
    accountant:'bg-teal-500/10 text-teal-400', principal:'bg-indigo-500/10 text-indigo-400',
  };

  return (
    <>
      <tr className={`border-b border-gray-800/60 transition-colors hover:bg-gray-800/30 ${!school.is_active ? 'opacity-50' : ''}`}>
        <td className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-600/10 border border-orange-600/20 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">{school.name}</p>
              <p className="text-[10px] text-gray-600">{school.email || school.slug}</p>
            </div>
          </div>
        </td>
        <td className="px-5 py-4">
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border capitalize ${SUB_BADGE[school.subscription]}`}>
            {school.subscription}
          </span>
        </td>
        <td className="px-5 py-4 text-gray-400 text-xs">{school.user_count || 0} users</td>
        <td className="px-5 py-4 text-gray-500 text-xs">{String(school.created_at||'').slice(0,10)}</td>
        <td className="px-5 py-4">
          {school.is_active
            ? <span className="text-[10px] text-emerald-400 font-bold">● Active</span>
            : <span className="text-[10px] text-red-400 font-bold">● Disabled</span>}
        </td>
        <td className="px-5 py-4">
          <div className="flex items-center gap-2">
            <button onClick={toggleSchool} disabled={toggling==='school'}
              className={`flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all
                ${school.is_active ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}>
              {toggling==='school' ? <Loader2 className="w-3 h-3 animate-spin"/> : <Power className="w-3 h-3"/>}
              {school.is_active ? 'Disable' : 'Enable'}
            </button>
            <button onClick={loadAdmins} className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-300 px-2 py-1.5 rounded-lg hover:bg-gray-800">
              <Users className="w-3 h-3"/>
              {expanded ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded admin list */}
      {expanded && (
        <tr className="border-b border-gray-800/60">
          <td colSpan={6} className="px-5 py-0">
            <div className="bg-gray-800/40 rounded-xl my-2 overflow-hidden border border-gray-700/50">
              <div className="px-4 py-2.5 border-b border-gray-700/50">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">School Users</p>
              </div>
              {loadingA ? (
                <div className="flex items-center justify-center py-6"><Loader2 className="w-4 h-4 text-orange-500 animate-spin"/></div>
              ) : admins.length === 0 ? (
                <p className="text-xs text-gray-600 px-4 py-4">No users found.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-gray-700/50">
                    {['Name','Email','Role','Status','Action'].map(h=>(
                      <th key={h} className="px-4 py-2 text-left text-[10px] text-gray-600 font-bold uppercase tracking-wide">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-gray-700/30">
                    {admins.map(u=>(
                      <tr key={u.id} className={!u.is_active?'opacity-50':''}>
                        <td className="px-4 py-2.5 font-semibold text-white">{u.name}</td>
                        <td className="px-4 py-2.5 text-gray-500">{u.email}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleColors[u.role]||'bg-gray-700 text-gray-400'}`}>{u.role}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          {u.is_active
                            ? <span className="text-[10px] text-emerald-400">Active</span>
                            : <span className="text-[10px] text-red-400">Disabled</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          <button onClick={()=>toggleUser(u.id)} disabled={toggling===u.id}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all
                              ${u.is_active ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}>
                            {toggling===u.id ? '…' : u.is_active ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function SchoolManagement() {
  const [schools,  setSchools]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);
  const [search,   setSearch]   = useState('');
  const [subFilter,setSubFilter]= useState('All');
  const [msg,      setMsg]      = useState('');

  const load = () => {
    setLoading(true);
    saFetch('/superadmin/schools').then(setSchools).finally(()=>setLoading(false));
  };
  useEffect(()=>{ load(); },[]);

  const onSaved = () => { load(); setMsg('School created and welcome email sent ✓'); setTimeout(()=>setMsg(''),4000); };

  const filtered = schools.filter(s =>
    (subFilter==='All' || s.subscription===subFilter) &&
    (!search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.email||'').includes(search))
  );

  return (
    <div className="space-y-5">
      {msg && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0"/><p className="text-xs text-emerald-300 font-medium">{msg}</p>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search schools…"
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 w-52"/>
          <div className="flex gap-1.5">
            {['All',...SUBS].map(s=>(
              <button key={s} onClick={()=>setSubFilter(s)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all capitalize
                  ${subFilter===s?'bg-orange-600 text-white':'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <button onClick={()=>setShowAdd(true)} className="flex items-center gap-2 bg-orange-600 text-white text-xs font-bold px-5 py-2 rounded-xl hover:bg-orange-500 shadow-lg shadow-orange-900/30">
          <Plus className="w-3.5 h-3.5"/> Add School
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <p className="text-xs font-black text-white uppercase tracking-widest">Schools ({filtered.length})</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 text-orange-500 animate-spin"/></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800">
                  {['School','Subscription','Users','Added','Status','Actions'].map(h=>(
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-gray-600 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s=>(
                  <SchoolRow key={s.id} school={s} onRefresh={load}/>
                ))}
                {filtered.length===0 && (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-600 text-sm">No schools found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && <AddSchoolModal onClose={()=>setShowAdd(false)} onSaved={onSaved}/>}
    </div>
  );
}
