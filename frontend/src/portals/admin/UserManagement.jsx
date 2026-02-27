import { useEffect, useState } from 'react';
import { Plus, UserCheck, UserX, Edit2, Loader2, X, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import api from '../../api/client';

const ROLES = ['bursar', 'accountant', 'principal', 'admin', 'parent'];
const ROLE_COLORS = {
  bursar: 'bg-blue-100 text-blue-800', accountant: 'bg-teal-100 text-teal-800',
  principal: 'bg-indigo-100 text-indigo-800', admin: 'bg-orange-100 text-orange-800', parent: 'bg-gray-100 text-gray-700'
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [acting, setActing] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'bursar' });
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/users').then(r => setUsers(r.data || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 3500); };

  const toggle = async (id) => {
    setActing(id);
    try { await api.put(`/users/${id}/toggle-active`); flash('User status updated'); load(); }
    catch (e) { flash(e.message, 'error'); }
    finally { setActing(null); }
  };

  const resetPassword = async (id, name) => {
    if (!window.confirm(`Reset password for ${name}? They will receive an email with a new random password.`)) return;
    setActing(id);
    try {
      const res = await api.put(`/users/${id}/reset-password`);
      flash(res.message || 'Password reset successfully');
    }
    catch (e) { flash(e.message, 'error'); }
    finally { setActing(null); }
  };

  const addUser = async () => {
    if (!form.name || !form.email || !form.password) { setFormErr('All fields are required.'); return; }
    setSaving(true); setFormErr('');
    try {
      await api.post('/users', form);
      setShowAdd(false); setForm({ name: '', email: '', password: '', role: 'bursar' });
      flash('User created successfully'); load();
    } catch (e) { setFormErr(e.message); }
    finally { setSaving(false); }
  };

  const changeRole = async (id, role) => {
    setActing(id);
    try { await api.put(`/users/${id}/role`, { role }); flash(`Role updated to ${role}`); load(); }
    catch (e) { flash(e.message, 'error'); }
    finally { setActing(null); }
  };

  return (
    <div className="max-w-4xl space-y-5">
      {msg.text && (
        <div className={`flex items-center gap-2 rounded-lg p-3 border ${msg.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
          {msg.type === 'error' ? <AlertCircle className="w-4 h-4 text-red-500 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
          <p className={`text-xs font-medium ${msg.type === 'error' ? 'text-red-700' : 'text-emerald-700'}`}>{msg.text}</p>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-900">User Accounts</p>
          <p className="text-xs text-gray-500">{users.length} total · {users.filter(u => u.is_active).length} active</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-orange-700">
          <Plus className="w-3.5 h-3.5" /> Add User
        </button>
      </div>

      {/* Role summary pills */}
      <div className="flex flex-wrap gap-2">
        {ROLES.map(role => {
          const count = users.filter(u => u.role === role).length;
          return (
            <div key={role} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${ROLE_COLORS[role]}`}>
              <Shield className="w-3 h-3" /> {role.charAt(0).toUpperCase() + role.slice(1)} ({count})
            </div>
          );
        })}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-900 text-white px-5 py-3"><p className="text-xs font-bold uppercase tracking-widest">All User Accounts</p></div>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-orange-500 animate-spin" /><span className="ml-2 text-sm text-gray-500">Loading...</span></div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                {['#', 'Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className={`px-4 py-3 font-bold text-gray-700 ${h === 'Actions' ? 'text-center' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u, i) => (
                <tr key={u.id} className={`${!u.is_active ? 'opacity-60 bg-gray-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  <td className="px-4 py-3 text-gray-400 font-mono">{String(i + 1).padStart(2, '0')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-[10px] font-bold text-orange-700">
                        {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="font-semibold text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <select value={u.role} onChange={e => changeRole(u.id, e.target.value)} disabled={acting === u.id}
                      className={`text-[10px] font-bold px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-400 ${ROLE_COLORS[u.role]}`}>
                      {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                      {u.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{String(u.created_at || '').slice(0, 10)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => toggle(u.id)} disabled={acting === u.id}
                        className={`flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg disabled:opacity-50 transition-all
                          ${u.is_active ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
                        {acting === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : u.is_active ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                        {u.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <button onClick={() => resetPassword(u.id, u.name)} disabled={acting === u.id}
                        className="flex items-center text-nowrap gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 disabled:opacity-50 transition-all">
                        <X className="w-3 h-3" /> Reset Pw
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div><p className="text-sm font-bold text-gray-900">Create New User</p><p className="text-[10px] text-gray-500">They will receive a login email</p></div>
              <button onClick={() => { setShowAdd(false); setFormErr(''); }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            {formErr && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4"><AlertCircle className="w-4 h-4 text-red-500 shrink-0" /><p className="text-xs text-red-700">{formErr}</p></div>}
            <div className="space-y-4">
              {[
                { label: 'Full Name', field: 'name', type: 'text', placeholder: 'e.g. Jean Bosco Nzabonimpa' },
                { label: 'Email Address', field: 'email', type: 'email', placeholder: 'user@kenza.rw' },
                { label: 'Password', field: 'password', type: 'password', placeholder: 'Minimum 8 characters' },
              ].map(f => (
                <div key={f.field}>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">{f.label}</label>
                  <input type={f.type} value={form[f.field]} onChange={e => setForm({ ...form, [f.field]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500">
                  {ROLES.filter(r => r !== 'parent').map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowAdd(false); setFormErr(''); }} className="flex-1 bg-gray-100 text-gray-700 text-xs font-bold py-2.5 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={addUser} disabled={saving} className="flex-1 bg-orange-600 text-white text-xs font-bold py-2.5 rounded-lg hover:bg-orange-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
