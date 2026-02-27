import { useState, useEffect } from 'react';
import { Plus, Search, Printer, X, Loader2, AlertCircle } from 'lucide-react';
import Badge from '../components/Badge';
import api from '../api/client';
import { fmt } from '../utils/format';

const CATEGORIES = ['Administrative','Transport','Utilities','Operations','Equipment','Payroll','Other'];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('All');
  const [showModal,setShowModal]= useState(false);
  const [submitting,setSubmitting]=useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    description:'', category:'Administrative', amount:'', vendor:'', reference:'', expense_date:'', notes:''
  });

  const load = () => {
    setLoading(true);
    api.get('/expenses')
      .then(r => setExpenses(r.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = expenses.filter(e =>
    (category === 'All' || e.category === category) &&
    (e.description.toLowerCase().includes(search.toLowerCase()) || (e.vendor||'').toLowerCase().includes(search.toLowerCase()))
  );

  const total = filtered.filter(e=>e.status!=='Rejected').reduce((s,e)=>s+Number(e.amount),0);

  const handleSubmit = async () => {
    if (!form.description || !form.category || !form.amount || !form.expense_date) {
      setFormError('Description, category, amount, and date are required.');
      return;
    }
    setSubmitting(true); setFormError('');
    try {
      await api.post('/expenses', { ...form, amount: Number(form.amount) });
      setShowModal(false);
      setForm({ description:'', category:'Administrative', amount:'', vendor:'', reference:'', expense_date:'', notes:'' });
      load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:'Total Expenses (Approved)', value: fmt(expenses.filter(e=>e.status==='Approved').reduce((s,e)=>s+Number(e.amount),0)), color:'border-l-4 border-blue-600' },
          { label:'Pending Approval',           value:`${expenses.filter(e=>e.status==='Pending').length} items`, color:'border-l-4 border-amber-500' },
          { label:'Total Entries',              value: expenses.length, color:'border-l-4 border-gray-400' },
        ].map(c => (
          <div key={c.label} className={`bg-white rounded-xl shadow-sm p-4 ${c.color}`}>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">{c.label}</p>
            <p className="text-sm font-extrabold text-gray-900 mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap flex-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search expenses..."
              className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
          </div>
          <select value={category} onChange={e=>setCategory(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All</option>
            {CATEGORIES.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>window.print()} className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-50">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button onClick={()=>setShowModal(true)} className="flex items-center gap-1.5 bg-blue-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-blue-800">
            <Plus className="w-3.5 h-3.5" /> Log Expense
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-900 text-white px-5 py-3">
          <p className="text-xs font-extrabold uppercase tracking-widest">Expense Ledger</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-blue-600 animate-spin" /><span className="ml-2 text-sm text-gray-500">Loading...</span></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  {['No.','Description','Category','Vendor','Date','Ref','Status','Amount (RWF)'].map(h=>(
                    <th key={h} className={`px-4 py-3 font-bold text-gray-700 ${h==='Amount (RWF)'?'text-right':h==='Status'?'text-center':'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((e,i) => (
                  <tr key={e.id} className={`${e.status==='Pending'?'bg-amber-50':i%2===0?'bg-white':'bg-gray-50/50'} hover:bg-blue-50/20`}>
                    <td className="px-4 py-2.5 text-gray-400 font-mono">{String(i+1).padStart(2,'0')}</td>
                    <td className="px-4 py-2.5 font-semibold text-gray-900">{e.description}</td>
                    <td className="px-4 py-2.5"><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-medium">{e.category}</span></td>
                    <td className="px-4 py-2.5 text-gray-600">{e.vendor||'—'}</td>
                    <td className="px-4 py-2.5 text-gray-500">{String(e.expense_date||'').slice(0,10)}</td>
                    <td className="px-4 py-2.5 font-mono text-gray-400">{e.reference||'—'}</td>
                    <td className="px-4 py-2.5 text-center"><Badge label={e.status} /></td>
                    <td className="px-4 py-2.5 text-right font-semibold">{Number(e.amount||0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-800 text-white font-bold">
                  <td colSpan={7} className="px-4 py-3 text-sm uppercase">Total (Approved)</td>
                  <td className="px-4 py-3 text-right">{total.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-5">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Log New Expense</h3>
                <p className="text-[10px] text-gray-500">Record a school expenditure</p>
              </div>
              <button onClick={()=>setShowModal(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            {formError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-700">{formError}</p>
              </div>
            )}
            <div className="space-y-3 text-xs">
              {[
                { label:'Description', key:'description', type:'text', placeholder:'e.g. Printer paper for office' },
                { label:'Vendor / Supplier', key:'vendor', type:'text', placeholder:'Vendor name' },
                { label:'Receipt / Reference No.', key:'reference', type:'text', placeholder:'e.g. REC-005' },
                { label:'Notes', key:'notes', type:'text', placeholder:'Optional notes' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block font-semibold text-gray-700 mb-1">{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})}
                    placeholder={f.placeholder}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Amount (RWF) <span className="text-red-500">*</span></label>
                  <input type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs" />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs">
                    {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                <input type="date" value={form.expense_date} onChange={e=>setForm({...form,expense_date:e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={()=>setShowModal(false)} className="flex-1 bg-white border border-gray-200 text-gray-700 text-xs font-semibold py-2 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-1 bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg hover:bg-blue-800 flex items-center justify-center gap-2 disabled:opacity-60">
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit Expense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
