import { useState, useEffect } from 'react';
import {
    Receipt, DollarSign, Search, Filter, Plus,
    ArrowRight, Loader2, AlertCircle, CheckCircle2,
    Clock, Calendar, Users, Edit2, Save, X,
    Mail, Printer
} from 'lucide-react';
import api from '../../api/client';
import { fmt } from '../../utils/format';
import Badge from '../../components/Badge';
import { exportInvoicePDF } from '../../utils/exportInvoice';

export default function InvoiceManagement() {
    const [invoices, setInvoices] = useState([]);
    const [feeStructure, setFeeStructure] = useState([]);
    const [terms, setTerms] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);
    const [msg, setMsg] = useState('');
    const [schoolInfo, setSchoolInfo] = useState({});

    // Filters
    const [filters, setFilters] = useState({ term_id: '', class_id: '', status: '' });
    const [feeEdits, setFeeEdits] = useState({});

    const loadData = async () => {
        setLoading(true);
        try {
            const [invRes, settingsRes] = await Promise.all([
                api.get('/invoices', { params: filters }),
                api.get('/settings')
            ]);
            setInvoices(invRes.data);
            setFeeStructure(settingsRes.data.feeStructure || []);
            const trms = settingsRes.data.terms || [];
            setTerms(trms);
            setClasses(settingsRes.data.classes || []);
            setSchoolInfo(settingsRes.data.config || {});

            // Default to active term if no term filter is set and we just loaded trms
            if (!filters.term_id && trms.length > 0) {
                const active = trms.find(t => t.is_active);
                if (active) setFilters(prev => ({ ...prev, term_id: active.id }));
            }

            const fe = {};
            (settingsRes.data.feeStructure || []).forEach(f => {
                fe[f.class] = { tuition: f.tuition, activity: f.activity, transport: f.transport };
            });
            setFeeEdits(fe);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [filters]);

    const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

    const saveFee = async (cls) => {
        setSaving(cls);
        try {
            await api.put('/settings/fees', { class: cls, ...feeEdits[cls] });
            flash(`Fee for ${cls} updated ✓`);
            loadData();
        } catch (e) {
            alert(e.message);
        } finally {
            setSaving(null);
        }
    };

    const bulkGenerate = async () => {
        if (!window.confirm('Generate missing invoices for all active students?')) return;
        setSaving('bulk');
        try {
            const res = await api.post('/invoices/generate-all');
            flash(res.message || 'Bulk generation complete');
            loadData();
        } catch (e) {
            alert(e.response?.data?.message || e.message);
        } finally {
            setSaving(null);
        }
    };

    const handleEmail = async (inv) => {
        setSaving(`mail-${inv.id}`);
        try {
            await api.post(`/invoices/${inv.id}/send-email`);
            flash(`Invoice sent to ${inv.full_name}'s parent ✓`);
        } catch (e) {
            alert(e.response?.data?.message || e.message);
        } finally {
            setSaving(null);
        }
    };

    const handlePrint = (inv) => {
        exportInvoicePDF({ invoice: inv, schoolInfo });
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Financial Management</h1>
                    <p className="text-sm text-slate-500">Manage termly fee structures and track student invoices</p>
                </div>
                {msg && (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2 animate-in fade-in slide-in-from-top-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <p className="text-xs text-emerald-700 font-bold">{msg}</p>
                    </div>
                )}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">

                {/* left: Fee Structure */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Fee Structure</h3>
                                <p className="text-[10px] text-slate-400 mt-0.5">Termly fees per class</p>
                            </div>
                            <button onClick={bulkGenerate} disabled={saving === 'bulk'}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-500/20">
                                {saving === 'bulk' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Receipt className="w-3 h-3" />}
                                Bulk Invoice
                            </button>
                        </div>
                        <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                            {feeStructure.map((f) => {
                                const e = feeEdits[f.class] || f;
                                const total = Number(e.tuition || 0) + Number(e.activity || 0) + Number(e.transport || 0);
                                const isSaving = saving === f.class;
                                return (
                                    <div key={f.class} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 hover:shadow-md transition-all group">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-sm font-bold text-slate-900">{f.class}</p>
                                            <p className="text-sm font-bold text-orange-600 tracking-tight">{fmt(total)}</p>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 mb-3">
                                            {['tuition', 'activity', 'transport'].map(field => (
                                                <div key={field}>
                                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 ml-0.5">{field}</label>
                                                    <input type="number"
                                                        value={e[field] === 0 ? '' : e[field]}
                                                        onChange={ev => {
                                                            const val = ev.target.value === '' ? '' : Number(ev.target.value);
                                                            setFeeEdits(prev => ({ ...prev, [f.class]: { ...e, [field]: val } }));
                                                        }}
                                                        className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-orange-500/30 outline-none" />
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={() => saveFee(f.class)} disabled={isSaving}
                                            className="w-full bg-slate-900 text-white text-[10px] font-bold py-2 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                                            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save Changes
                                        </button>
                                    </div>
                                );
                            })}
                            {feeStructure.length === 0 && (
                                <div className="text-center py-10">
                                    <AlertCircle className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-xs text-slate-400">No fee structures setup yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Invoices */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Controls */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Academic Term</label>
                            <select value={filters.term_id} onChange={e => setFilters({ ...filters, term_id: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-orange-500 outline-none">
                                <option value="">All Terms</option>
                                {terms.map(t => <option key={t.id} value={t.id}>{t.term_name} - {t.academic_year}</option>)}
                            </select>
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Class</label>
                            <select value={filters.class_id} onChange={e => setFilters({ ...filters, class_id: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-orange-500 outline-none">
                                <option value="">All Classes</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Status</label>
                            <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-orange-500 outline-none">
                                <option value="">All Status</option>
                                <option value="Paid">Paid</option>
                                <option value="Partial">Partial</option>
                                <option value="Unpaid">Unpaid</option>
                            </select>
                        </div>
                        <button onClick={() => setFilters({ term_id: '', class_id: '', status: '' })} className="p-2.5 bg-slate-50 text-slate-500 hover:text-slate-900 rounded-xl transition-all border border-slate-200">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Invoices List */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-900 border-b border-slate-800">
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoice</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Class</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Fee</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Balance</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {invoices.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-slate-50/80 transition-all group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[12px] font-bold text-slate-900">{inv.invoice_no}</span>
                                                    <span className="text-[10px] text-slate-400">{String(inv.issued_date || '').slice(0, 10)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[12px] font-bold text-slate-900">{inv.full_name}</span>
                                                    <span className="text-[10px] text-slate-400">{inv.admission_no}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[11px] font-semibold text-slate-600">{inv.class_name}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-[12px] font-bold text-slate-900">{fmt(inv.total_amount)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`text-[12px] font-bold ${inv.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{fmt(inv.balance)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge label={inv.status} />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleEmail(inv)} disabled={saving === `mail-${inv.id}`}
                                                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all" title="Email Parent">
                                                        {saving === `mail-${inv.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                                                    </button>
                                                    <button onClick={() => handlePrint(inv)}
                                                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-emerald-600 transition-all" title="Print Invoice">
                                                        <Printer className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {loading && (
                                <div className="flex items-center justify-center py-20 bg-white">
                                    <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                                </div>
                            )}
                            {!loading && invoices.length === 0 && (
                                <div className="text-center py-20 bg-white">
                                    <Receipt className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-sm text-slate-400 font-medium">No invoices found for this criteria.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
