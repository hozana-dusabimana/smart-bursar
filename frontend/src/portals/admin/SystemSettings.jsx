import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Save, School, DollarSign, BookOpen, User, Key, Phone, Mail, Plus, Edit2, Trash2, X, Receipt } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { fmt } from '../../utils/format';

export default function SystemSettings() {
  const { user: authUser } = useAuth();
  const isAdmin = authUser?.role === 'admin';
  const isAccountant = authUser?.role === 'accountant' || isAdmin;

  const [tab, setTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState({ name: '', email: '', tel: '', password: '' });
  const [feeEdits, setFeeEdits] = useState({});
  const [cfgEdits, setCfgEdits] = useState({});
  const [terms, setTerms] = useState([]);

  const [editingTerm, setEditingTerm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [settingsRes, profileRes] = await Promise.allSettled([
        isAdmin ? api.get('/settings') : Promise.resolve({ data: {} }),
        api.get('/users/profile')
      ]);

      if (profileRes.status === 'fulfilled') {
        setProfile({ ...profileRes.value.data, password: '' });
      }

      if (isAdmin && settingsRes.status === 'fulfilled') {
        const sData = settingsRes.value.data;
        setData(sData);
        setTerms(sData.terms || []);
        const fe = {};
        (sData.feeStructure || []).forEach(f => {
          fe[f.class] = { tuition: f.tuition, activity: f.activity, transport: f.transport };
        });
        setFeeEdits(fe);
        setCfgEdits(sData.config || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put('/users/profile', profile);
      flash('Profile updated ✓');
    } catch (e) {
      flash(`Error: ${e.response?.data?.message || e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const saveCfg = async () => {
    setSaving(true);
    try {
      await api.put('/settings/config', { settings: cfgEdits });
      flash('School settings saved ✓');
    } catch (e) {
      flash(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTermSave = async () => {
    setSaving(true);
    try {
      if (editingTerm.id) {
        await api.put(`/settings/terms/${editingTerm.id}`, editingTerm);
      } else {
        await api.post('/settings/terms', editingTerm);
      }
      setEditingTerm(null);
      const r = await api.get('/settings');
      setTerms(r.data?.terms || []);
      flash('Term saved ✓');
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to save term');
    } finally {
      setSaving(false);
    }
  };

  const handleTermDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this term?')) return;
    try {
      await api.delete(`/settings/terms/${id}`);
      setTerms(p => p.filter(t => t.id !== id));
      flash('Term deleted ✓');
    } catch (e) {
      alert('Failed to delete term');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 text-orange-500 animate-spin" /></div>;

  const TABS = [
    { id: 'profile', label: 'My Profile', icon: User },
    ...(isAdmin ? [
      { id: 'settings', label: 'School Info', icon: School },
      { id: 'terms', label: 'Academic Terms', icon: BookOpen }
    ] : []),
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Account Settings</h1>
          <p className="text-sm text-slate-500">Manage your profile and school configuration</p>
        </div>
        {msg && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <p className="text-xs text-emerald-700 font-bold">{msg}</p>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5 flex gap-1 w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all
              ${tab === t.id ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6">
        {/* Profile Section */}
        {tab === 'profile' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
                <p className="text-xs text-slate-500 mt-1">Update your account details and security</p>
              </div>
              <button onClick={saveProfile} disabled={saving} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-800 transition-all flex items-center gap-2">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Changes
              </button>
            </div>
            <div className="p-8 grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={profile.tel || ''} onChange={e => setProfile({ ...profile, tel: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">New Password (Optional)</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="password" value={profile.password} onChange={e => setProfile({ ...profile, password: e.target.value })} placeholder="Leave blank to keep current"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium placeholder:text-slate-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* School Config Section */}
        {tab === 'settings' && isAdmin && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">School Configuration</h3>
                <p className="text-xs text-slate-500 mt-1">General information about your institution</p>
              </div>
              <button onClick={saveCfg} disabled={saving} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-800 transition-all flex items-center gap-2">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Info
              </button>
            </div>
            <div className="p-8 grid md:grid-cols-2 gap-6">
              {Object.entries(cfgEdits).length > 0 ? Object.entries(cfgEdits).map(([k, v]) => (
                <div key={k}>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">{k.replace(/_/g, ' ')}</label>
                  <input type="text" value={v || ''} onChange={e => setCfgEdits({ ...cfgEdits, [k]: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium" />
                </div>
              )) : <p className="col-span-2 text-center text-slate-400 py-8">No configuration keys found.</p>}
            </div>
          </div>
        )}

        {/* Academic Terms Section */}
        {tab === 'terms' && isAdmin && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Academic Calendar</h3>
                <p className="text-xs text-slate-500 mt-1">Manage school terms and academic years</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditingTerm({ term_name: '', academic_year: '', start_date: '', end_date: '', is_active: false })}
                  className="bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-orange-700 transition-all flex items-center gap-2 shadow-lg shadow-orange-200">
                  <Plus className="w-3.5 h-3.5" /> New Term
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50/50">
                    {['Term', 'Year', 'Start', 'End', 'Status', 'Actions'].map(h => <th key={h} className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-widest text-[10px]">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {terms.map(t => (
                    <tr key={t.id} className={`${t.is_active ? 'bg-orange-50/30' : ''} hover:bg-slate-50/50 transition-colors`}>
                      <td className="px-6 py-4 font-bold text-slate-900">{t.term_name}</td>
                      <td className="px-6 py-4 text-slate-600">{t.academic_year}</td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{String(t.start_date || '').slice(0, 10)}</td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{String(t.end_date || '').slice(0, 10)}</td>
                      <td className="px-6 py-4">
                        {t.is_active ? <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full"><CheckCircle2 className="w-3 h-3" /> Active</span>
                          : <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Inactive</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditingTerm({ ...t, start_date: t.start_date?.slice(0, 10), end_date: t.end_date?.slice(0, 10) })} className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {!t.is_active && (
                            <button onClick={() => handleTermDelete(t.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {terms.length === 0 && <p className="text-center text-slate-400 py-12 italic">No terms configured.</p>}
            </div>
          </div>
        )}
      </div>

      {/* Editing Modal for Terms */}
      {editingTerm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{editingTerm.id ? 'Edit Academic Term' : 'Create New Term'}</h3>
                <p className="text-xs text-slate-500 mt-1">Set period and active status</p>
              </div>
              <button onClick={() => setEditingTerm(null)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Term Name</label>
                <input type="text" value={editingTerm.term_name} onChange={e => setEditingTerm({ ...editingTerm, term_name: e.target.value })}
                  placeholder="e.g. Term 1" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Academic Year</label>
                <input type="text" value={editingTerm.academic_year} onChange={e => setEditingTerm({ ...editingTerm, academic_year: e.target.value })}
                  placeholder="e.g. 2024/2025" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Start Date</label>
                  <input type="date" value={editingTerm.start_date || ''} onChange={e => setEditingTerm({ ...editingTerm, start_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">End Date</label>
                  <input type="date" value={editingTerm.end_date || ''} onChange={e => setEditingTerm({ ...editingTerm, end_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium" />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <input type="checkbox" checked={editingTerm.is_active} onChange={e => setEditingTerm({ ...editingTerm, is_active: e.target.checked })}
                  className="w-5 h-5 rounded-lg border-slate-300 text-orange-600 focus:ring-orange-500" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Set as Active Term</span>
              </label>
            </div>
            <div className="p-8 bg-slate-100/50 flex gap-3">
              <button onClick={() => setEditingTerm(null)} className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-all text-xs">
                Cancel
              </button>
              <button onClick={handleTermSave} disabled={saving || !editingTerm.term_name || !editingTerm.academic_year}
                className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 disabled:opacity-50 transition-all text-xs shadow-lg shadow-slate-200 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingTerm.id ? 'Update Term' : 'Create Term'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
