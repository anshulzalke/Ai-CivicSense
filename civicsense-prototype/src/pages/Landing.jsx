import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  ShieldCheck,
  Landmark,
  ArrowRight,
  Sparkles,
  Camera,
  Clock,
  Vote,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Heart,
} from "lucide-react";

import Seal from "../components/Seal";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useLanguage } from "../context/LanguageContext";

export default function Landing() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // FAQ Tab & Accordion State
  const [faqTab, setFaqTab] = useState("all");
  const [openFaq, setOpenFaq] = useState(0);

  // Footer Newsletter & Feedback State
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState(null);

  const roles = [
    {
      key: "citizen",
      title: t("citizen_role"),
      desc: "Report an issue, track your token, vote on local polls, and validate its resolution.",
      icon: Users,
    },
    {
      key: "gov",
      title: t("gov_role"),
      desc: "Manage the department priority queue, assign field staff, and resolve complaints.",
      icon: Landmark,
    },
    {
      key: "admin",
      title: t("admin_role"),
      desc: "Oversee citizens, officials, audit logs, and platform-wide municipal settings.",
      icon: ShieldCheck,
    },
  ];

  const steps = [
    {
      number: "01",
      title: t("step1_title"),
      desc: t("step1_desc"),
      icon: Camera,
    },
    {
      number: "02",
      title: t("step2_title"),
      desc: t("step2_desc"),
      icon: Clock,
    },
    {
      number: "03",
      title: t("step3_title"),
      desc: t("step3_desc"),
      icon: CheckCircle2,
    },
  ];

  const features = [
    {
      title: t("feat1_title"),
      desc: t("feat1_desc"),
      icon: Sparkles,
      tag: "Deep Learning",
    },
    {
      title: t("feat2_title"),
      desc: t("feat2_desc"),
      icon: Clock,
      tag: "Automated SLA",
    },
    {
      title: t("feat3_title"),
      desc: t("feat3_desc"),
      icon: Vote,
      tag: "Governance",
    },
  ];

  const faqs = [
    {
      id: 0,
      q: t("faq1_q"),
      a: t("faq1_a"),
      category: "popular",
    },
    {
      id: 1,
      q: t("faq2_q"),
      a: t("faq2_a"),
      category: "popular",
    },
    {
      id: 2,
      q: t("faq3_q"),
      a: t("faq3_a"),
      category: "all",
    },
    {
      id: 3,
      q: t("faq4_q"),
      a: t("faq4_a"),
      category: "all",
    },
  ];

  const filteredFaqs = faqTab === "popular" ? faqs.filter((f) => f.category === "popular") : faqs;

  const emojis = [
    { label: "Terrible", symbol: "😡" },
    { label: "Poor", symbol: "😕" },
    { label: "Neutral", symbol: "😐" },
    { label: "Good", symbol: "🙂" },
    { label: "Awesome", symbol: "😍" },
  ];

  function handleNewsletter(e) {
    e.preventDefault();
    if (!newsletterEmail) return;
    setSubscribed(true);
    setNewsletterEmail("");
    setTimeout(() => setSubscribed(false), 5000);
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Header */}
      <header className="max-w-6xl mx-auto w-full px-6 md:px-10 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full seal-ring flex items-center justify-center">
            <div className="w-7 h-7 rounded-full bg-paper flex items-center justify-center font-display text-ink-900 font-semibold text-sm">
              C
            </div>
          </div>
          <span className="font-display text-lg font-semibold text-ink-900">{t("app_name")}</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-slate2 hidden sm:block">
            {t("sub_tagline")}
          </span>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto w-full px-6 md:px-10 pt-8 pb-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-marigold-600 mb-4 font-semibold">
            {t("tagline")}
          </p>
          <h1 className="font-display text-4xl md:text-5xl leading-[1.08] font-semibold text-ink-900">
            {t("landing_hero_title")}
            <br />
            <span className="text-marigold-600">{t("landing_hero_subtitle")}</span>
          </h1>
          <p className="mt-5 text-slate2 text-base leading-relaxed max-w-md">
            {t("landing_hero_desc")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {roles.map((r) => (
              <button
                key={r.key}
                onClick={() => navigate(`/login/${r.key}`)}
                className="group flex items-center gap-2 pl-4 pr-3 py-3 rounded-xl bg-ink-900 text-paper hover:bg-ink-700 transition-colors shadow-sm cursor-pointer"
              >
                <r.icon size={16} className="text-marigold-400" />
                <span className="text-sm font-medium">{r.title}</span>
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-1" />
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="ticket-notch bg-white border border-ink-100 rounded-2xl p-6 shadow-[0_20px_60px_-25px_rgba(22,35,61,0.35)]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate2">
                Complaint Token
              </span>
              <span className="text-[11px] font-mono text-moss-600 font-semibold">● Live tracking</span>
            </div>
            <div className="flex items-center gap-4">
              <Seal severity={4} size={64} />
              <div>
                <p className="font-mono text-lg font-semibold text-ink-900">CVX-2026-000101</p>
                <p className="text-sm text-slate2">Deep pothole near Wagholi bus stop</p>
              </div>
            </div>
            <div className="mt-5 pt-5 border-t border-dashed border-ink-100 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-display font-semibold text-ink-900">48h</p>
                <p className="text-[11px] text-slate2">SLA to escalate</p>
              </div>
              <div>
                <p className="text-lg font-display font-semibold text-ink-900">3</p>
                <p className="text-[11px] text-slate2">Departments</p>
              </div>
              <div>
                <p className="text-lg font-display font-semibold text-ink-900">+25</p>
                <p className="text-[11px] text-slate2">Coins on close</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Selector Cards */}
      <section className="max-w-6xl mx-auto w-full px-6 md:px-10 pb-16 grid md:grid-cols-3 gap-4">
        {roles.map((r) => (
          <button
            key={r.key}
            onClick={() => navigate(`/login/${r.key}`)}
            className="text-left bg-white border border-ink-100 rounded-2xl p-6 hover:border-marigold-400 hover:shadow-md transition-all cursor-pointer"
          >
            <r.icon size={20} className="text-ink-900 mb-4" />
            <p className="font-display text-lg font-semibold text-ink-900">{r.title} dashboard</p>
            <p className="text-sm text-slate2 mt-1">{r.desc}</p>
            <span className="inline-flex items-center gap-1 text-xs font-mono text-marigold-600 mt-4 font-semibold">
              Enter <ArrowRight size={12} />
            </span>
          </button>
        ))}
      </section>

      {/* "How It Works" Section */}
      <section className="bg-white border-y border-ink-100 py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="text-center max-w-xl mx-auto mb-12">
            <p className="text-xs font-mono uppercase tracking-widest text-marigold-600 font-semibold mb-2">
              Workflow
            </p>
            <h2 className="font-display text-3xl font-semibold text-ink-900">
              {t("how_it_works_title")}
            </h2>
            <p className="text-sm text-slate2 mt-2">{t("how_it_works_sub")}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, idx) => (
              <div
                key={idx}
                className="bg-[#FAF9F5] border border-ink-100 rounded-2xl p-6 relative hover:border-marigold-400 transition-all shadow-2xs"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-ink-900 text-paper flex items-center justify-center">
                    <s.icon size={18} className="text-marigold-400" />
                  </div>
                  <span className="font-mono text-xl font-bold text-ink-300">
                    {s.number}
                  </span>
                </div>
                <h3 className="font-display font-semibold text-lg text-ink-900 mb-2">{s.title}</h3>
                <p className="text-xs text-slate2 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* "Features" Highlight Section */}
      <section className="py-16 max-w-6xl mx-auto px-6 md:px-10">
        <div className="text-center max-w-xl mx-auto mb-12">
          <p className="text-xs font-mono uppercase tracking-widest text-marigold-600 font-semibold mb-2">
            Core Architecture
          </p>
          <h2 className="font-display text-3xl font-semibold text-ink-900">
            {t("features_title")}
          </h2>
          <p className="text-sm text-slate2 mt-2">{t("features_sub")}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-white border border-ink-100 rounded-2xl p-6 shadow-2xs hover:shadow-md transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-marigold-100 text-marigold-800 flex items-center justify-center">
                  <f.icon size={20} />
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-ink-100 text-slate2">
                  {f.tag}
                </span>
              </div>
              <h3 className="font-display font-semibold text-lg text-ink-900">{f.title}</h3>
              <p className="text-xs text-slate2 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Frequently Asked Questions (FAQs) */}
      <section className="bg-white border-y border-ink-100 py-16">
        <div className="max-w-4xl mx-auto px-6 md:px-10">
          <div className="text-center max-w-xl mx-auto mb-8">
            <p className="text-xs font-mono uppercase tracking-widest text-marigold-600 font-semibold mb-2">
              Help Center
            </p>
            <h2 className="font-display text-3xl font-semibold text-ink-900">
              {t("faqs_title")}
            </h2>
            <p className="text-sm text-slate2 mt-2">{t("faqs_sub")}</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex justify-center gap-2 mb-8">
            <button
              onClick={() => setFaqTab("all")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                faqTab === "all"
                  ? "bg-ink-900 text-paper shadow-xs"
                  : "bg-ink-50 text-slate2 hover:text-ink-900"
              }`}
            >
              {t("faq_tab_all")}
            </button>
            <button
              onClick={() => setFaqTab("popular")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                faqTab === "popular"
                  ? "bg-ink-900 text-paper shadow-xs"
                  : "bg-ink-50 text-slate2 hover:text-ink-900"
              }`}
            >
              {t("faq_tab_popular")}
            </button>
          </div>

          {/* Accordions */}
          <div className="space-y-3">
            {filteredFaqs.map((faq) => {
              const isOpen = openFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  className="border border-ink-100 rounded-2xl overflow-hidden bg-[#FAF9F5] transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? -1 : faq.id)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-display font-semibold text-sm text-ink-900 hover:bg-ink-50/50"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp size={16} className="text-marigold-600 shrink-0" />
                    ) : (
                      <ChevronDown size={16} className="text-slate2 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs text-slate2 leading-relaxed bg-white border-t border-ink-100/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Footer */}
      <footer className="bg-ink-900 text-paper mt-auto pt-14 pb-8">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="grid md:grid-cols-12 gap-8 pb-12 border-b border-white/10">
            {/* Column 1: Brand */}
            <div className="md:col-span-4 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-marigold-400 text-ink-900 flex items-center justify-center font-bold text-xs font-sans">
                  C
                </div>
                <span className="font-display text-xl font-bold text-white">
                  {t("app_name")}
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Automated Municipal Grievance Redressal, Spatial Analytics, and Civic Democracy Platform for Pune District.
              </p>
              <p className="text-[11px] font-mono text-marigold-400">
                PMC · PCMC · PMRDA · Smart Cities Mission
              </p>
            </div>

            {/* Column 2: Navigation Links */}
            <div className="md:col-span-3 space-y-2 text-xs">
              <p className="font-mono uppercase tracking-wider text-slate-300 font-semibold mb-3">
                Quick Navigation
              </p>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <button onClick={() => navigate("/login/citizen")} className="hover:text-white transition-colors">
                    Citizen Portal
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/login/gov")} className="hover:text-white transition-colors">
                    Government Official Queue
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/voting-system")} className="hover:text-white transition-colors">
                    Community Voting
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/sos")} className="hover:text-white transition-colors">
                    Emergency SOS Directory
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Newsletter & Feedback */}
            <div className="md:col-span-5 space-y-4">
              <div>
                <p className="font-mono uppercase tracking-wider text-slate-300 text-xs font-semibold mb-1">
                  {t("footer_newsletter_title")}
                </p>
                <p className="text-xs text-slate-400 mb-2">
                  {t("footer_newsletter_sub")}
                </p>

                <form onSubmit={handleNewsletter} className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="flex-1 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder:text-slate-500 outline-none focus:border-marigold-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-marigold-400 text-ink-900 rounded-xl text-xs font-semibold hover:bg-marigold-300 transition-colors shrink-0"
                  >
                    {t("footer_subscribe")}
                  </button>
                </form>
                {subscribed && (
                  <p className="text-[11px] text-moss-400 mt-1 font-medium">
                    ✓ Subscribed! You will receive weekly civic updates.
                  </p>
                )}
              </div>

              {/* Emoji Feedback Widget */}
              <div className="pt-2 border-t border-white/10">
                <p className="text-[11px] font-medium text-slate-300 mb-1.5">
                  {selectedEmoji ? t("footer_feedback_thanks") : t("footer_feedback_title")}
                </p>
                <div className="flex items-center gap-2">
                  {emojis.map((em, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedEmoji(em.label)}
                      className={`text-xl p-1.5 rounded-lg transition-transform hover:scale-125 ${
                        selectedEmoji === em.label ? "bg-white/20 scale-125" : "opacity-80 hover:opacity-100"
                      }`}
                      title={em.label}
                    >
                      {em.symbol}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 flex items-center justify-between flex-wrap gap-4 text-[11px] text-slate-500 font-mono">
            <p>© 2026 {t("footer_rights")}</p>
            <p className="flex items-center gap-1">
              Built with precision for Civic Good <Heart size={10} className="text-signal-400" />
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
