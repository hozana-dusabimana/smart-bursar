import { useState, useEffect } from 'react';
import {
    CheckCircle2, XCircle, Clock, Eye,
    AlertCircle, Loader2, Search, Filter,
    FileText, Check, X
} from 'lucide-react';
import api from '../../api/client';
import { fmt } from '../../utils/format';
import Badge from '../../components/Badge';

export default function PaymentApprovals() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);
    const [viewProof, setViewProof] = useState(null);
    const [rejecting, setRejecting] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    const loadPending = async () => {
        setLoading(true);
        try {
            const res = await api.get('/payments/pending');
            setPayments(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadPending(); }, []);

    const handleApprove = async (id) => {
        if (!window.confirm('Approve this payment? This will update the student balance and generate a receipt.')) return;
        setProcessing(id);
        try {
            await api.post(`/payments/${id}/approve`);
            loadPending();
        } catch (e) {
            alert(e.response?.data?.message || e.message);
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return alert('Please provide a reason for rejection');
        setProcessing(rejecting);
        try {
            await api.post(`/payments/${rejecting}/reject`, { reason: rejectReason });
            setRejecting(null);
            setRejectReason('');
            loadPending();
        } catch (e) {
            alert(e.response?.data?.message || e.message);
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Payment Approvals</h1>
                <p className="text-sm text-slate-500">Review bank transfers and proof of payments</p>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900 border-b border-slate-800">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Method</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Proof</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {payments.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50/80 transition-all group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[12px] font-bold text-slate-900">{String(p.payment_date).slice(0, 10)}</span>
                                            <span className="text-[10px] text-slate-400">{p.payment_time}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[12px] font-bold text-slate-900">{p.full_name}</span>
                                            <span className="text-[10px] text-slate-400">{p.class_name} • {p.admission_no}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                            <span className="text-[11px] font-semibold text-slate-600">{p.payment_method}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-[12px] font-bold text-slate-900">{fmt(p.amount)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {p.proof_url ? (
                                            <button onClick={() => setViewProof(p.proof_url)}
                                                className="p-2 hover:bg-slate-100 rounded-xl text-indigo-600 transition-all">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <span className="text-[10px] text-slate-400 italic">No proof</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setRejecting(p.id)}
                                                disabled={processing === p.id}
                                                className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all">
                                                <X className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleApprove(p.id)}
                                                disabled={processing === p.id}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl transition-all shadow-lg shadow-emerald-500/20">
                                                {processing === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!loading && payments.length === 0 && (
                        <div className="text-center py-20">
                            <CheckCircle2 className="w-12 h-12 text-slate-100 mx-auto mb-3" />
                            <p className="text-sm text-slate-400 font-medium">No pending approvals found.</p>
                        </div>
                    )}
                    {loading && (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                        </div>
                    )}
                </div>
            </div>

            {/* Proof Modal */}
            {viewProof && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden relative">
                        <button onClick={() => setViewProof(null)} className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all z-10">
                            <X className="w-5 h-5" />
                        </button>
                        <div className="p-2">
                            <img src={`${api.defaults.baseURL || ''}${viewProof}`} alt="Proof of Payment" className="w-full h-auto rounded-2xl" />
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button onClick={() => setViewProof(null)} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejecting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Reject Payment</h3>
                            <p className="text-sm text-slate-500 mb-4">Please provide a reason for rejecting this payment submission.</p>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-red-500/20"
                                placeholder="Example: Proof image is blurry, or amount doesn't match..."
                            />
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                            <button onClick={() => setRejecting(null)} className="flex-1 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all">Cancel</button>
                            <button onClick={handleReject} className="flex-1 py-2 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all">
                                {processing === rejecting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
