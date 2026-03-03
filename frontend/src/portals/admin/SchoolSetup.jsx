import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Loader2, CheckCircle2, ChevronRight, ChevronLeft,
    School, Calendar, Layout, DollarSign, Save, Plus, Trash2, Image, Upload
} from 'lucide-react';
import api from '../../api/client';

const STEPS = [
    { id: 'info', label: 'School Identity', icon: School },
    { id: 'term', label: 'Academic Calendar', icon: Calendar },
    { id: 'classes', label: 'School Structure', icon: Layout },
    { id: 'fees', label: 'Fee Configuration', icon: DollarSign }
];

const SCHOOL_TYPES = ['Nursery', 'Primary', 'Secondary', 'TVET', 'Mixed', 'Higher Learning'];

export default function SchoolSetup() {
    const navigate = useNavigate();
    const [stepIndex, setStepIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    const [form, setForm] = useState({
        info: { school_name: '', address: '', tel: '', email: '', school_type: 'Primary', school_logo: '' },
        terms: [],
        classes: [],
        fees: {}
    });

    const [newClass, setNewClass] = useState('');
    const [newTerm, setNewTerm] = useState({
        term_name: '',
        academic_year: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
        start_date: '',
        end_date: '',
        is_active: false
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [setupRes, settingsRes] = await Promise.all([
                    api.get('/settings/setup-status'),
                    api.get('/settings')
                ]);

                const { steps } = setupRes.data;
                const { config, terms, classes, feeStructure } = settingsRes.data;

                // Determine initial step
                if (!steps.config) setStepIndex(0);
                else if (!steps.terms) setStepIndex(1);
                else if (!steps.classes) setStepIndex(2);
                else if (!steps.fees) setStepIndex(3);
                else setStepIndex(0); // Fallback

                const fe = {};
                (feeStructure || []).forEach(f => {
                    fe[f.class] = { tuition: f.tuition, activity: f.activity, transport: f.transport };
                });

                setForm({
                    info: {
                        school_name: config.school_name || '',
                        address: config.address || '',
                        tel: config.tel || '',
                        email: config.email || '',
                        school_type: config.school_type || 'Primary',
                        school_logo: config.school_logo || ''
                    },
                    terms: terms || [],
                    classes: classes || [],
                    fees: fe
                });
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const prev = () => setStepIndex(prev => Math.max(prev - 1, 0));

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('logo', file);
        setSaving(true);
        try {
            const r = await api.post('/settings/upload-logo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setForm(p => ({ ...p, info: { ...p.info, school_logo: r.data.logoUrl } }));
        } catch (e) {
            alert('Logo upload failed');
        } finally {
            setSaving(false);
        }
    };

    const syncStepData = async () => {
        setSaving(true);
        try {
            if (stepIndex === 0) {
                await api.put('/settings/config', { settings: form.info });
            }
            // Other steps sync as they happen (addClass, addTerm, remove etc)
            // Fees are synced on finish or we could sync them here too if needed
            setMsg('Progress saved...');
            setTimeout(() => setMsg(''), 2000);
        } catch (e) {
            console.error('Sync failed', e);
        } finally {
            setSaving(false);
        }
    };

    const next = async () => {
        await syncStepData();
        setStepIndex(prev => Math.min(prev + 1, STEPS.length - 1));
    };

    const addClass = async () => {
        if (!newClass) return;
        setSaving(true);
        try {
            const r = await api.post('/settings/classes', { name: newClass });
            setForm(p => ({ ...p, classes: [...p.classes, { id: r.data.id, name: newClass }] }));
            setNewClass('');
            setMsg('Class saved...');
            setTimeout(() => setMsg(''), 2000);
        } catch (e) { alert(e.response?.data?.message || 'Error adding class'); }
        finally { setSaving(false); }
    };

    const removeClass = async (id) => {
        try {
            await api.delete(`/settings/classes/${id}`);
            setForm(p => ({ ...p, classes: p.classes.filter(c => c.id !== id) }));
            setMsg('Class removed...');
            setTimeout(() => setMsg(''), 2000);
        } catch (e) { alert('Error deleting class'); }
    };

    const addTerm = async () => {
        if (!newTerm.term_name || !newTerm.academic_year) return;
        setSaving(true);
        try {
            const r = await api.post('/settings/terms', newTerm);
            setForm(p => ({ ...p, terms: [...p.terms, { ...newTerm, id: r.data.id }] }));
            setNewTerm({
                term_name: '',
                academic_year: newTerm.academic_year,
                start_date: '',
                end_date: '',
                is_active: false
            });
            setMsg('Term saved...');
            setTimeout(() => setMsg(''), 2000);
        } catch (e) { alert(e.response?.data?.message || 'Error adding term'); }
        finally { setSaving(false); }
    };

    const removeTerm = async (id) => {
        try {
            await api.delete(`/settings/terms/${id}`);
            setForm(p => ({ ...p, terms: p.terms.filter(t => t.id !== id) }));
            setMsg('Term removed...');
            setTimeout(() => setMsg(''), 2000);
        } catch (e) { alert('Error deleting term'); }
    };

    const finishSetup = async () => {
        setSaving(true);
        try {
            // 1. Save Info
            await api.put('/settings/config', { settings: form.info });

            // 2. Terms are already saved selectively via addTerm, but we ensure at least one exists
            if (form.terms.length === 0) {
                throw new Error('Please add at least one academic term.');
            }

            // 3. Save Fees
            for (const [cls, value] of Object.entries(form.fees)) {
                await api.put('/settings/fees', { class: cls, ...value });
            }

            navigate('/admin');
        } catch (e) {
            alert(e.response?.data?.message || 'Error saving setup');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[80vh]">
            <Loader2 className="w-8 h-8 text-orange-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium italic">Preparing your setup wizard...</p>
        </div>
    );

    const cur = STEPS[stepIndex];

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">School Onboarding</h1>
                <p className="text-gray-500 mt-2">Let's get your school configured in just a few steps.</p>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center justify-between mb-12 relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10 -translate-y-1/2" />
                {STEPS.map((s, idx) => (
                    <div key={s.id} className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2
              ${idx <= stepIndex ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-200' : 'bg-white border-gray-300 text-gray-400'}`}>
                            {idx < stepIndex ? <CheckCircle2 className="w-6 h-6" /> : <s.icon className="w-5 h-5" />}
                        </div>
                        <span className={`text-[10px] uppercase font-bold mt-2 tracking-widest ${idx <= stepIndex ? 'text-orange-600' : 'text-gray-400'}`}>
                            {s.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Card */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden min-h-[400px] flex flex-col">
                {/* Card Header */}
                <div className="bg-slate-900 px-8 py-6 flex items-center gap-4">
                    <div className="p-2.5 bg-white/10 rounded-xl">
                        <cur.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-lg">{cur.label}</h2>
                        <p className="text-slate-400 text-xs">Step {stepIndex + 1} of 4</p>
                    </div>
                </div>

                {/* Card Body */}
                <div className="p-8 flex-1">
                    {msg && <div className="mb-4 text-emerald-600 text-[10px] font-bold uppercase tracking-widest animate-pulse">{msg}</div>}

                    {stepIndex === 0 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                {/* Logo Upload */}
                                <div className="w-full md:w-1/3 flex flex-col items-center gap-4">
                                    <div className="w-32 h-32 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                                        {form.info.school_logo ? (
                                            <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${form.info.school_logo}`} alt="Logo" className="w-full h-full object-contain" />
                                        ) : (
                                            <Image className="w-10 h-10 text-slate-300" />
                                        )}
                                        <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                            <Upload className="w-6 h-6 text-white" />
                                            <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                                        </label>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">School Logo</p>
                                </div>

                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">School Name</label>
                                        <input
                                            type="text"
                                            value={form.info.school_name}
                                            onChange={e => setForm(p => ({ ...p, info: { ...p.info, school_name: e.target.value } }))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">School Type</label>
                                        <select
                                            value={form.info.school_type}
                                            onChange={e => setForm(p => ({ ...p, info: { ...p.info, school_type: e.target.value } }))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                                        >
                                            {SCHOOL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Email</label>
                                        <input
                                            type="email"
                                            value={form.info.email}
                                            onChange={e => setForm(p => ({ ...p, info: { ...p.info, email: e.target.value } }))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Phone</label>
                                        <input
                                            type="text"
                                            value={form.info.tel}
                                            onChange={e => setForm(p => ({ ...p, info: { ...p.info, tel: e.target.value } }))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Address</label>
                                        <input
                                            type="text"
                                            value={form.info.address}
                                            onChange={e => setForm(p => ({ ...p, info: { ...p.info, address: e.target.value } }))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {stepIndex === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <div className="col-span-1 md:col-span-2">
                                    <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-4">Add New Term / Period</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Term Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Term 1, Exam Period"
                                        value={newTerm.term_name}
                                        onChange={e => setNewTerm(p => ({ ...p, term_name: e.target.value }))}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Academic Year</label>
                                    <input
                                        type="text"
                                        value={newTerm.academic_year}
                                        onChange={e => setNewTerm(p => ({ ...p, academic_year: e.target.value }))}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Start Date</label>
                                    <input
                                        type="date"
                                        value={newTerm.start_date}
                                        onChange={e => setNewTerm(p => ({ ...p, start_date: e.target.value }))}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">End Date</label>
                                    <input
                                        type="date"
                                        value={newTerm.end_date}
                                        onChange={e => setNewTerm(p => ({ ...p, end_date: e.target.value }))}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                    />
                                </div>
                                <div className="col-span-1 md:col-span-2 flex items-center justify-between pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={newTerm.is_active}
                                            onChange={e => setNewTerm(p => ({ ...p, is_active: e.target.checked }))}
                                            className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                                        />
                                        <span className="text-xs font-bold text-slate-600">Set as Current Active Term</span>
                                    </label>
                                    <button
                                        onClick={addTerm}
                                        disabled={saving || !newTerm.term_name || !newTerm.academic_year}
                                        className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 disabled:opacity-50 transition-all font-bold text-xs"
                                    >
                                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                        Add to Calendar
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Configured Terms</p>
                                {form.terms.map(t => (
                                    <div key={t.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                <Calendar className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{t.term_name} <span className="text-slate-400 font-normal">({t.academic_year})</span></p>
                                                <p className="text-[10px] text-slate-500">{t.start_date?.slice(0, 10)} to {t.end_date?.slice(0, 10)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {t.is_active && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Active</span>}
                                            <button
                                                onClick={() => removeTerm(t.id)}
                                                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {form.terms.length === 0 && <p className="text-center text-slate-400 italic text-sm py-4">No terms added yet.</p>}
                            </div>
                        </div>
                    )}

                    {stepIndex === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={newClass}
                                    onChange={e => setNewClass(e.target.value)}
                                    placeholder="e.g. Nursery, P1, S1"
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                                />
                                <button
                                    onClick={addClass}
                                    disabled={saving || !newClass}
                                    className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 disabled:opacity-50 transition-all whitespace-nowrap"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    Add Class
                                </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {form.classes.map(c => (
                                    <div key={c.id} className="group relative bg-orange-50 border border-orange-100 rounded-2xl py-3 px-4 text-center font-bold text-orange-700 text-sm animate-in zoom-in-95">
                                        {c.name}
                                        <button
                                            onClick={() => removeClass(c.id)}
                                            className="absolute -top-2 -right-2 bg-white text-red-500 p-1.5 rounded-full shadow-md border border-red-50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            {form.classes.length === 0 && <p className="text-center text-slate-400 italic text-sm py-8">Add your school classes to proceed.</p>}
                        </div>
                    )}

                    {stepIndex === 3 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        {['Class', 'Tuition', 'Activity', 'Transport'].map(h => (
                                            <th key={h} className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {form.classes.map(c => {
                                        const e = form.fees[c.name] || { tuition: 0, activity: 0, transport: 0 };
                                        return (
                                            <tr key={c.id}>
                                                <td className="py-4 pr-4 font-bold text-slate-900 text-sm whitespace-nowrap">{c.name}</td>
                                                {['tuition', 'activity', 'transport'].map(f => (
                                                    <td key={f} className="py-4 px-2">
                                                        <input
                                                            type="number"
                                                            value={e[f] === 0 ? '' : e[f]}
                                                            onChange={ev => {
                                                                const val = ev.target.value === '' ? '' : Number(ev.target.value);
                                                                setForm(p => ({
                                                                    ...p,
                                                                    fees: { ...p.fees, [c.name]: { ...e, [f]: val } }
                                                                }));
                                                            }}
                                                            className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {form.classes.length === 0 && <p className="text-center text-slate-400 italic text-sm py-8">Go back and add classes first.</p>}
                        </div>
                    )}
                </div>

                {/* Card Footer */}
                <div className="bg-slate-50 px-8 py-6 flex items-center justify-between border-t border-slate-100">
                    <button
                        onClick={prev}
                        disabled={stepIndex === 0 || saving}
                        className="flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-slate-900 transition-colors disabled:opacity-0"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back
                    </button>

                    {stepIndex < STEPS.length - 1 ? (
                        <button
                            onClick={next}
                            disabled={
                                (stepIndex === 0 && (!form.info.school_name || !form.info.email)) ||
                                (stepIndex === 1 && form.terms.length === 0) ||
                                (stepIndex === 2 && form.classes.length === 0)
                            }
                            className="bg-orange-600 text-white px-8 py-3 rounded-2xl font-extrabold text-sm flex items-center gap-2 hover:bg-orange-700 shadow-lg shadow-orange-200 transition-all disabled:opacity-50"
                        >
                            Continue <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={finishSetup}
                            disabled={saving}
                            className="bg-emerald-600 text-white px-10 py-3 rounded-2xl font-extrabold text-sm flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Complete Setup
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
