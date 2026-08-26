import React, { useState } from "react";
import {
  Vote,
  PlusCircle,
  BarChart3,
  CheckCircle2,
  MapPin,
  Clock,
  Send,
} from "lucide-react";

import { useLanguage } from "../../context/LanguageContext";
import { useApp } from "../../context/AppContext";

const LOCALIZED_POLLS = [
  {
    id: "poll-1",
    categoryKey: "cat_infrastructure",
    ward: "Wagholi / Kharadi",
    endsInDays: 3,
    translations: {
      en: {
        question: "Should PMRDA prioritize asphalt resurfacing or stormwater drain widening on Wagholi-Kharadi Link Road?",
        desc: "Allocating the Ward 14 Q3 Infrastructure Capital Improvement Budget.",
        category: "Infrastructure",
        endsIn: "3 days left",
      },
      hi: {
        question: "क्या PMRDA को वाघोली-खराड़ी लिंक रोड पर डामरीकरण या वर्षा जल निकासी नाले के चौड़ीकरण को प्राथमिकता देनी चाहिए?",
        desc: "वार्ड 14 की तीसरी तिमाही बुनियादी ढांचा पूंजीगत सुधार बजट आवंटन।",
        category: "बुनियादी ढांचा",
        endsIn: "3 दिन शेष",
      },
      mr: {
        question: "PMRDA ने वाघोली-खराडी लिंक रोडवरील डांबरीकरणाला की पावसाळी पाण्याच्या गटाराच्या रुंदीकरणाला प्राधान्य द्यावे?",
        desc: "प्रभाग १४ च्या तिसऱ्या तिमाहीतील पायाभूत सुविधा विकास निधीचे वाटप.",
        category: "पायाभूत सुविधा",
        endsIn: "३ दिवस शिल्लक",
      },
    },
    options: [
      {
        id: "opt-1",
        votes: 412,
        translations: {
          en: "Asphalt resurfacing & pothole reconstruction",
          hi: "डामरीकरण व गड्ढा पुनर्निर्माण",
          mr: "डांबरीकरण व खड्डे पुनर्बांधणी",
        },
      },
      {
        id: "opt-2",
        votes: 628,
        translations: {
          en: "Stormwater drain expansion & flood prevention",
          hi: "वर्षा जल निकासी नाला विस्तार व बाढ़ रोकथाम",
          mr: "पावसाळी गटार रुंदीकरण व पूर नियंत्रण",
        },
      },
      {
        id: "opt-3",
        votes: 194,
        translations: {
          en: "Dedicated bidirectional cycle & pedestrian lanes",
          hi: "समर्पित द्विदिश साइकिल व पैदल यात्री लेन",
          mr: "स्वतंत्र दुहेरी सायकल व पदचारी मार्ग",
        },
      },
    ],
    votedOptionId: null,
  },
  {
    id: "poll-2",
    categoryKey: "cat_sanitation",
    ward: "Baner / Balewadi",
    endsInDays: 5,
    translations: {
      en: {
        question: "Proposed installation of automated solar-powered compactor dustbins across Baner-Balewadi High Street.",
        desc: "Evaluating public support for high-capacity smart waste receptacles to eliminate overflow.",
        category: "Sanitation",
        endsIn: "5 days left",
      },
      hi: {
        question: "बाणेर-बालेवाड़ी हाई स्ट्रीट पर स्वचालित सौर-ऊर्जा संचालित कॉम्पेक्टर कूड़ेदान लगाने का प्रस्ताव।",
        desc: "कचरा फैलने से रोकने हेतु उच्च क्षमता वाले स्मार्ट कूड़ेदानों के लिए जनमत मूल्यांकन।",
        category: "स्वच्छता",
        endsIn: "5 दिन शेष",
      },
      mr: {
        question: "बाणेर-बालेवाडी हाय स्ट्रीटवर स्वयंचलित सौर-ऊर्जेवर चालणारे कॉम्पॅक्टर कचराकुंडी बसवण्याचा प्रस्ताव.",
        desc: "कचरा ओसंडून वाहणे रोखण्यासाठी उच्च क्षमतेच्या स्मार्ट कचराकुंड्यांसाठी जनमत.",
        category: "स्वच्छता",
        endsIn: "५ दिवस शिल्लक",
      },
    },
    options: [
      {
        id: "opt-2a",
        votes: 531,
        translations: {
          en: "Yes, deploy automated solar compactors immediately",
          hi: "हाँ, स्वचालित सौर कॉम्पेक्टर तुरंत लगाएं",
          mr: "होय, स्वयंचलित सौर कॉम्पॅक्टर त्वरित बसवा",
        },
      },
      {
        id: "opt-2b",
        votes: 142,
        translations: {
          en: "No, increase manual garbage collection frequency instead",
          hi: "नहीं, इसके बजाय नियमित कचरा उठाने के फेरे बढ़ाएं",
          mr: "नाही, त्याऐवजी कचरा उचलण्याच्या फेऱ्या वाढवा",
        },
      },
      {
        id: "opt-2c",
        votes: 98,
        translations: {
          en: "Need pilot testing in one sector first",
          hi: "पहले एक सेक्टर में प्रायोगिक परीक्षण (पायलट) करें",
          mr: "आधी एका भागात प्रायोगिक तत्त्वावर चाचणी करावी",
        },
      },
    ],
    votedOptionId: "opt-2a",
  },
  {
    id: "poll-3",
    categoryKey: "cat_traffic",
    ward: "Shivajinagar",
    endsInDays: 1,
    translations: {
      en: {
        question: "Night-time civic maintenance work (11 PM - 5 AM) for major road repairs on FC Road & JM Road.",
        desc: "To reduce peak-hour traffic jams during drainage desilting and asphalt milling.",
        category: "Traffic & Roads",
        endsIn: "1 day left",
      },
      hi: {
        question: "एफसी रोड व जेएम रोड पर सड़क मरम्मत हेतु रात्रि कालीन कार्य (रात 11 बजे - सुबह 5 बजे)।",
        desc: "जल निकासी सफाई व डामरीकरण के दौरान व्यस्त समय के ट्रैफिक जाम को कम करने हेतु।",
        category: "यातायात व सड़क",
        endsIn: "1 दिन शेष",
      },
      mr: {
        question: "एफसी रोड व जेएम रोडवरील प्रमुख दुरुस्तीसाठी रात्रीच्या वेळी नागरी देखभाल कार्य (रात्री ११ ते सकाळी ५).",
        desc: "गटार उपसा व डांबरीकरणाच्या वेळी गर्दीच्या वेळेतील वाहतूक कोंडी टाळण्यासाठी.",
        category: "वाहतूक व रस्ते",
        endsIn: "१ दिवस शिल्लक",
      },
    },
    options: [
      {
        id: "opt-3a",
        votes: 780,
        translations: {
          en: "Support night work (with low-noise machinery)",
          hi: "रात्रि कार्य का समर्थन करें (कम ध्वनि वाले उपकरणों के साथ)",
          mr: "रात्रीच्या कामाचे समर्थन (कमी आवाजाची यंत्रे वापरून)",
        },
      },
      {
        id: "opt-3b",
        votes: 110,
        translations: {
          en: "Oppose night work due to residential noise",
          hi: "आवासीय क्षेत्रों में शोर के कारण रात्रि कार्य का विरोध करें",
          mr: "निवासी भागात आवाजाचा त्रास होत असल्याने रात्रीच्या कामास विरोध",
        },
      },
    ],
    votedOptionId: null,
  },
];

