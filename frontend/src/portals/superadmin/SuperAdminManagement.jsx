import { useEffect, useState } from 'react';
import {
    Shield, Plus, Trash2, Power, PowerOff,
    Loader2, X, Eye, EyeOff, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import { saFetch, useSuperAuth } from './SuperAuthContext';

function Badge({ active }) {
    return active
        ? <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-2.5 h-2.5" />Active</span>
        : <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full"><PowerOff className="w-2.5 h-2.5" />Disabled</span>;
}

export default function SuperAdminManagement() {
    const { admin: self } = useSuperAuth();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [confirmDelete, setConfirmDelete] = useState(null); // admin id to delete

    function showToast(msg) {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    }

    async function load() {
        setLoading(true);
        try {
            const admins = await saFetch('/superadmin/admins');
            setAdmins(admins);
        } catch { /* token guard handles redirect */ }
        finally { setLoading(false); }
    }

    useEffect(() => { load(); }, []);

    async function handleCreate(e) {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            await saFetch('/superadmin/admins', { method: 'POST', body: JSON.stringify(form) });
            setForm({ name: '', email: '', password: '' });
            setShowModal(false);
            showToast('SuperAdmin created successfully');
            load();
        } catch (err) {
            setError(err.message || 'Failed to create admin');
        } finally { setSaving(false); }
    }

    async function handleToggle(id) {
        try {
            await saFetch(`/superadmin/admins/${id}/toggle`, { method: 'PUT' });
            showToast('Status updated');
            load();
        } catch (err) {
            showToast(err.message || 'Failed to update status');
        }
    }

    async function handleDelete(id) {
        try {
            await saFetch(`/superadmin/admins/${id}`, { method: 'DELETE' });
            setConfirmDelete(null);
            showToast('SuperAdmin deleted');
            load();
        } catch (err) {
            setConfirmDelete(null);
            showToast(err.message || 'Failed to delete');
        }
    }

    function fmt(dt) {
        if (!dt) return '—';
        return new Date(dt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-black text-white">SuperAdmin Management</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Add and manage platform-level administrators</p>
                </div>
                <button onClick={() => { setShowModal(true); setError(''); setForm({ name: '', email: '', password: '' }); }}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add SuperAdmin
                </button>
            </div>

            {/* Toast */}
            {toast && (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2.5 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {toast}
                </div>
            )}

            {/* Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                    </div>
                ) : (
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-gray-800 bg-gray-950/60">
                                <th className="text-left px-4 py-3 text-gray-500 font-semibold">Name</th>
                                <th className="text-left px-4 py-3 text-gray-500 font-semibold">Email</th>
                                <th className="text-left px-4 py-3 text-gray-500 font-semibold">Status</th>
                                <th className="text-left px-4 py-3 text-gray-500 font-semibold">Last Login</th>
                                <th className="text-left px-4 py-3 text-gray-500 font-semibold">Created</th>
                                <th className="px-4 py-3 text-gray-500 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {admins.length === 0 && (
                                <tr><td colSpan={6} className="text-center py-10 text-gray-600">No superadmins found</td></tr>
                            )}
                            {admins.map(a => (
                                <tr key={a.id} className="hover:bg-gray-800/40 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-orange-700 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                                                {a.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                            </div>
                                            <span className="font-semibold text-white">
                                                {a.name}
                                                {a.id === self?.id && <span className="ml-1.5 text-[9px] text-orange-400 font-bold">(you)</span>}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400">{a.email}</td>
                                    <td className="px-4 py-3"><Badge active={a.is_active} /></td>
                                    <td className="px-4 py-3 text-gray-500">
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 shrink-0" />{fmt(a.last_login)}</span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">{fmt(a.created_at)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            {a.id !== self?.id && (
                                                <>
                                                    <button onClick={() => handleToggle(a.id)} title={a.is_active ? 'Disable' : 'Enable'}
                                                        className={`p-1.5 rounded-lg transition-colors ${a.is_active ? 'text-gray-500 hover:text-yellow-400 hover:bg-yellow-400/10' : 'text-gray-600 hover:text-emerald-400 hover:bg-emerald-400/10'}`}>
                                                        {a.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                                                    </button>
                                                    <button onClick={() => setConfirmDelete(a)} title="Delete"
                                                        className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between p-5 border-b border-gray-800">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-orange-600/20 flex items-center justify-center">
                                    <Shield className="w-4 h-4 text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Add SuperAdmin</p>
                                    <p className="text-[10px] text-gray-500">New platform-level administrator</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-600 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-5 space-y-4">
                            {error && (
                                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded-lg">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
                                </div>
                            )}
                            <div>
                                <label className="block text-xs text-gray-400 font-semibold mb-1">Full Name</label>
                                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Platform Admin"
                                    className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 placeholder-gray-600"
                                    required />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 font-semibold mb-1">Email Address</label>
                                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                    placeholder="admin@smartbursar.rw"
                                    className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 placeholder-gray-600"
                                    required />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 font-semibold mb-1">Password</label>
                                <div className="relative">
                                    <input type={showPw ? 'text' : 'password'} value={form.password}
                                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                        placeholder="Min. 8 characters"
                                        className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 pr-9 focus:outline-none focus:border-orange-500 placeholder-gray-600"
                                        required minLength={8} />
                                    <button type="button" onClick={() => setShowPw(p => !p)}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="flex-1 text-xs font-semibold border border-gray-700 text-gray-400 hover:text-white py-2 rounded-lg transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold py-2 rounded-lg transition-colors disabled:opacity-60">
                                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {saving ? 'Creating…' : 'Create SuperAdmin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Delete Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                                <Trash2 className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">Delete SuperAdmin?</p>
                                <p className="text-xs text-gray-500 mt-0.5">This will permanently remove <span className="text-white font-semibold">{confirmDelete.name}</span>.</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setConfirmDelete(null)}
                                className="flex-1 text-xs font-semibold border border-gray-700 text-gray-400 hover:text-white py-2 rounded-lg transition-colors">
                                Cancel
                            </button>
                            <button onClick={() => handleDelete(confirmDelete.id)}
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2 rounded-lg transition-colors">
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
