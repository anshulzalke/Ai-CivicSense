import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bot,
  X,
  Minus,
  Send,
  Sparkles,
  ExternalLink,
  Siren,
  FilePlus2,
  Search,
  Vote,
  Map,
  ArrowRight,
} from "lucide-react";

import { useApp } from "../context/AppContext";
import { useLanguage } from "../context/LanguageContext";
import { deriveEscalation } from "../lib/logic";
import StatusPill from "./StatusPill";

export default function AIChatbotWidget() {
  const { complaints } = useApp();
  const { language, t, getStatusLabel, getCategoryLabel } = useLanguage();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize welcome message whenever language starts
  useEffect(() => {
    setMessages([
      {
        id: "welcome-1",
        sender: "bot",
        text: t("chat_welcome"),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actions: [
          { label: "File Complaint", path: "/citizen/file", icon: FilePlus2 },
          { label: "Track Token", path: "/citizen/track", icon: Search },
          { label: "Live Map", path: "/issue-map", icon: Map },
          { label: "Emergency SOS", path: "/sos", icon: Siren },
        ],
      },
    ]);
  }, [language, t]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  function classifyAndRespond(userQuery) {
    const q = userQuery.toLowerCase().trim();

    // 1. Check for Token ID pattern: CVX-... or 6 digit number
    const tokenMatch = userQuery.match(/CVX-\d{4}-\d{6}/i) || userQuery.match(/CVX-[\w-]+/i);
    if (tokenMatch) {
      const token = tokenMatch[0].toUpperCase();
      const match = complaints.find((c) => c.token.toUpperCase() === token);
      if (match) {
        const { effectiveStatus, effectiveLevel } = deriveEscalation(match);
        return {
          type: "token_card",
          token: match.token,
          title: match.title,
          category: getCategoryLabel(match.category),
          status: getStatusLabel(effectiveStatus),
          effectiveStatus,
          effectiveLevel,
          severity: match.severity,
          resolutionNote: match.resolutionNote || match.resolution_note,
          imageUrl: match.imageUrl || match.image_url,
          text: `${t("chat_token_found")} ${match.token}:`,
          actions: [
            {
              label: `Open ${match.token} in Tracker`,
              path: `/citizen/track?token=${match.token}`,
              icon: ExternalLink,
            },
          ],
        };
      } else {
        return {
          type: "text",
          text:
            language === "hi"
              ? `टोकन ${token} का रिकॉर्ड स्थानीय सूची में नहीं मिला। आप नीचे दिए गए बटन से Track Complaint पेज पर विस्तृत खोज कर सकते हैं।`
              : language === "mr"
              ? `टोकन ${token} ची नोंद सापडली नाही. खालील बटणावर क्लिक करून थेट ट्रॅकर पानावर शोधा.`
              : `Token ${token} was not found in active records. You can perform an in-depth lookup using the Track a Token page.`,
          actions: [{ label: "Open Track a Token", path: "/citizen/track", icon: Search }],
        };
      }
    }

    // 2. Intent: Navigate / Go to SOS Page (e.g. "how to visit sos", "go to sos page", "open sos", "where is sos")
    const isSosNavigation =
      (q.includes("sos") || q.includes("emergency")) &&
      (q.includes("go to") ||
        q.includes("visit") ||
        q.includes("navigate") ||
        q.includes("open") ||
        q.includes("where") ||
        q.includes("page") ||
        q.includes("route") ||
        q.includes("kahan") ||
        q.includes("kase") ||
        q.includes("jaaye") ||
        q.includes("jave") ||
        q.includes("kaise jaye") ||
        q.includes("link"));

    if (isSosNavigation) {
      if (language === "hi") {
        return {
          type: "text",
          text: "🚨 **Emergency SOS पेज पर जाने के निर्देश:**\n1. आप साइडबार या टॉप नेविगेशन बार में **'🚨 Emergency SOS'** लिंक पर क्लिक कर सकते हैं।\n2. या सीधे नीचे दिए गए बटन पर क्लिक करके तुरंत SOS पोर्टल खोल सकते हैं।\n\nइस पेज पर आपको लाइव डिजिटल क्लॉक, आपका GPS स्थान और 11 आपातकालीन हेल्पलाइन नंबर मिलेंगे।",
          actions: [{ label: "🚨 Go to Emergency SOS Page", path: "/sos", icon: Siren }],
        };
      }
      if (language === "mr") {
        return {
          type: "text",
          text: "🚨 **Emergency SOS पानावर जाण्यासाठी सूचना:**\n१. डाव्या मेनू किंवा वर नेव्हिगेशन बारमधील **'🚨 Emergency SOS'** बटणावर क्लिक करा.\n२. किंवा खालील थेट बटणावर क्लिक करून तात्काळ SOS केंद्र उघडा.\n\nयेथे तुम्हाला थेट GPS लोकेशन, घड्याळ आणि ११ आपत्कालीन हेल्पलाइन नंबर मिळतील.",
          actions: [{ label: "🚨 Go to Emergency SOS Page", path: "/sos", icon: Siren }],
        };
      }
      return {
        type: "text",
        text: "🚨 **Navigating to the Emergency SOS Page:**\n• You can click the **'Emergency SOS'** item in the sidebar navigation or top header.\n• Or click the direct shortcut button below to launch the 24/7 Distress Center.\n\nThis page provides live GPS coordinates, an emergency clock, and 1-click calling for 11 national helplines.",
        actions: [{ label: "🚨 Open Emergency SOS Page", path: "/sos", icon: Siren }],
      };
    }

    // 3. Intent: Emergency Helpline Numbers & Contacts (e.g. "sos numbers", "police number", "ambulance number")
    const isHelplineNumbers =
      q.includes("helpline") ||
      q.includes("number") ||
      q.includes("contact") ||
      q.includes("police") ||
      q.includes("ambulance") ||
      q.includes("fire brigade") ||
      q.includes("100") ||
      q.includes("108") ||
      q.includes("101") ||
      q.includes("नंबर") ||
      q.includes("संपर्क") ||
      q.includes("हेल्पलाइन");

    if (isHelplineNumbers && (q.includes("sos") || q.includes("emergency") || q.includes("police") || q.includes("ambulance") || q.includes("helpline"))) {
      if (language === "hi") {
        return {
          type: "text",
          text: "🚨 **प्रमुख राष्ट्रीय व म्युनिसिपल आपातकालीन नंबर:**\n• पुलिस आपातकाल (Police): **100**\n• एम्बुलेंस / मेडिकल (Ambulance): **108**\n• अग्निशामक (Fire Brigade): **101**\n• महिला सुरक्षा हेल्पलाइन: **1091**\n• राष्ट्रीय आपदा मोचन बल (NDRF): **1078**\n• गैस रिसाव हेल्पलाइन: **1906**\n\n1-क्लिक कॉलिंग और जीपीएस शेयरिंग के लिए नीचे बटन दबाएं:",
          actions: [
            { label: "🚨 Open Full Emergency Directory", path: "/sos", icon: Siren },
          ],
        };
      }
      if (language === "mr") {
        return {
          type: "text",
          text: "🚨 **महत्त्वाचे राष्ट्रीय व महापालिका आपत्कालीन संपर्क:**\n• पोलीस नियंत्रण कक्ष (Police): **१००**\n• रुग्णवाहिका / वैद्यकीय (Ambulance): **१०८**\n• अग्निशामक दल (Fire Brigade): **१०१**\n• महिला सुरक्षा हेल्पलाइन: **१०९१**\n• आपत्ती निवारण (NDRF): **१०७८**\n• गॅस गळती हेल्पलाइन: **१९०६**\n\nथेट १-क्लिक कॉलसाठी खालील बटण दाबा:",
          actions: [
            { label: "🚨 Open Full Emergency Directory", path: "/sos", icon: Siren },
          ],
        };
      }
      return {
        type: "text",
        text: "🚨 **National & Municipal Emergency Directory:**\n• Police Emergency: **100**\n• Medical Ambulance: **108**\n• Fire & Rescue: **101**\n• Women's Helpline: **1091**\n• Disaster Relief (NDRF): **1078**\n• Gas Leak Emergency: **1906**\n\nFor 1-click calling, GPS pinpointing, and safe-word alerts, open the SOS portal:",
        actions: [
          { label: "🚨 Open Emergency SOS Directory", path: "/sos", icon: Siren },
        ],
      };
    }

    // 4. Intent: How to File a Complaint / Report an Issue
    const isFilingQuery =
      q.includes("file") ||
      q.includes("report") ||
      q.includes("lodge") ||
      q.includes("submit") ||
      q.includes("shikayat") ||
      q.includes("takrar") ||
      q.includes("nond") ||
      q.includes("darj") ||
      q.includes("pothole") ||
      q.includes("garbage") ||
      q.includes("drainage");

    if (isFilingQuery && (q.includes("how") || q.includes("kaise") || q.includes("kase") || q.includes("file") || q.includes("report") || q.includes("new"))) {
      if (language === "hi") {
        return {
          type: "text",
          text: "📝 **शिकायत दर्ज करने की प्रक्रिया (3 आसान चरण):**\n1. **फोटो अपलोड करें**: समस्या (गड्ढे, कचरा, ड्रेनेज) की स्पष्ट फोटो खींचें या चुनें।\n2. **AI वर्गीकरण**: AI स्वचालित रूप से गंभीरता (Severity Level 1-5) तय करता है।\n3. **सबमिट करें**: सबमिट करते ही आपको एक यूनीक **Token ID** (जैसे `CVX-2026-XXXXXX`) प्राप्त होगा और 48 घंटे का SLA टाइमर शुरू हो जाएगा।",
          actions: [{ label: "📝 File a New Complaint", path: "/citizen/file", icon: FilePlus2 }],
        };
      }
      if (language === "mr") {
        return {
          type: "text",
          text: "📝 **तक्रार नोंदणी प्रक्रिया (३ सोपे टप्पे):**\n१. **फोटो जोडा**: रस्त्यावरील खड्डा, कचरा किंवा ड्रेनेजचा स्पष्ट फोटो घ्या.\n२. **AI वर्गीकरण**: AI तात्काळ गांभीर्य स्तर (Severity 1-5) निश्चित करते.\n३. **नोंदणी पूर्ण करा**: सबमिट केल्यावर तुम्हाला **Token ID** (उदा. `CVX-2026-XXXXXX`) मिळेल आणि ४८ तासांचा SLA सुरू होईल.",
          actions: [{ label: "📝 File a New Complaint", path: "/citizen/file", icon: FilePlus2 }],
        };
      }
      return {
        type: "text",
        text: "📝 **How to File a Complaint in 3 Steps:**\n1. **Capture/Upload Photo**: Upload photo evidence of the pothole, garbage overflow, or drainage issue.\n2. **AI Classification**: AI analyzes the image to determine department routing and severity score (1-5).\n3. **Submit & Receive Token**: You will immediately receive a **Token ID** (e.g. `CVX-2026-XXXXXX`) with 48h SLA monitoring.",
        actions: [{ label: "📝 File a New Complaint", path: "/citizen/file", icon: FilePlus2 }],
      };
    }

    // 5. Intent: How to Track / Where is my complaint token
    const isTrackingQuery =
      q.includes("track") ||
      q.includes("token") ||
      q.includes("where is") ||
      q.includes("check status") ||
      q.includes("progress") ||
      q.includes("ट्रैक") ||
      q.includes("स्थिति") ||
      q.includes("प्रगती");

    if (isTrackingQuery) {
      if (language === "hi") {
        return {
          type: "text",
          text: "🔍 **शिकायत ट्रैक करने के 2 तरीके:**\n• अपना टोकन नंबर (जैसे `CVX-2026-000101`) सीधे इस चैट में लिखकर भेजें।\n• या नीचे दिए गए **Track Complaint** बटन पर जाकर 5-चरणीय प्रगति (Submitted $\\to$ In Progress $\\to$ Escalated $\\to$ Awaiting Validation $\\to$ Closed) देखें।",
          actions: [{ label: "🔍 Open Complaint Tracker", path: "/citizen/track", icon: Search }],
        };
      }
      if (language === "mr") {
        return {
          type: "text",
          text: "🔍 **तक्रार ट्रॅक करण्याचे २ पर्याय:**\n• तुमचा टोकन क्रमांक (उदा. `CVX-2026-000101`) थेट या चॅटमध्ये टाईप करा.\n• किंवा खालील **Track Complaint** बटणावर जाऊन ५-टप्प्यांची थेट स्थिती तपासा.",
          actions: [{ label: "🔍 Open Complaint Tracker", path: "/citizen/track", icon: Search }],
        };
      }
      return {
        type: "text",
        text: "🔍 **Tracking Your Grievance Status:**\n• Enter your Token ID (e.g. `CVX-2026-000101`) directly in this chat for instant lookup.\n• Or click the button below to view the full lifecycle progress, photos, and officer notes.",
        actions: [{ label: "🔍 Open Complaint Tracker", path: "/citizen/track", icon: Search }],
      };
    }

    // 6. Intent: Community Voting & Polls
    const isVotingQuery =
      q.includes("vote") ||
      q.includes("voting") ||
      q.includes("poll") ||
      q.includes("proposal") ||
      q.includes("मतदान") ||
      q.includes("पोल");

    if (isVotingQuery) {
      if (language === "hi") {
        return {
          type: "text",
          text: "🗳️ **सामुदायिक मतदान प्रणाली (Community Voting):**\nनागरिक अपने वार्ड के इंफ्रास्ट्रक्चर, सफाई व विकास प्रस्तावों पर वोट दे सकते हैं और अपना नया पोल भी बना सकते हैं।\nनीचे दिए गए बटन से सामुदायिक मतदान केंद्र खोलें:",
          actions: [{ label: "🗳️ Open Community Voting", path: "/voting-system", icon: Vote }],
        };
      }
      if (language === "mr") {
        return {
          type: "text",
          text: "🗳️ **सामुदायिक मतदान प्रणाली (Community Voting):**\nनागरिक परिसरातील विकास कामांवर आणि बजेट प्राधान्यक्रमावर थेट मतदान करू शकतात.\nमतदान करण्यासाठी खालील बटण दाबा:",
          actions: [{ label: "🗳️ Open Community Voting", path: "/voting-system", icon: Vote }],
        };
      }
      return {
        type: "text",
        text: "🗳️ **Community Voting & Civic Polls:**\nParticipate in democratic budget prioritization, cast votes on local infrastructure projects, or propose new civic initiatives for your ward.",
        actions: [{ label: "🗳️ Open Community Voting", path: "/voting-system", icon: Vote }],
      };
    }

    // 7. Intent: Live Leaflet / Satellite Map
    const isMapQuery =
      q.includes("map") ||
      q.includes("satellite") ||
      q.includes("geographic") ||
      q.includes("location") ||
      q.includes("नक्शा") ||
      q.includes("नकाशा") ||
      q.includes("मैप");

    if (isMapQuery) {
      if (language === "hi") {
        return {
          type: "text",
          text: "🗺️ **लाइव इंटरएक्टिव मैप व सैटेलाइट व्यू:**\nपुणे जिले के सभी वार्डों की शिकायतें, गड्ढे व जलभराव की स्थिति लाइव मैप पर देखी जा सकती है। आप स्ट्रीट व्यू और सैटेलाइट व्यू में टॉगल भी कर सकते हैं।",
          actions: [{ label: "🗺️ Open Live District Map", path: "/issue-map", icon: Map }],
        };
      }
      if (language === "mr") {
        return {
          type: "text",
          text: "🗺️ **थेट परस्परसंवादी नकाशा व सॅटेलाइट व्ह्यू:**\nपुणे जिल्ह्यातील सर्व प्रभागांमधील तक्रारींचे भौगोलिक दृश्य थेट नकाशावर पहा. स्ट्रीट व सॅटेलाइट व्ह्यू टॉगल उपलब्ध आहे.",
          actions: [{ label: "🗺️ Open Live District Map", path: "/issue-map", icon: Map }],
        };
      }
      return {
        type: "text",
        text: "🗺️ **Interactive District & Satellite Map:**\nExplore real-time civic incidents across Pune district with Category/Status filtering and Street vs. Satellite layer toggle.",
        actions: [{ label: "🗺️ Open Live District Map", path: "/issue-map", icon: Map }],
      };
    }

    // 8. Intent: SLA 48-Hour Auto-Escalation
    if (q.includes("sla") || q.includes("escalat") || q.includes("48") || q.includes("नियम") || q.includes("वेळ")) {
      if (language === "hi") {
        return {
          type: "text",
          text: "⏱️ **48 घंटे का SLA ऑटो-एस्केलेशन नियम:**\n• **Level 1 (0-48h)**: शिकायत दर्ज होते ही संबंधित वार्ड/फील्ड टीम को सौंपी जाती है।\n• **Level 2 (48-96h)**: यदि 48 घंटे तक कोई प्रगति नहीं होती, तो टिकट स्वतः जोनल अधिकारी को एस्केलेट हो जाता है।\n• **Level 3 (96h+)**: अतिरिक्त 48 घंटे बीतने पर सीधे डिवीजनल कमिश्नर व मुख्य प्रशासक को एस्केलेट होता है।",
        };
      }
      if (language === "mr") {
        return {
          type: "text",
          text: "⏱️ **४८ तास SLA ऑटो-एस्केलेशन नियम:**\n• **स्तर १ (०-४८ तास)**: तक्रार थेट प्रभाग फील्ड टीमकडे जाते.\n• **स्तर २ (४८-९६ तास)**: ४८ तासांत कारवाई न झाल्यास आपोआप क्षेत्रीय अधिकाऱ्याकडे एस्केलेट होते.\n• **स्तर ३ (९६+ तास)**: थेट विभागीय आयुक्त व प्रशासकांकडे वर्ग होते.",
        };
      }
      return {
        type: "text",
        text: "⏱️ **48-Hour SLA Auto-Escalation Architecture:**\n• **Level 1 (0–48h)**: Dispatched to ward field engineering teams.\n• **Level 2 (48–96h)**: Automatically escalates to the Zonal Executive Officer if unaddressed.\n• **Level 3 (96h+)**: Escalates directly to the Divisional Municipal Commissioner for supervisory intervention.",
      };
    }

    // 9. Intent: Civic Coins & Validation Rewards
    if (q.includes("coin") || q.includes("reward") || q.includes("सिक्के") || q.includes("नाणी") || q.includes("बक्षीस")) {
      if (language === "hi") {
        return {
          type: "text",
          text: "🪙 **सिविक सिक्के (Civic Coins) व पुरस्कार:**\nजब नगर निगम का अधिकारी आपकी शिकायत का समाधान करता है, तो टिकट सीधे बंद नहीं होता। आपके पास सत्यापन (Validation) की सूचना आती है। जब आप काम की पुष्टि करते हैं, तो आपको **+25 सिक्के** मिलते हैं। इन सिक्कों को आप संपत्ति कर छूट और बस पास में रिडीम कर सकते हैं।",
          actions: [{ label: "🪙 View Rewards Wallet", path: "/citizen/rewards", icon: ExternalLink }],
        };
      }
      if (language === "mr") {
        return {
          type: "text",
          text: "🪙 **सिव्हिक नाणी (Civic Coins) व बक्षिसे:**\nअधिकाऱ्याने काम पूर्ण केल्यावर तुम्हाला पडताळणीची विचारणा होते. तुम्ही समाधानी असल्याचे प्रमाणित केल्यास **+२५ नाणी** मिळतात, जी कर सवलत किंवा पीएमपीएमएल बस पाससाठी रिडीम करता येतात.",
          actions: [{ label: "🪙 View Rewards Wallet", path: "/citizen/rewards", icon: ExternalLink }],
        };
      }
      return {
        type: "text",
        text: "🪙 **Civic Coins & Validation Rewards:**\nWhen an official resolves your ticket, you validate the fix with a 1-click confirmation. Validating awards you **+25 Civic Coins**, which can be redeemed for property tax rebates and municipal transit vouchers.",
        actions: [{ label: "🪙 View Rewards Wallet", path: "/citizen/rewards", icon: ExternalLink }],
      };
    }

    // 10. Context-Aware Fallback (Synthesizes specific query response based on detected keywords)
    let dynamicSummary = "";
    if (q.includes("pothole") || q.includes("road") || q.includes("सड़क") || q.includes("खड्डा")) {
      dynamicSummary =
        language === "hi"
          ? "सड़क और गड्ढों की शिकायतें सीधे पीडब्ल्यूडी/रोड मेंटेनेंस विंग को 48 घंटे के SLA के साथ भेजी जाती हैं।"
          : language === "mr"
          ? "रस्त्यावरील खड्ड्यांच्या तक्रारी थेट रस्ते देखभाल विभागाकडे ४८ तासांच्या SLA सह पाठवल्या जातात."
          : "Pothole and road repair grievances are routed directly to the Road Infrastructure division with automated 48h SLA tracking.";
    } else if (q.includes("garbage") || q.includes("waste") || q.includes("कचरा")) {
      dynamicSummary =
        language === "hi"
          ? "कचरा और सफाई की शिकायतें सॉलिड वेस्ट मैनेजमेंट विभाग को रियल-टाइम जीपीएस के साथ भेजी जाती हैं।"
          : language === "mr"
          ? "कचरा व स्वच्छता तक्रारी थेट घनकचरा व्यवस्थापन विभागाकडे रिअल-टाइम जीपीएस सह पाठवल्या जातात."
          : "Garbage overflow complaints are assigned to the Solid Waste Management field team with GPS tracking.";
    } else if (q.includes("drainage") || q.includes("water") || q.includes("पानी") || q.includes("पाणी")) {
      dynamicSummary =
        language === "hi"
          ? "ड्रेनेज और जलभराव की शिकायतें ड्रेनेज व सीवरेज बोर्ड को उच्च प्राथमिकता के साथ भेजी जाती हैं।"
          : language === "mr"
          ? "ड्रेनेज व सांडपाण्याच्या तक्रारी जलनिस्सारण विभागाकडे उच्च प्राधान्याने पाठवल्या जातात."
          : "Drainage and waterlogging grievances are prioritized for the Municipal Sewerage & Stormwater team.";
    } else {
      dynamicSummary =
        language === "hi"
          ? "सिविकसेंस पुणे जिले में नागरिक शिकायतों के त्वरित समाधान, पारदर्शी ट्रैकिंग और सामुदायिक विकास का आधुनिक मंच है।"
          : language === "mr"
          ? "सिव्हिकसेन्स हे पुणे जिल्ह्यातील नागरी समस्यांचे जलद निवारण व पारदर्शक ट्रॅकिंगसाठीचे व्यासपीठ आहे."
          : "CivicSense is Pune district's automated platform for grievance redressal, SLA auto-escalation, and community governance.";
    }

    return {
      type: "text",
      text: `${dynamicSummary}\n\n${
        language === "hi"
          ? "आप नीचे दिए गए त्वरित विकल्पों में से किसी एक को चुन सकते हैं:"
          : language === "mr"
          ? "आपण खालील पर्यायांमधून थेट निवड करू शकता:"
          : "You can explore the key sections below or type your Token ID:"
      }`,
      actions: [
        { label: "File a Complaint", path: "/citizen/file", icon: FilePlus2 },
        { label: "Track a Token", path: "/citizen/track", icon: Search },
        { label: "Live Incident Map", path: "/issue-map", icon: Map },
        { label: "Emergency SOS", path: "/sos", icon: Siren },
      ],
    };
  }

  function handleSend(textToSend) {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = classifyAndRespond(query.trim());
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        ...response,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 500);
  }

  function handleActionClick(action) {
    if (action.path) {
      navigate(action.path);
      // Minimize on mobile to give user visibility
      if (window.innerWidth < 640) {
        setIsMinimized(true);
      }
    }
  }

  const promptChips = [
    { label: t("chat_prompt_track"), query: "How to track a complaint?" },
    { label: t("chat_prompt_sla"), query: "What is the 48h SLA?" },
    { label: t("chat_prompt_coins"), query: "How do Civic Coins work?" },
    { label: "How to visit SOS page?", query: "How to go to SOS page?" },
    { label: t("chat_prompt_sos"), query: "Emergency SOS helpline numbers" },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Slide-Up Interactive Chat Window */}
      {isOpen && (
        <div
          className={`w-[92vw] sm:w-[400px] bg-white border border-ink-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200 mb-3 ${
            isMinimized ? "h-14" : "h-[560px] max-h-[84vh]"
          }`}
        >
          {/* Header */}
          <div className="bg-ink-900 text-paper px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-marigold-400 text-ink-900 flex items-center justify-center font-bold text-sm shadow-xs">
                <Bot size={18} />
              </div>
              <div>
                <p className="font-display font-semibold text-sm leading-tight flex items-center gap-1.5">
                  {t("chat_bot_title")}
                  <span className="w-2 h-2 rounded-full bg-moss-400 animate-pulse" />
                </p>
                <p className="text-[10px] text-marigold-300/90 font-mono">
                  {t("chat_bot_subtitle")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 rounded-md text-ink-300 hover:text-paper hover:bg-white/10 transition-colors cursor-pointer"
                title={isMinimized ? "Expand" : "Minimize"}
                aria-label="Minimize Chatbot"
              >
                <Minus size={15} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-ink-300 hover:text-paper hover:bg-white/10 transition-colors cursor-pointer"
                title="Close"
                aria-label="Close Chatbot"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Message List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 thin-scroll bg-[#FAF9F5]">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-ink-900 text-paper rounded-br-xs"
                          : "bg-white text-ink-900 border border-ink-100 rounded-bl-xs"
                      }`}
                    >
                      {msg.text && (
                        <div className="whitespace-pre-line">
                          {msg.text.split("\n").map((line, idx) => (
                            <p key={idx} className={idx > 0 ? "mt-1" : ""}>
                              {line.startsWith("•") || line.startsWith("1.") || line.startsWith("2.") || line.startsWith("3.") ? (
                                <span className="font-medium text-ink-900">{line}</span>
                              ) : (
                                line
                              )}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Token Lookup Live Card */}
                      {msg.type === "token_card" && (
                        <div className="mt-2.5 pt-2.5 border-t border-ink-100 bg-ink-50/50 p-2.5 rounded-xl text-left">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-mono font-bold text-ink-900 text-xs">
                              {msg.token}
                            </span>
                            <StatusPill status={msg.effectiveStatus} />
                          </div>
                          <p className="font-medium text-ink-900 text-xs mb-1">{msg.title}</p>
                          <div className="flex items-center justify-between text-[10px] text-slate2 mt-1">
                            <span>{msg.category}</span>
                            <span>Level {msg.severity} Severity</span>
                          </div>
                          {msg.resolutionNote && (
                            <p className="mt-1.5 text-[10px] text-moss-700 bg-moss-50 p-1.5 rounded border border-moss-200">
                              Note: {msg.resolutionNote}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Actionable Quick-Buttons inside message */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="mt-2.5 pt-2.5 border-t border-ink-100/70 flex flex-wrap gap-1.5">
                          {msg.actions.map((act, i) => (
                            <button
                              key={i}
                              onClick={() => handleActionClick(act)}
                              className="px-2.5 py-1.5 rounded-lg bg-ink-900 hover:bg-ink-700 text-paper text-[11px] font-medium flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                            >
                              {act.icon && <act.icon size={12} className="text-marigold-400" />}
                              <span>{act.label}</span>
                              <ArrowRight size={10} className="opacity-70" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-slate2 mt-1 px-1 font-mono">{msg.timestamp}</span>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-1 bg-white border border-ink-100 rounded-xl px-3 py-2 text-xs text-slate2 w-fit shadow-2xs">
                    <Sparkles size={12} className="text-marigold-600 animate-spin" />
                    <span>CivicSense AI is thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div className="px-3 py-2 bg-white border-t border-ink-100 flex items-center gap-1.5 overflow-x-auto thin-scroll">
                {promptChips.map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(chip.query)}
                    className="whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-medium bg-ink-50 hover:bg-marigold-50 text-slate2 hover:text-marigold-800 border border-ink-100 transition-colors cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="p-2.5 bg-white border-t border-ink-100 flex items-center gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t("chat_input_placeholder")}
                  className="flex-1 px-3 py-2 rounded-xl border border-ink-200 text-xs focus:border-marigold-400 outline-none font-sans"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-8 h-8 rounded-xl bg-ink-900 text-paper flex items-center justify-center hover:bg-ink-700 disabled:opacity-40 transition-all shrink-0 cursor-pointer"
                  aria-label="Send Message"
                >
                  <Send size={13} />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 pl-4 pr-4 py-3 rounded-full bg-ink-900 text-paper border-2 border-marigold-400 shadow-2xl hover:bg-ink-800 hover:scale-105 transition-all cursor-pointer"
          aria-label="Open CivicSense AI Assistant"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-marigold-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-marigold-400" />
          </span>
          <Bot size={20} className="text-marigold-400" />
          <span className="font-display font-semibold text-xs tracking-wide">
            {t("chat_bot_title")}
          </span>
        </button>
      )}
    </div>
  );
}
