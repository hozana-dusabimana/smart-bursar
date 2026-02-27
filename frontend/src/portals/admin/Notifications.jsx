import { useEffect, useState } from 'react';
import { Mail, Send, CheckCircle2, XCircle, Clock, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../../api/client';

const STATUS_STYLE = {
  sent:    'bg-emerald-100 text-emerald-700',
  failed:  'bg-red-100 text-red-700',
  pending: 'bg-amber-100 text-amber-700',
};
const TEMPLATE_LABELS = {
  receipt:       'Payment Receipt',
  welcome:       'Welcome Email',
  passwordReset: 'Password Reset',
  lowBalance:    'Balance Reminder',
  newSchool:     'School Welcome',
};

export default function Notifications() {
  const [emails,    setEmails]    = useState([]);
  const [stats,     setStats]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [sending,   setSending]   = useState(false);
  const [statusF,   setStatusF]   = useState('All');
  const [msg,       setMsg]       = useState({ text:'', type:'' });
  const [refresh,   setRefresh]   = useState(0);

  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text:'', type:'' }), 4000); };

  useEffect(() => {
    setLoading(true);
    const q = statusF !== 'All' ? `?status=${statusF}` : '';
    Promise.all([
      api.get(`/notifications${q}`),
      api.get('/notifications/stats'),
    ]).then(([n, s]) => {
      setEmails(n.data?.notifications || []);
      setStats(s.data || []);
    }).finally(() => setLoading(false));
  }, [statusF, refresh]);

  const sendReminders = async () => {
    setSending(true);
    try {
      const res = await api.post('/notifications/send-reminders');
      flash(`Sent ${res.data.sent} reminder emails to defaulters (${res.data.skipped} skipped — no email on file)`);
      setRefresh(r => r + 1);
    } catch (e) {
      flash(e.message || 'Failed to send reminders', 'error');
    } finally { setSending(false); }
  };

  // Build summary from stats
  const totalSent    = stats.filter(s=>s.status==='sent').reduce((a,s)=>a+Number(s.count),0);
  const totalFailed  = stats.filter(s=>s.status==='failed').reduce((a,s)=>a+Number(s.count),0);
  const totalPending = stats.filter(s=>s.status==='pending').reduce((a,s)=>a+Number(s.count),0);
  const totalReceipts = stats.filter(s=>s.template==='receipt').reduce((a,s)=>a+Number(s.count),0);

  return (
    <div className="max-w-5xl space-y-5">
      {msg.text && (
        <div className={`flex items-center gap-2 rounded-xl p-3 border ${msg.type==='error' ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
          {msg.type==='error'
            ? <AlertTriangle className="w-4 h-4 text-red-500 shrink-0"/>
            : <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0"/>}
          <p className={`text-xs font-medium ${msg.type==='error' ? 'text-red-700' : 'text-emerald-700'}`}>{msg.text}</p>
        </div>
      )}

      {/* Stats + actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Emails Sent',      value: totalSent,     icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
          { label:'Failed',           value: totalFailed,   icon: XCircle,      color: 'text-red-500',     bg: 'bg-red-50 border-red-200'         },
          { label:'Pending',          value: totalPending,  icon: Clock,        color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200'      },
          { label:'Receipts Sent',    value: totalReceipts, icon: Mail,         color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200'        },
        ].map(c => (
          <div key={c.label} className={`rounded-xl p-4 border shadow-sm ${c.bg}`}>
            <div className="flex items-start justify-between mb-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{c.label}</p>
              <c.icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Send reminders action */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-bold text-gray-900">Send Balance Reminders</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Email all guardians of students with outstanding balances this term. Requires guardian email on file.
          </p>
        </div>
        <button onClick={sendReminders} disabled={sending}
          className="flex items-center gap-2 bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-blue-800 disabled:opacity-60 shadow-sm transition-all">
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Send className="w-3.5 h-3.5"/>}
          {sending ? 'Sending…' : 'Send Reminders Now'}
        </button>
      </div>

      {/* Email log */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest">
            <Mail className="w-3.5 h-3.5 inline mr-2" />Email Notification Log
          </p>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {['All','sent','failed','pending'].map(s=>(
                <button key={s} onClick={()=>setStatusF(s)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg capitalize transition-all
                    ${statusF===s?'bg-blue-600 text-white':'text-slate-400 hover:bg-slate-700'}`}>{s}</button>
              ))}
            </div>
            <button onClick={()=>setRefresh(r=>r+1)} className="p-1 text-slate-500 hover:text-white">
              <RefreshCw className={`w-3.5 h-3.5 ${loading?'animate-spin':''}`}/>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin"/>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  {['#','Recipient','Template','Status','Date','Error'].map(h=>(
                    <th key={h} className="px-4 py-2.5 text-left font-bold text-gray-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {emails.map((e,i) => (
                  <tr key={e.id} className={i%2===0?'bg-white':'bg-gray-50/50'}>
                    <td className="px-4 py-2.5 text-gray-400 font-mono">{String(i+1).padStart(3,'0')}</td>
                    <td className="px-4 py-2.5 text-gray-700">{e.recipient}</td>
                    <td className="px-4 py-2.5 text-gray-600">{TEMPLATE_LABELS[e.template] || e.template}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[e.status]||'bg-gray-100 text-gray-600'}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{String(e.created_at||'').slice(0,16)}</td>
                    <td className="px-4 py-2.5 text-red-500 text-[10px] max-w-[140px] truncate">{e.error_msg||'—'}</td>
                  </tr>
                ))}
                {emails.length===0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No notifications logged yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
