// ─── School Configuration ────────────────────────────────────────────────────
export const SCHOOL = {
  name: "Kenza International School",
  address: "KG 11 Ave, Kigali, Rwanda",
  tel: "+250 788 123 456",
  email: "bursar@kenza.rw",
  term: "Term 1",
  year: "2024/2025",
  cashier: "Uwimana Solange",
};

// ─── Fee Structure per Class ─────────────────────────────────────────────────
export const FEE_STRUCTURE = {
  "Nursery":  { tuition: 180000, activity: 20000, transport: 0   },
  "P1":       { tuition: 240000, activity: 25000, transport: 0   },
  "P2":       { tuition: 240000, activity: 25000, transport: 0   },
  "P3":       { tuition: 260000, activity: 25000, transport: 0   },
  "P4":       { tuition: 260000, activity: 30000, transport: 0   },
  "P5":       { tuition: 280000, activity: 30000, transport: 0   },
  "P6":       { tuition: 280000, activity: 30000, transport: 0   },
  "S1":       { tuition: 380000, activity: 40000, transport: 0   },
  "S2":       { tuition: 380000, activity: 40000, transport: 0   },
  "S3":       { tuition: 400000, activity: 40000, transport: 0   },
  "S4":       { tuition: 420000, activity: 45000, transport: 0   },
  "S5":       { tuition: 420000, activity: 45000, transport: 0   },
  "S6":       { tuition: 450000, activity: 50000, transport: 0   },
};

export const totalFee = (cls) => {
  const f = FEE_STRUCTURE[cls];
  if (!f) return 0;
  return f.tuition + f.activity + f.transport;
};

// ─── Students ────────────────────────────────────────────────────────────────
// payments[] = array of { receiptNo, date, amount, method, cashier, ref? }
export const STUDENTS = [
  {
    id: "KIS/2024/0041", name: "Amara Uwase",        class: "S3", stream: "A",
    guardian: "Uwase Emmanuel", guardianTel: "+250 788 001 001",
    payments: [
      { receiptNo: "RCP-2025-0091", date: "2025-01-15", amount: 220000, method: "MoMo",  cashier: "Uwimana Solange", ref: "250788001001" },
      { receiptNo: "RCP-2025-0112", date: "2025-02-10", amount: 220000, method: "Bank",  cashier: "Uwimana Solange", ref: "BNK-4421" },
    ],
  },
  {
    id: "KIS/2024/0089", name: "Jean Pierre Nziza",  class: "P6", stream: "B",
    guardian: "Nziza Théophile",  guardianTel: "+250 788 002 002",
    payments: [
      { receiptNo: "RCP-2025-0077", date: "2025-01-12", amount: 310000, method: "Cash",  cashier: "Uwimana Solange", ref: "" },
    ],
  },
  {
    id: "KIS/2024/0055", name: "Eric Habimana",      class: "S5", stream: "A",
    guardian: "Habimana Faustin", guardianTel: "+250 788 003 003",
    payments: [],
  },
  {
    id: "KIS/2023/0120", name: "Clarisse Mukamana",  class: "S1", stream: "C",
    guardian: "Mukamana Vestine", guardianTel: "+250 788 004 004",
    payments: [
      { receiptNo: "RCP-2025-0055", date: "2025-01-10", amount: 420000, method: "MoMo",  cashier: "Uwimana Solange", ref: "250788004004" },
    ],
  },
  {
    id: "KIS/2023/0077", name: "Divine Ineza",       class: "P4", stream: "A",
    guardian: "Ineza Alexis",     guardianTel: "+250 788 005 005",
    payments: [
      { receiptNo: "RCP-2025-0042", date: "2025-01-08", amount: 290000, method: "Cash",  cashier: "Uwimana Solange", ref: "" },
    ],
  },
  {
    id: "KIS/2024/0033", name: "Sandra Umutoni",     class: "S2", stream: "B",
    guardian: "Umutoni Chantal",  guardianTel: "+250 788 006 006",
    payments: [],
  },
  {
    id: "KIS/2023/0088", name: "Samuel Rukundo",     class: "S4", stream: "B",
    guardian: "Rukundo Callixte", guardianTel: "+250 788 007 007",
    payments: [
      { receiptNo: "RCP-2025-0031", date: "2025-01-07", amount: 150000, method: "Cash",  cashier: "Uwimana Solange", ref: "" },
    ],
  },
  {
    id: "KIS/2024/0102", name: "Grace Mukamurenzi",  class: "P5", stream: "A",
    guardian: "Mukamurenzi Pius", guardianTel: "+250 788 008 008",
    payments: [
      { receiptNo: "RCP-2025-0088", date: "2025-01-14", amount: 310000, method: "Bank",  cashier: "Uwimana Solange", ref: "BNK-3309" },
    ],
  },
  {
    id: "KIS/2024/0114", name: "Patrick Bizimana",   class: "S2", stream: "C",
    guardian: "Bizimana Robert",  guardianTel: "+250 788 009 009",
    payments: [
      { receiptNo: "RCP-2025-0099", date: "2025-02-01", amount: 200000, method: "MoMo",  cashier: "Uwimana Solange", ref: "250788009009" },
      { receiptNo: "RCP-2025-0121", date: "2025-02-20", amount: 100000, method: "Cash",  cashier: "Uwimana Solange", ref: "" },
    ],
  },
  {
    id: "KIS/2024/0061", name: "Josiane Ingabire",   class: "P3", stream: "B",
    guardian: "Ingabire Odette",  guardianTel: "+250 788 010 010",
    payments: [],
  },
];

