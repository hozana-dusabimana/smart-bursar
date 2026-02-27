const styles = {
  Cleared:  "bg-emerald-100 text-emerald-800 border border-emerald-200",
  Partial:  "bg-blue-100 text-blue-800 border border-blue-200",
  Unpaid:   "bg-red-100 text-red-800 border border-red-200",
  Cash:     "bg-green-100 text-green-800",
  MoMo:     "bg-yellow-100 text-yellow-800",
  Bank:     "bg-indigo-100 text-indigo-800",
  Approved: "bg-emerald-100 text-emerald-800",
  Pending:  "bg-amber-100 text-amber-800",
  Rejected: "bg-red-100 text-red-800",
};

export default function Badge({ label }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${styles[label] || "bg-gray-100 text-gray-700"}`}>
      {label}
    </span>
  );
}
