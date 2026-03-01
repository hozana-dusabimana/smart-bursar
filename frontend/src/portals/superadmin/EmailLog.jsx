import { useEffect, useState } from 'react';
import { Loader2, Mail, CheckCircle2, XCircle, Clock, RefreshCw, Send, AlertCircle } from 'lucide-react';
import { saFetch } from './SuperAuthContext';

const STATUS_STYLE = {
  sent: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};
const STATUS_ICON = {
  sent: CheckCircle2,
  failed: XCircle,
  pending: Clock,
};
const TEMPLATE_LABELS = {
  receipt: '📄 Receipt',
  welcome: '👋 Welcome',
  passwordReset: '🔑 Password Reset',
  lowBalance: '⚠️ Low Balance',
  newSchool: '🏫 New School',
  superadminInvite: '🛡️ SuperAdmin Invite',
};

// Templates that cannot be resent (need special flows)
const NO_RESEND = ['passwordReset', 'lowBalance'];

export default function EmailLog() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('All');
  const [refresh, setRefresh] = useState(0);
  const [resending, setResending] = useState(null); // id being resent
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  useEffect(() => {
    setLoading(true);
    const q = status !== 'All' ? `?status=${status}` : '';
    saFetch(`/superadmin/email-log${q}`)
      .then(setEmails).finally(() => setLoading(false));
  }, [status, refresh]);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 4000);
  }

  async function handleResend(id) {
    setResending(id);
    try {
      await saFetch(`/superadmin/email-log/${id}/resend`, { method: 'POST' });
      showToast('Email resent successfully ✓');
      setRefresh(r => r + 1);
    } catch (err) {
      showToast(err.message || 'Failed to resend email', 'error');
    } finally {
      setResending(null);
    }
  }

  const counts = emails.reduce((acc, e) => { acc[e.status] = (acc[e.status] || 0) + 1; return acc; }, {});

  return (
    <div className="space-y-5">

      {/* Toast */}
      {toast.msg && (
        <div className={`flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-lg border
          ${toast.type === 'error'
            ? 'bg-red-500/10 border-red-500/20 text-red-400'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
          {toast.type === 'error'
            ? <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Header stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Sent', count: counts.sent || 0, status: 'sent' },
          { label: 'Failed', count: counts.failed || 0, status: 'failed' },
          { label: 'Pending', count: counts.pending || 0, status: 'pending' },
        ].map(s => {
          const Icon = STATUS_ICON[s.status];
          return (
            <div key={s.label} className={`bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-gray-600 ${STATUS_STYLE[s.status]}`}
              onClick={() => setStatus(status === s.status ? 'All' : s.status)}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{s.label}</p>
                <Icon className="w-3.5 h-3.5 opacity-60" />
              </div>
              <p className="text-2xl font-black">{s.count}</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <p className="text-xs font-black text-white uppercase tracking-widest">
            <Mail className="w-3.5 h-3.5 inline mr-2 text-gray-500" />
            Email Notifications Log
          </p>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {['All', 'sent', 'failed', 'pending'].map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg capitalize transition-all
                    ${status === s ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}>{s}</button>
              ))}
            </div>
            <button onClick={() => setRefresh(r => r + 1)} className="p-1.5 text-gray-600 hover:text-gray-300 transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800">
                  {['#', 'Recipient', 'Template', 'School', 'Status', 'Sent At', 'Error', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-600 uppercase tracking-wider last:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {emails.map((e, i) => {
                  const Icon = STATUS_ICON[e.status] || Clock;
                  const canResend = !NO_RESEND.includes(e.template);
                  const isSending = resending === e.id;
                  return (
                    <tr key={e.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 text-gray-600 font-mono">{String(i + 1).padStart(3, '0')}</td>
                      <td className="px-4 py-3 text-gray-300">{e.recipient}</td>
                      <td className="px-4 py-3">
                        <span className="text-gray-400">{TEMPLATE_LABELS[e.template] || e.template}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{e.school_name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit capitalize ${STATUS_STYLE[e.status]}`}>
                          <Icon className="w-3 h-3" /> {e.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{e.sent_at ? String(e.sent_at).slice(0, 16) : '—'}</td>
                      <td className="px-4 py-3 text-red-500 text-[10px] max-w-[140px] truncate" title={e.error_msg}>{e.error_msg || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        {canResend && (
                          <button
                            onClick={() => handleResend(e.id)}
                            disabled={isSending}
                            title="Resend this email"
                            className="flex items-center gap-1 ml-auto text-[10px] font-bold px-2.5 py-1.5 rounded-lg
                              bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20
                              transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSending
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Send className="w-3 h-3" />}
                            {isSending ? 'Sending…' : 'Resend'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {emails.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-600">No email records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
