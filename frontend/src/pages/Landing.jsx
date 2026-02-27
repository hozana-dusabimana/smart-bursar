import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, BarChart3, Crown, Shield, Users, CheckCircle2,
  ArrowRight, Star, Menu, X, Zap, Lock, Globe, Phone,
  Mail, MapPin, ChevronDown
} from 'lucide-react';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Contact', href: '#contact' },
];

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Bursar Operations',
    desc: 'Collect fees, generate receipts, manage daily cash book — everything a bursar needs in one screen.',
    color: 'bg-blue-600',
  },
  {
    icon: BarChart3,
    title: 'Accountant Tools',
    desc: 'Daily reconciliation, full ledger, expense approval workflow, and financial audit trail.',
    color: 'bg-teal-600',
  },
  {
    icon: Crown,
    title: 'Principal Dashboard',
    desc: 'Executive view of collection rates, defaulters, expenditure trends — read-only and always accurate.',
    color: 'bg-indigo-600',
  },
  {
    icon: Users,
    title: 'Parent Portal',
    desc: 'Parents check their child\'s fee balance, payment history and download receipts from any device.',
    color: 'bg-emerald-600',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    desc: 'Five separate portals with distinct permissions. Every user sees exactly what they should.',
    color: 'bg-orange-600',
  },
  {
    icon: Mail,
    title: 'Email Notifications',
    desc: 'Automatic payment receipts, balance reminders, and password recovery sent to guardians instantly.',
    color: 'bg-rose-600',
  },
];

const STEPS = [
  { n: '01', title: 'School onboarding', desc: 'We set up your school in minutes — classes, fee structure, academic terms.' },
  { n: '02', title: 'Enrol students', desc: 'Bursar or admin imports or manually adds students with guardian details.' },
  { n: '03', title: 'Collect & track', desc: 'Collect fees by cash, MoMo or bank. Receipts auto-generate and email to parents.' },
  { n: '04', title: 'Reports & close', desc: 'End of term reports, defaulter lists, reconciliation statements — one click.' },
];

const PLANS = [
  {
    name: 'Trial',
    price: 'Free',
    sub: '30 days',
    features: ['1 school', 'Up to 200 students', 'All portals', 'Email receipts', 'Basic reports'],
    cta: 'Start Free Trial',
    highlight: false,
  },
  {
    name: 'Basic',
    price: 'RWF 35,000',
    sub: 'per term',
    features: ['1 school', 'Up to 800 students', 'All portals', 'Email notifications', 'Full reports', 'Priority support'],
    cta: 'Get Started',
    highlight: true,
  },
  {
    name: 'Premium',
    price: 'RWF 70,000',
    sub: 'per term',
    features: ['1 school', 'Unlimited students', 'All portals', 'Email + SMS', 'Custom branding', 'Dedicated support', 'Data export'],
    cta: 'Contact Us',
    highlight: false,
  },
];

const TESTIMONIALS = [
  {
    quote: 'Our bursary used to take 2 hours every morning just reconciling receipts. Now it takes 10 minutes.',
    name: 'Sr. Jeanne d\'Arc Mukandoli',
    role: 'Bursar, Groupe Scolaire Apaper',
    initials: 'JM',
    bg: 'bg-blue-600',
  },
  {
    quote: 'As principal, I can see exactly how much has been collected this term from my phone — without calling anyone.',
    name: 'Mr. Emmanuel Nsanzineza',
    role: 'Head Teacher, EP Gisenyi',
    initials: 'EN',
    bg: 'bg-indigo-600',
  },
  {
    quote: 'Parents are happier because they get a receipt by email immediately. No more "I paid but have no proof."',
    name: 'Mrs. Clarisse Uwamariya',
    role: 'Finance Officer, Kigali Primary School',
    initials: 'CU',
    bg: 'bg-teal-600',
  },
];