// ─── Computed helpers ─────────────────────────────────────────────────────────
export const studentBalance = (student) => {
  const fee = totalFee(student.class);
  const paid = student.payments.reduce((s, p) => s + p.amount, 0);
  return { fee, paid, balance: fee - paid };
};

export const paymentStatus = (student) => {
  const { fee, paid, balance } = studentBalance(student);
  if (balance <= 0)   return "Cleared";
  if (paid === 0)     return "Unpaid";
  return "Partial";
};

// ─── Daily Cash Book entries (today + recent) ────────────────────────────────
export const CASH_BOOK = [
  { receiptNo: "RCP-2025-0118", time: "08:14", student: "Amara Uwase",       class:"S3A", amount: 220000, method: "MoMo",  cashier: "Uwimana Solange" },
  { receiptNo: "RCP-2025-0119", time: "08:52", student: "Patrick Bizimana",  class:"S2C", amount: 100000, method: "Cash",  cashier: "Uwimana Solange" },
  { receiptNo: "RCP-2025-0120", time: "09:31", student: "Sandra Umutoni",    class:"S2B", amount: 420000, method: "Bank",  cashier: "Uwimana Solange" },
  { receiptNo: "RCP-2025-0121", time: "10:05", student: "Eric Habimana",     class:"S5A", amount: 465000, method: "MoMo",  cashier: "Uwimana Solange" },
  { receiptNo: "RCP-2025-0122", time: "10:48", student: "Josiane Ingabire",  class:"P3B", amount: 285000, method: "Cash",  cashier: "Uwimana Solange" },
  { receiptNo: "RCP-2025-0123", time: "11:22", student: "Grace Mukamurenzi", class:"P5A", amount: 310000, method: "MoMo",  cashier: "Uwimana Solange" },
];

// ─── Formatters ───────────────────────────────────────────────────────────────
export const fmt   = (n) => "RWF " + Number(n).toLocaleString();
export const fmtNo = (n) => Number(n).toLocaleString();

export const amountInWords = (amount) => {
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
    "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const convert = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? " " + ones[n%10] : "");
    if (n < 1000) return ones[Math.floor(n/100)] + " Hundred" + (n%100 ? " " + convert(n%100) : "");
    if (n < 1000000) return convert(Math.floor(n/1000)) + " Thousand" + (n%1000 ? " " + convert(n%1000) : "");
    return convert(Math.floor(n/1000000)) + " Million" + (n%1000000 ? " " + convert(n%1000000) : "");
  };
  return convert(amount) + " Rwandan Francs Only";
};

export const TODAY = "Thursday, 26 February 2025";
export const TODAY_ISO = "2025-02-26";