export default function VotingSystem() {
  const { t, language } = useLanguage();
  const { recordVoteBonus } = useApp();
  const langKey = language || "en";
  const [polls, setPolls] = useState(LOCALIZED_POLLS);
  const [tab, setTab] = useState("browse"); // browse | create | analytics
  const [createdSuccess, setCreatedSuccess] = useState("");

  // Create Poll Form State
  const [question, setQuestion] = useState("");
  const [desc, setDesc] = useState("");
  const [ward, setWard] = useState("Wagholi, Pune");
  const [options, setOptions] = useState(["", "", ""]);

  const totalVotesCast = polls.reduce(
    (acc, p) => acc + p.options.reduce((sum, o) => sum + o.votes, 0),
    0
  );

  function handleVote(pollId, optionId) {
    const targetPoll = polls.find((p) => p.id === pollId);
    const isFirstVote = !targetPoll?.votedOptionId;

    setPolls((prev) =>
      prev.map((p) => {
        if (p.id !== pollId) return p;
        if (p.votedOptionId === optionId) return p; // already voted for this option

        const updatedOptions = p.options.map((opt) => {
          if (opt.id === optionId) return { ...opt, votes: opt.votes + 1 };
          if (opt.id === p.votedOptionId) return { ...opt, votes: Math.max(0, opt.votes - 1) };
          return opt;
        });

        return { ...p, options: updatedOptions, votedOptionId: optionId };
      })
    );

    if (isFirstVote && recordVoteBonus) {
      const pollTitle = targetPoll?.translations?.[langKey]?.question || "Community Project Ballot";
      recordVoteBonus(pollTitle.slice(0, 40) + "...");
    }
  }

  function handleAddOptionField() {
    if (options.length < 5) setOptions([...options, ""]);
  }

  function handleOptionChange(index, value) {
    const next = [...options];
    next[index] = value;
    setOptions(next);
  }

  function handleCreatePoll(e) {
    e.preventDefault();
    const validOptions = options.filter((o) => o.trim().length > 0);
    if (!question.trim() || validOptions.length < 2) {
      alert("Please provide a question and at least 2 options.");
      return;
    }

    const newPoll = {
      id: `poll-${Date.now()}`,
      categoryKey: "cat_all",
      ward: ward.trim() || "Pune District",
      endsInDays: 7,
      translations: {
        en: {
          question: question.trim(),
          desc: desc.trim() || "Community proposed civic issue for ward prioritization.",
          category: "Community Proposal",
          endsIn: "7 days left",
        },
        hi: {
          question: question.trim(),
          desc: desc.trim() || "नागरिक द्वारा प्रस्तुत वार्ड सुधार प्रस्ताव।",
          category: "सामुदायिक प्रस्ताव",
          endsIn: "7 दिन शेष",
        },
        mr: {
          question: question.trim(),
          desc: desc.trim() || "नागरिकाने मांडलेला प्रभाग सुधारणा प्रस्ताव.",
          category: "सामुदायिक प्रस्ताव",
          endsIn: "७ दिवस शिल्लक",
        },
      },
      options: validOptions.map((text, i) => ({
        id: `opt-new-${Date.now()}-${i}`,
        votes: 1, // creator vote
        translations: {
          en: text.trim(),
          hi: text.trim(),
          mr: text.trim(),
        },
      })),
      votedOptionId: `opt-new-${Date.now()}-0`,
    };

    setPolls([newPoll, ...polls]);
    setQuestion("");
    setDesc("");
    setOptions(["", "", ""]);
    setCreatedSuccess(t("vote_success_msg"));
    setTab("browse");
    setTimeout(() => setCreatedSuccess(""), 4000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900 flex items-center gap-2">
            <Vote className="text-marigold-600" size={24} />
            {t("vote_title")}
          </h1>
          <p className="text-sm text-slate2 mt-1">{t("vote_sub")}</p>
        </div>
      </div>

      {createdSuccess && (
        <div className="p-3.5 rounded-xl bg-moss-600/10 border border-moss-600/30 text-moss-700 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-moss-600" />
          <span>{createdSuccess}</span>
        </div>
      )}

      {/* Metric Badges */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white border border-ink-100 rounded-2xl p-5 shadow-2xs">
          <p className="text-xs text-slate2 font-medium">{t("vote_stat_active")}</p>
          <p className="font-display text-3xl font-semibold text-ink-900 mt-1">{polls.length}</p>
        </div>
        <div className="bg-white border border-ink-100 rounded-2xl p-5 shadow-2xs">
          <p className="text-xs text-slate2 font-medium">{t("vote_stat_total")}</p>
          <p className="font-display text-3xl font-semibold text-marigold-700 mt-1">
            {totalVotesCast.toLocaleString()}
          </p>
        </div>
        <div className="bg-white border border-ink-100 rounded-2xl p-5 shadow-2xs">
          <p className="text-xs text-slate2 font-medium">{t("vote_stat_engagement")}</p>
          <p className="font-display text-3xl font-semibold text-moss-700 mt-1">88.4%</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-ink-100 pb-1">
        <button
          onClick={() => setTab("browse")}
          className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            tab === "browse"
              ? "bg-ink-900 text-paper font-semibold shadow-xs"
              : "text-slate2 hover:text-ink-900 hover:bg-ink-50"
          }`}
        >
          {t("vote_tab_browse")} ({polls.length})
        </button>
        <button
          onClick={() => setTab("create")}
          className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            tab === "create"
              ? "bg-ink-900 text-paper font-semibold shadow-xs"
              : "text-slate2 hover:text-ink-900 hover:bg-ink-50"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <PlusCircle size={13} /> {t("vote_tab_create")}
          </span>
        </button>
        <button
          onClick={() => setTab("analytics")}
          className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            tab === "analytics"
              ? "bg-ink-900 text-paper font-semibold shadow-xs"
              : "text-slate2 hover:text-ink-900 hover:bg-ink-50"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <BarChart3 size={13} /> {t("vote_tab_analytics")}
          </span>
        </button>
      </div>

      {/* Browse Polls Tab */}
      {tab === "browse" && (
        <div className="space-y-5">
          {polls.map((poll) => {
            const pollTotalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
            const pTrans = poll.translations?.[langKey] || poll.translations?.en || {};
            const questionText = pTrans.question || poll.question;
            const descText = pTrans.desc || poll.desc;
            const categoryText = pTrans.category || poll.category;
            const endsInText = pTrans.endsIn || poll.endsIn;

            return (
              <div
                key={poll.id}
                className="bg-white border border-ink-100 rounded-2xl p-6 shadow-2xs space-y-4"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-marigold-50 text-marigold-800 border border-marigold-200">
                        {categoryText}
                      </span>
                      <span className="text-[11px] text-slate2 font-mono flex items-center gap-1">
                        <MapPin size={11} /> {poll.ward}
                      </span>
                      <span className="text-[11px] text-slate2 font-mono flex items-center gap-1">
                        <Clock size={11} /> {endsInText}
                      </span>
                    </div>
                    <h3 className="font-display font-semibold text-base text-ink-900">
                      {questionText}
                    </h3>
                    <p className="text-xs text-slate2 leading-relaxed">{descText}</p>
                  </div>

                  <div className="text-right shrink-0 font-mono text-xs text-slate2">
                    <span className="font-bold text-ink-900">{pollTotalVotes.toLocaleString()}</span>{" "}
                    {t("vote_votes_total")}
                  </div>
                </div>

                {/* Poll Options & Live Voting */}
                <div className="space-y-2.5 pt-2">
                  {poll.options.map((opt) => {
                    const percent =
                      pollTotalVotes > 0 ? Math.round((opt.votes / pollTotalVotes) * 100) : 0;
                    const isSelected = poll.votedOptionId === opt.id;
                    const optText = opt.translations?.[langKey] || opt.translations?.en || opt.text;

                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleVote(poll.id, opt.id)}
                        className={`w-full relative text-left p-3.5 rounded-xl border transition-all overflow-hidden cursor-pointer ${
                          isSelected
                            ? "border-marigold-400 bg-marigold-50/40 shadow-xs"
                            : "border-ink-100 hover:border-ink-300 bg-white"
                        }`}
                      >
                        {/* Animated Percentage Fill Bar */}
                        <div
                          className={`absolute top-0 bottom-0 left-0 transition-all duration-500 rounded-xl ${
                            isSelected ? "bg-marigold-200/50" : "bg-ink-100/40"
                          }`}
                          style={{ width: `${percent}%` }}
                        />

                        <div className="relative z-10 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5 font-medium text-ink-900">
                            <span
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? "border-marigold-600 bg-marigold-600 text-white"
                                  : "border-ink-300 bg-white"
                              }`}
                            >
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                            <span>{optText}</span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 font-mono font-semibold">
                            <span className="text-slate2 font-normal text-[11px]">
                              {opt.votes} {t("vote_votes_total")}
                            </span>
                            <span className="text-ink-900 text-xs w-9 text-right">{percent}%</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Poll Tab */}
      {tab === "create" && (
        <div className="max-w-2xl bg-white border border-ink-100 rounded-2xl p-6 shadow-2xs">
          <h2 className="font-display font-semibold text-lg text-ink-900 mb-1">
            {t("vote_create_title")}
          </h2>
          <p className="text-xs text-slate2 mb-6">
            {t("vote_sub")}
          </p>

          <form onSubmit={handleCreatePoll} className="space-y-4">
            <div>
              <label className="text-xs font-mono uppercase tracking-wide text-slate2 block mb-1 font-semibold">
                {t("vote_create_question")} *
              </label>
              <input
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. Should Ward 12 construct a pedestrian footbridge near PCMC station?"
                className="w-full px-4 py-2.5 rounded-xl border border-ink-100 text-xs focus:border-marigold-400 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-wide text-slate2 block mb-1 font-semibold">
                {t("vote_create_desc")}
              </label>
              <textarea
                rows={2}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Provide context on why this project is important for local residents..."
                className="w-full px-4 py-2 rounded-xl border border-ink-100 text-xs focus:border-marigold-400 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-wide text-slate2 block mb-1 font-semibold">
                {t("vote_create_ward")}
              </label>
              <input
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                placeholder="e.g. Wagholi, Baner, Shivajinagar..."
                className="w-full px-4 py-2 rounded-xl border border-ink-100 text-xs focus:border-marigold-400 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-wide text-slate2 block mb-2 font-semibold">
                {t("vote_create_options")} (Min 2, Max 5)
              </label>
              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <input
                    key={idx}
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    className="w-full px-3.5 py-2 rounded-xl border border-ink-100 text-xs focus:border-marigold-400 outline-none"
                  />
                ))}
              </div>
              {options.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddOptionField}
                  className="mt-2 text-xs text-marigold-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle size={12} /> Add another option
                </button>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-ink-900 text-paper text-xs font-semibold hover:bg-ink-700 transition-colors shadow-sm mt-4 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send size={13} /> {t("vote_create_btn")}
            </button>
          </form>
        </div>
      )}

      {/* Analytics Tab */}
      {tab === "analytics" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border border-ink-100 rounded-2xl p-5 shadow-2xs">
              <h3 className="font-display font-semibold text-sm text-ink-900 mb-4">
                Voting Participation by Category
              </h3>
              <div className="space-y-3">
                {[
                  { name: t("cat_infrastructure"), share: 44, color: "#C1443A" },
                  { name: t("cat_sanitation"), share: 32, color: "#4C7A5E" },
                  { name: t("cat_traffic"), share: 24, color: "#3D4C6B" },
                ].map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-ink-900">
                      <span>{item.name}</span>
                      <span>{item.share}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.share}%`, background: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-ink-100 rounded-2xl p-5 shadow-2xs">
              <h3 className="font-display font-semibold text-sm text-ink-900 mb-4">
                Top Participating Wards
              </h3>
              <ul className="divide-y divide-ink-100 text-xs">
                <li className="py-2.5 flex items-center justify-between">
                  <span className="font-medium text-ink-900">Ward 14 (Wagholi - Kharadi)</span>
                  <span className="font-mono text-moss-700 font-semibold">1,234 {t("vote_votes_total")}</span>
                </li>
                <li className="py-2.5 flex items-center justify-between">
                  <span className="font-medium text-ink-900">Ward 08 (Baner - Balewadi)</span>
                  <span className="font-mono text-moss-700 font-semibold">771 {t("vote_votes_total")}</span>
                </li>
                <li className="py-2.5 flex items-center justify-between">
                  <span className="font-medium text-ink-900">Ward 03 (Shivajinagar)</span>
                  <span className="font-mono text-moss-700 font-semibold">890 {t("vote_votes_total")}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