function AnimatedStat({ value, label, suffix = '' }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const target = parseInt(value);
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setDisplay(target); clearInterval(timer); }
      else setDisplay(start);
    }, 20);
    return () => clearInterval(timer);
  }, [value]);
  return (
    <div className="text-center">
      <p className="text-3xl font-black text-white">{display.toLocaleString()}{suffix}</p>
      <p className="text-sm text-blue-200 mt-1">{label}</p>
    </div>
  );
}

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans antialiased">

      {/* ── Navbar ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className={`text-base font-black tracking-tight ${scrolled ? 'text-gray-900' : 'text-white'}`}>Smart Bursar</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href}
                className={`text-sm font-semibold transition-colors hover:text-blue-500 ${scrolled ? 'text-gray-600' : 'text-white/80'}`}>
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className={`text-sm font-bold transition-colors ${scrolled ? 'text-gray-700 hover:text-blue-700' : 'text-white/80 hover:text-white'}`}>
              Sign in
            </Link>
            <Link to="/login" className="bg-blue-700 text-white text-sm font-bold px-5 py-2 rounded-xl hover:bg-blue-800 transition-colors shadow-sm">
              Get Started →
            </Link>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2">
            {menuOpen ? <X className={`w-5 h-5 ${scrolled ? 'text-gray-800' : 'text-white'}`} /> : <Menu className={`w-5 h-5 ${scrolled ? 'text-gray-800' : 'text-white'}`} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-5 py-4 space-y-3 shadow-lg">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)} className="block text-sm font-semibold text-gray-700 py-1">{l.label}</a>
            ))}
            <div className="pt-2 flex gap-3">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center border border-gray-200 text-sm font-bold text-gray-700 py-2.5 rounded-xl">Sign in</Link>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center bg-blue-700 text-white text-sm font-bold py-2.5 rounded-xl">Get Started</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 min-h-screen flex items-center overflow-hidden">
        {/* Grid texture */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
        {/* Glow blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-700/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-5 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-bold px-4 py-1.5 rounded-full mb-8">
            <Zap className="w-3 h-3" /> Built for Rwandan Schools
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight max-w-4xl mx-auto">
            School Finance,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Finally Simple.
            </span>
          </h1>

          <p className="text-lg text-blue-100/70 max-w-2xl mx-auto mt-6 leading-relaxed">
            Smart Bursar replaces paper receipts, manual registers, and endless spreadsheets with one digital system built exactly for how Rwandan school bursar offices work.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link to="/login" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-base px-8 py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-900/40 hover:shadow-blue-600/30 hover:-translate-y-0.5">
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#features" className="flex items-center gap-2 text-blue-200 hover:text-white font-semibold text-sm transition-colors">
              See how it works <ChevronDown className="w-4 h-4" />
            </a>
          </div>

          {/* Role badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-12">
            {[
              { icon: BookOpen, label: 'Bursar', color: 'bg-blue-600' },
              { icon: BarChart3, label: 'Accountant', color: 'bg-teal-600' },
              { icon: Crown, label: 'Principal', color: 'bg-indigo-600' },
              { icon: Shield, label: 'Admin', color: 'bg-orange-600' },
              { icon: Users, label: 'Parent Portal', color: 'bg-emerald-600' },
            ].map(r => (
              <div key={r.label} className="flex items-center gap-2 bg-white/5 border border-white/10 backdrop-blur-sm text-white/80 text-xs font-semibold px-3 py-1.5 rounded-full">
                <div className={`w-4 h-4 rounded-full ${r.color} flex items-center justify-center`}>
                  <r.icon className="w-2.5 h-2.5 text-white" />
                </div>
                {r.label}
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30 animate-bounce">
          <ChevronDown className="w-5 h-5" />
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-blue-700">
        <div className="max-w-4xl mx-auto px-5 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8">
          <AnimatedStat value="120" suffix="+" label="Schools onboarded" />
          <AnimatedStat value="45000" suffix="+" label="Students tracked" />
          <AnimatedStat value="98" suffix="%" label="Bursar satisfaction" />
          <AnimatedStat value="3" suffix="min" label="Average receipt time" />
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Everything you need</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">One system, every role covered</h2>
            <p className="text-gray-500 max-w-xl mx-auto mt-4 leading-relaxed">
              From the bursar collecting morning fees to the principal checking collection rates from home — Smart Bursar has a dedicated portal for every stakeholder.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Simple by design</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">Up and running in one day</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-gray-200 -translate-x-4 z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-blue-700 text-white font-black text-sm flex items-center justify-center mb-4 shadow-lg shadow-blue-700/20">
                    {s.n}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 bg-slate-900">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Trusted by schools</p>
            <h2 className="text-3xl font-black text-white">What schools are saying</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-sm text-white/70 leading-relaxed italic mb-5">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${t.bg} flex items-center justify-center text-xs font-black text-white shrink-0`}>{t.initials}</div>
                  <div>
                    <p className="text-xs font-bold text-white">{t.name}</p>
                    <p className="text-[10px] text-white/40">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Transparent pricing</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">Pay per term, cancel anytime</h2>
            <p className="text-gray-500 mt-3 text-sm">No setup fees. No hidden charges. Prices in Rwandan Francs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {PLANS.map(p => (
              <div key={p.name} className={`rounded-2xl overflow-hidden transition-all
                ${p.highlight ? 'bg-blue-700 text-white shadow-2xl shadow-blue-700/30 scale-105' : 'bg-white border border-gray-200 shadow-sm'}`}>
                <div className={`p-6 ${p.highlight ? '' : ''}`}>
                  <p className={`text-xs font-bold uppercase tracking-widest ${p.highlight ? 'text-blue-200' : 'text-gray-400'}`}>{p.name}</p>
                  <div className="mt-3 flex items-end gap-1">
                    <span className={`text-3xl font-black ${p.highlight ? 'text-white' : 'text-gray-900'}`}>{p.price}</span>
                    {p.price !== 'Free' && <span className={`text-xs pb-1 ${p.highlight ? 'text-blue-200' : 'text-gray-400'}`}>/{p.sub}</span>}
                    {p.price === 'Free' && <span className={`text-xs pb-1 ${p.highlight ? 'text-blue-200' : 'text-gray-400'}`}>{p.sub}</span>}
                  </div>

                  <ul className="mt-6 space-y-2.5">
                    {p.features.map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${p.highlight ? 'text-blue-200' : 'text-emerald-500'}`} />
                        <span className={p.highlight ? 'text-blue-100' : 'text-gray-600'}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to="/login"
                    className={`mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all
                      ${p.highlight ? 'bg-white text-blue-700 hover:bg-blue-50' : 'bg-blue-700 text-white hover:bg-blue-800'}`}>
                    {p.cta} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-blue-700">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Ready to modernise your school's finances?</h2>
          <p className="text-blue-100 mb-8 leading-relaxed">
            Join over 120 Rwandan schools that have eliminated paper receipts, manual registers and end-of-term chaos.
          </p>
          <Link to="/login" className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold text-base px-8 py-3.5 rounded-2xl hover:bg-blue-50 transition-colors shadow-lg">
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Contact + Footer ── */}
      <section id="contact" className="bg-slate-950 py-16">
        <div className="max-w-6xl mx-auto px-5 grid grid-cols-1 md:grid-cols-3 gap-10 text-sm mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-blue-700 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-black text-white">Smart Bursar</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              A digital finance management system built specifically for Rwandan schools. Paperless. Accurate. Instant.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Quick Links</p>
            <ul className="space-y-2">
              {[...NAV_LINKS, { label: 'Sign In', href: '/login' }].map(l => (
                <li key={l.label}>
                  {l.href.startsWith('/') ? (
                    <Link to={l.href} className="text-slate-400 hover:text-white transition-colors text-sm">{l.label}</Link>
                  ) : (
                    <a href={l.href} className="text-slate-400 hover:text-white transition-colors text-sm">{l.label}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Contact</p>
            <ul className="space-y-3">
              {[
                { icon: Phone,  val: '+250 788 123 456' },
                { icon: Mail,   val: 'hello@smartbursar.rw' },
                { icon: MapPin, val: 'KG 11 Ave, Kigali, Rwanda' },
                { icon: Globe,  val: 'www.smartbursar.rw' },
              ].map(c => (
                <li key={c.val} className="flex items-center gap-2.5 text-slate-400 text-xs">
                  <c.icon className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  {c.val}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-5 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} Smart Bursar. All rights reserved.</p>
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <Lock className="w-3 h-3" /> Secured with 256-bit encryption
          </div>
        </div>
      </section>
    </div>
  );
}
