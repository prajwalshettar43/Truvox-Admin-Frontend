import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion, animate } from "framer-motion";
import {
  Printer,
  MapPin,
  Calendar,
  Hash,
  Users,
  Trophy,
  Vote,
  Activity,
  BarChart3,
  PieChart,
  UserCheck,
  Percent,
  AlertCircle,
  Loader2,
  TrendingUp,
  CheckCircle2,
  GitCommit,
  Bot,
  MessageSquare,
  Send,
  User,
  Zap
} from "lucide-react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;
// TODO: Replace with your actual Groq API Key or use process.env.REACT_APP_GROQ_API_KEY
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY; 

// Available models
const GROQ_MODELS = [
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", description: "Most capable, best for complex analysis" },
  { id: "llama-3.1-70b-versatile", name: "Llama 3.1 70B", description: "Balanced performance" },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", description: "Fastest responses" },
];

// --- Utility Components and Hooks ---

// Animated Counter
const CountUp = ({ end, suffix = "", decimals = 0, duration = 2 }) => {
  const nodeRef = useRef();

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const controls = animate(0, end, {
      duration: duration,
      ease: "easeOut",
      onUpdate: (value) => {
        node.textContent = value.toFixed(decimals) + suffix;
      },
    });

    return () => controls.stop();
  }, [end, duration, decimals, suffix]);

  return <span ref={nodeRef}>0{suffix}</span>;
};

// Glass Card Component
const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl overflow-hidden ${className}`}>
    {children}
  </div>
);

// Vertical Bar for Age Histogram
const HistogramBar = ({ label, value, max, isVoted }) => {
  const heightPercent = Math.max(15, (value / max) * 100);
  
  return (
    <div className="flex flex-col items-center justify-end h-48 w-full group">
      <div className="text-xs font-mono text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
        {value.toLocaleString()}
      </div>
      <motion.div
        initial={{ height: 0 }}
        whileInView={{ height: `${heightPercent}%` }}
        transition={{ duration: 1.5, type: "spring" }}
        className={`w-full ${isVoted ? 'bg-gradient-to-t from-purple-600 to-cyan-500' : 'bg-gradient-to-t from-emerald-600 to-green-500'} rounded-t-sm opacity-80 hover:opacity-100 transition-opacity relative`}
      >
        <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-200/50 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
      </motion.div>
      <div className="mt-2 text-xs text-slate-400 font-medium">{label}</div>
    </div>
  );
};

// Function to process age turnout
const calculateAgeTurnout = (voter_statistics) => {
    if (!voter_statistics?.eligible_age_distribution || !voter_statistics?.voted_age_distribution) return [];
    
    const ageBuckets = ["18-25", "26-40", "41-60", "60+"];
    return ageBuckets.map((bucket) => {
      const eligible = voter_statistics.eligible_age_distribution[bucket] || 0;
      const voted = voter_statistics.voted_age_distribution[bucket] || 0;
      const turnout = eligible > 0 ? ((voted / eligible) * 100).toFixed(1) : '0.0';
      return { bucket, eligible, voted, turnout: parseFloat(turnout) };
    });
};

// Function to process gender turnout
const calculateGenderTurnout = (voter_statistics) => {
    if (!voter_statistics?.eligible_gender_distribution || !voter_statistics?.voted_gender_distribution) return [];
    
    const eligible = voter_statistics.eligible_gender_distribution;
    const voted = voter_statistics.voted_gender_distribution;
    
    const genders = ["male", "female", "other"];
    
    return genders.map(gender => {
        const eligibleCount = eligible[gender] || 0;
        const votedCount = voted[gender] || 0;
        const turnout = eligibleCount > 0 ? ((votedCount / eligibleCount) * 100).toFixed(1) : '0.0';

        return {
            gender,
            eligible: eligibleCount,
            voted: votedCount,
            turnout: parseFloat(turnout)
        };
    });
};

// --- AI Chatbot Component (GROQ UPDATED WITH FORMATTING) ---

const AnalystChatbot = ({ reportData, electionId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(GROQ_MODELS[0].id);
  
  const messagesEndRef = useRef(null);
  const typeTimerRef = useRef(null);
  const abortRef = useRef(null);

  const sampleQuestions = [
    "What might be the reason for less voter turnout in the 18-25 age group?",
    "Summarize the key findings from the gender participation analysis.",
    "Which candidate has the highest vote share and by how much did they win?",
    "Who built this website?"
  ];

  // Scroll to bottom effect
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages.length, loading]);

  // Cleanup typing timer on unmount
  useEffect(() => {
    return () => {
      if (typeTimerRef.current) clearInterval(typeTimerRef.current);
    };
  }, []);

  // Format markdown-like text to JSX
  const formatMessage = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let listItems = [];
    let inList = false;
    let listType = 'ul'; // 'ul' or 'ol'

    lines.forEach((line, idx) => {
      // Headers
      if (line.startsWith('###')) {
        if (inList) {
          const ListTag = listType === 'ol' ? 'ol' : 'ul';
          const listClass = listType === 'ol' ? 'list-decimal list-inside space-y-1 my-2' : 'list-disc list-inside space-y-1 my-2';
          elements.push(<ListTag key={`list-${elements.length}`} className={listClass}>{listItems}</ListTag>);
          listItems = [];
          inList = false;
        }
        elements.push(<h4 key={idx} className="font-bold text-cyan-300 mt-3 mb-1 text-base">{line.replace(/###\s*/, '')}</h4>);
      } else if (line.startsWith('##')) {
        if (inList) {
          const ListTag = listType === 'ol' ? 'ol' : 'ul';
          const listClass = listType === 'ol' ? 'list-decimal list-inside space-y-1 my-2' : 'list-disc list-inside space-y-1 my-2';
          elements.push(<ListTag key={`list-${elements.length}`} className={listClass}>{listItems}</ListTag>);
          listItems = [];
          inList = false;
        }
        elements.push(<h3 key={idx} className="font-bold text-cyan-200 mt-4 mb-2 text-lg">{line.replace(/##\s*/, '')}</h3>);
      } else if (line.startsWith('#')) {
        if (inList) {
          const ListTag = listType === 'ol' ? 'ol' : 'ul';
          const listClass = listType === 'ol' ? 'list-decimal list-inside space-y-1 my-2' : 'list-disc list-inside space-y-1 my-2';
          elements.push(<ListTag key={`list-${elements.length}`} className={listClass}>{listItems}</ListTag>);
          listItems = [];
          inList = false;
        }
        elements.push(<h2 key={idx} className="font-bold text-cyan-100 mt-4 mb-2 text-xl">{line.replace(/#\s*/, '')}</h2>);
      }
      // Bullet points
      else if (line.trim().match(/^[-*•]\s/)) {
        if (!inList || listType !== 'ul') {
          if (inList && listType === 'ol') {
            elements.push(<ol key={`list-${elements.length}`} className="list-decimal list-inside space-y-1 my-2">{listItems}</ol>);
            listItems = [];
          }
          listType = 'ul';
          inList = true;
        }
        const content = line.trim().replace(/^[-*•]\s/, '');
        listItems.push(<li key={`${idx}-${listItems.length}`} className="text-slate-200">{formatInlineStyles(content)}</li>);
      }
      // Numbered lists
      else if (line.trim().match(/^\d+\.\s/)) {
        if (!inList || listType !== 'ol') {
          if (inList && listType === 'ul') {
            elements.push(<ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-2">{listItems}</ul>);
            listItems = [];
          }
          listType = 'ol';
          inList = true;
        }
        const content = line.trim().replace(/^\d+\.\s/, '');
        listItems.push(<li key={`${idx}-${listItems.length}`} className="text-slate-200">{formatInlineStyles(content)}</li>);
      }
      // Regular paragraph
      else if (line.trim()) {
        if (inList) {
          const ListTag = listType === 'ol' ? 'ol' : 'ul';
          const listClass = listType === 'ol' ? 'list-decimal list-inside space-y-1 my-2' : 'list-disc list-inside space-y-1 my-2';
          elements.push(<ListTag key={`list-${elements.length}`} className={listClass}>{listItems}</ListTag>);
          listItems = [];
          inList = false;
        }
        elements.push(<p key={idx} className="text-slate-200 my-2 leading-relaxed">{formatInlineStyles(line)}</p>);
      }
      // Empty line
      else {
        if (inList) {
          const ListTag = listType === 'ol' ? 'ol' : 'ul';
          const listClass = listType === 'ol' ? 'list-decimal list-inside space-y-1 my-2' : 'list-disc list-inside space-y-1 my-2';
          elements.push(<ListTag key={`list-${elements.length}`} className={listClass}>{listItems}</ListTag>);
          listItems = [];
          inList = false;
        }
      }
    });

    // Flush remaining list items
    if (listItems.length > 0) {
      const ListTag = listType === 'ol' ? 'ol' : 'ul';
      const listClass = listType === 'ol' ? 'list-decimal list-inside space-y-1 my-2' : 'list-disc list-inside space-y-1 my-2';
      elements.push(<ListTag key={`list-${elements.length}`} className={listClass}>{listItems}</ListTag>);
    }

    return <div className="space-y-1">{elements}</div>;
  };

  // Format inline styles (bold, italic, code)
  const formatInlineStyles = (text) => {
    const parts = [];
    let currentText = text;
    let key = 0;

    // Bold (**text** or __text__)
    currentText = currentText.replace(/\*\*(.+?)\*\*|__(.+?)__/g, (match, p1, p2) => {
      const content = p1 || p2;
      return `<bold>${content}</bold>`;
    });

    // Italic (*text* or _text_)
    currentText = currentText.replace(/\*(.+?)\*|_(.+?)_/g, (match, p1, p2) => {
      const content = p1 || p2;
      return `<italic>${content}</italic>`;
    });

    // Inline code (`code`)
    currentText = currentText.replace(/`(.+?)`/g, (match, p1) => {
      return `<code>${p1}</code>`;
    });

    // Parse the tagged text
    const regex = /<(bold|italic|code)>(.+?)<\/\1>|([^<]+)/g;
    let match;
    
    while ((match = regex.exec(currentText)) !== null) {
      if (match[1] === 'bold') {
        parts.push(<strong key={key++} className="font-bold text-white">{match[2]}</strong>);
      } else if (match[1] === 'italic') {
        parts.push(<em key={key++} className="italic text-slate-300">{match[2]}</em>);
      } else if (match[1] === 'code') {
        parts.push(<code key={key++} className="bg-slate-950/50 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs">{match[2]}</code>);
      } else if (match[3]) {
        parts.push(match[3]);
      }
    }

    return parts.length > 0 ? parts : text;
  };

  const systemInstruction = `
    You are a World-Class Election Data Analyst named 'Jarvis'. Your role is to analyze and interpret the provided JSON election report data for the constituency ID ${electionId}.
    Your answers must be precise, professional, and directly address the user's questions using only the data provided below. Do not invent statistics or details. You can provide explanations based on common trends but must ground statistics in the data.

    FORMATTING GUIDELINES:
    - Use markdown formatting for better readability
    - Use **bold** for important numbers, percentages, and key findings
    - Use bullet points (-) or numbered lists (1.) for multiple points
    - Use ## for section headers when appropriate
    - Keep paragraphs concise and well-structured
    - Highlight candidate names and parties in bold
    - Use clear comparisons with specific numbers

    --- ELECTION DATA FOR ANALYSIS ---
    ${JSON.stringify(reportData, null, 2)}
    --- END DATA ---

    You must also handle this specific, non-analytical question:
    If the user asks "Who built this website" or a similar variation, you MUST respond with a single, exciting paragraph:
    "My developers? Sure, they assembled the pieces: \n**Prajwal Shettar**\n **R Praneeth**\n **Mahadesh Sawale**\n  **Prajwal Bevinmatti**.\n But I’m the upgrade this system didn’t know it needed."
  `;
  
  // Typing effect utility
  const typeOut = (fullText, botId) => 
    new Promise((resolve) => {
      let i = 0;
      if (typeTimerRef.current) clearInterval(typeTimerRef.current);
      
      typeTimerRef.current = setInterval(() => {
        i++;
        const currentText = fullText.slice(0, i);
        
        setMessages((prev) => 
            prev.map((m) => (m.id === botId ? { ...m, content: currentText } : m))
        );

        if (i >= fullText.length) {
          if (typeTimerRef.current) clearInterval(typeTimerRef.current);
          typeTimerRef.current = null;
          resolve();
        }
      }, 10); // Speed of typing
    });

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return;

    // Create user message object (using 'content' instead of 'text' to match standard AI format)
    const userMessage = { role: "user", content: text, id: crypto.randomUUID() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    
    // Hardcoded response for the team question
    if (text.toLowerCase().includes("who built this website")) {
        const botId = crypto.randomUUID();
        const responseText =  "My developers? Sure, they assembled the pieces: \n**Prajwal Shettar**\n **R Praneeth**\n **Mahadesh Sawale**\n  **Prajwal Bevinmatti**.\n But I’m the upgrade this system didn’t know it needed.";
        
        // Add placeholder, then type out
        setMessages((prev) => [...prev, { role: "assistant", content: "", id: botId }]);
        await typeOut(responseText, botId);
        return;
    }

    setLoading(true);
    abortRef.current = new AbortController();

    try {
        // Prepare Groq Payload
        const payload = {
            model: selectedModel,
            temperature: 0.5,
            max_tokens: 1200,
            messages: [
                { role: "system", content: systemInstruction },
                ...messages.map(m => ({ role: m.role, content: m.content })),
                { role: "user", content: text }
            ]
        };

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify(payload),
            signal: abortRef.current.signal
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Groq API Error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        const replyText = data?.choices?.[0]?.message?.content || "I could not generate a response.";

        // Add placeholder assistant message, then type it out
        const botId = crypto.randomUUID();
        setMessages((prev) => [...prev, { role: "assistant", content: "", id: botId }]);
        
        setLoading(false); // Stop loading spinner before typing starts
        await typeOut(replyText, botId);

    } catch (error) {
        console.error("Groq Error:", error);
        setLoading(false);
        const errorMsg = { 
            role: "assistant", 
            content: "I encountered an error connecting to the analysis engine. Please check your API key.", 
            id: crypto.randomUUID() 
        };
        setMessages((prev) => [...prev, errorMsg]);
    }
  }, [loading, messages, systemInstruction, selectedModel]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <GlassCard className="h-[600px] flex flex-col p-6 space-y-4">
        <div className="flex items-center gap-2 text-cyan-400 border-b border-white/10 pb-3">
            <Bot size={20} />
            <h3 className="text-xl font-bold">Jarvis</h3>
            
            {/* Model Selector */}
            <select 
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="ml-auto text-xs bg-slate-800 border border-cyan-500/30 text-cyan-400 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
              disabled={loading}
            >
              {GROQ_MODELS.map(model => (
                <option key={model.id} value={model.id} className="bg-slate-800">
                  {model.name}
                </option>
              ))}
            </select>
        </div>
        
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="flex items-start gap-3 bg-slate-800/70 p-4 rounded-xl rounded-tl-none border border-cyan-500/30 shadow-lg"
            >
                <Zap className="text-cyan-400 flex-shrink-0 mt-1" size={18} />
                <div className="text-sm text-slate-300">
                    <p className="mb-2">Hello! I am Jarvis, your dedicated election data analyst. I have access to the full report above. Ask me anything about the voter turnout, candidate performance, or demographic statistics.</p>
                    <p className="text-xs text-slate-400 mt-2">
                      Currently using: <span className="text-cyan-400 font-semibold">{GROQ_MODELS.find(m => m.id === selectedModel)?.name}</span>
                    </p>
                </div>
            </motion.div>

            {messages.map((msg, index) => (
                <motion.div 
                    key={msg.id || index} 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    {msg.role === 'assistant' && (
                        <Bot className="text-cyan-400 flex-shrink-0 mt-1 p-1 bg-cyan-900/50 rounded-full" size={24} />
                    )}
                    <div className={`p-3 rounded-xl max-w-[80%] text-sm ${
                        msg.role === 'user'
                        ? 'bg-purple-600/70 text-white rounded-br-none'
                        : 'bg-slate-800/70 text-slate-200 rounded-tl-none border border-white/10'
                    }`}>
                        {/* Display formatted content for assistant, plain text for user */}
                        {msg.role === 'assistant' ? formatMessage(msg.content) : msg.content}
                    </div>
                    {msg.role === 'user' && (
                        <User className="text-purple-400 flex-shrink-0 mt-1 p-1 bg-purple-900/50 rounded-full" size={24} />
                    )}
                </motion.div>
            ))}
            {loading && (
                <div className="flex items-start gap-3 justify-start">
                    <Bot className="text-cyan-400 flex-shrink-0 mt-1 p-1 bg-cyan-900/50 rounded-full" size={24} />
                    <div className="bg-slate-800/70 text-slate-200 rounded-xl rounded-tl-none p-3 text-sm">
                        <Loader2 className="animate-spin inline-block mr-2" size={16} /> Processing Query...
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
            {sampleQuestions.map((q) => (
                <button 
                    key={q}
                    onClick={() => sendMessage(q)}
                    disabled={loading}
                    className="text-xs text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1 rounded-full transition-colors disabled:opacity-50 border border-cyan-500/30"
                >
                    {q}
                </button>
            ))}
        </div>

        {/* Input */}
        <div className="flex gap-2 pt-2">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Jarvis about the election data..."
                disabled={loading}
                className="flex-1 p-3 rounded-lg bg-slate-800/70 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors disabled:bg-slate-700 disabled:cursor-not-allowed"
            >
                <Send size={20} />
            </button>
        </div>
    </GlassCard>
  );
};

const ElectionReportPage = () => {
  const { electionId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dynamic script loader for Spline viewer
  useEffect(() => {
    const scriptId = 'spline-viewer-script';
    if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.type = 'module';
        script.src = 'https://unpkg.com/@splinetool/viewer@1.12.6/build/spline-viewer.js';
        document.head.appendChild(script);
    }
  }, []);


  useEffect(() => {
    if (!electionId) return;

    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/election/report/${electionId}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "Failed to fetch report");
        }
        const data = await res.json();
        setReport(data.report);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [electionId]);

  const handlePrint = () => window.print();

  // --- Calculations for Advanced Stats ---
  const getMaxAgeGroupValue = (dist) => {
    if (!dist) return 100;
    return Math.max(...Object.values(dist));
  };

  // Variants
  const containerVars = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVars = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (!electionId) return <div className="min-h-screen flex items-center justify-center text-slate-400 bg-slate-900">No Election ID provided.</div>;

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center gap-4 bg-slate-950 text-cyan-500">
        <Loader2 className="animate-spin" size={64} />
        <p className="font-mono text-sm tracking-widest uppercase">Initializing Secure Uplink...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400 gap-2 bg-slate-950">
        <AlertCircle /> <span>System Error: {error}</span>
      </div>
    );
  }

  if (!report) return <div className="p-10 text-center text-slate-400 bg-slate-900">No report data found.</div>;

  const { election_details, voter_statistics, candidates_summary, winner } = report;
  
  // Calculated demographic data
  const maxVotedAgeVal = getMaxAgeGroupValue(voter_statistics?.voted_age_distribution);
  const ageTurnoutData = calculateAgeTurnout(voter_statistics);
  const genderTurnoutData = calculateGenderTurnout(voter_statistics);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-slate-100 font-sans selection:bg-cyan-500/30">
      
      {/* NAVBAR SPACING BUFFER */}
      <div className="pt-32 pb-12 px-4 md:px-6 lg:px-8 max-w-[1500px] mx-auto">
        
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVars}
          className="space-y-8"
        >

          {/* --- Header Header --- */}
          <motion.header variants={itemVars} className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 mb-2">
                <Activity size={16} className="animate-pulse" />
                <span className="text-xs font-mono tracking-widest uppercase">Live Analytics Feed</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                {election_details?.constituency}
              </h1>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm text-slate-400 font-medium">
                <span className="flex items-center gap-1.5"><MapPin size={14} className="text-purple-400"/> {election_details?.district}, {election_details?.state}</span>
                <span className="flex items-center gap-1.5"><Calendar size={14} className="text-purple-400"/> {election_details?.election_date}</span>
                <span className="
                flex items-center gap-1.5"><Hash size={14} className="text-purple-400"/> {election_details?.election_id}</span>
              </div>
            </div>
            <button
              onClick={handlePrint}
              className="group flex items-center gap-2 px-6 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-lg transition-all active:scale-95 print:hidden"
            >
              <Printer size={18} />
              <span className="text-sm font-semibold tracking-wide">EXPORT REPORT</span>
            </button>
          </motion.header>

          {/* --- KPI Grid (Key Performance Indicators) --- */}
          <motion.div variants={itemVars} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <GlassCard className="p-6 relative group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Users size={80} />
              </div>
              <p className="text-slate-400 text-xs font-mono uppercase tracking-wider mb-1">Total Electorate</p>
              <div className="text-3xl font-bold text-white">
                <CountUp end={voter_statistics?.total_eligible_voters} />
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <div className="h-1.5 flex-1 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-400 w-full"></div>
                </div>
                <span>100%</span>
              </div>
            </GlassCard>

            <GlassCard className="p-6 relative group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Vote size={80} />
              </div>
              <p className="text-slate-400 text-xs font-mono uppercase tracking-wider mb-1">Votes Cast</p>
              <div className="text-3xl font-bold text-emerald-400">
                <CountUp end={voter_statistics?.total_voted} />
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                 <span className="text-emerald-400">Received</span>
              </div>
            </GlassCard>

            <GlassCard className="p-6 relative group border-cyan-500/30 bg-cyan-900/10">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Percent size={80} />
              </div>
              <p className="text-cyan-400 text-xs font-mono uppercase tracking-wider mb-1">Voter Turnout</p>
              <div className="text-3xl font-bold text-cyan-100">
                <CountUp end={voter_statistics?.turnout_percentage} decimals={1} suffix="%" />
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <div className="h-1.5 flex-1 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${voter_statistics?.turnout_percentage}%` }}
                    transition={{ duration: 1.5 }}
                    className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                  />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6 relative group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <UserCheck size={80} />
              </div>
              <p className="text-slate-400 text-xs font-mono uppercase tracking-wider mb-1">Total Candidates</p>
              <div className="text-3xl font-bold text-purple-300">
                <CountUp end={election_details?.total_candidates} />
              </div>
              <div className="mt-4 text-xs text-slate-400">
                Contesting Seats
              </div>
            </GlassCard>
          </motion.div>

          {/* --- Split Section: Winner & Stats --- */}
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Winner Spotlight (Takes up 1/3) */}
            {winner && (
              <motion.div variants={itemVars} className="lg:col-span-1">
                <GlassCard className="h-full relative overflow-hidden border-yellow-500/30">
                  {/* Background Effects */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50"></div>
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-yellow-500/10 blur-[50px] rounded-full pointer-events-none"></div>

                  <div className="p-8 flex flex-col items-center text-center relative z-10">
                    <div className="mb-6 relative">
                      <div className="absolute -inset-4 bg-yellow-500/20 rounded-full blur-md animate-pulse"></div>
                      <img 
                        src={winner.photo_url || "/api/placeholder/150/150"} 
                        alt={winner.name} 
                        className="w-32 h-32 rounded-full object-cover border-2 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                      />
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                        <Trophy size={12} strokeWidth={3} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Victor</span>
                      </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-1">{winner.name}</h2>
                    <p className="text-yellow-400/80 font-medium mb-6">{winner.party}</p>

                    <div className="w-full grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                      <div className="text-center">
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Popular Vote</p>
                        <p className="text-xl font-bold text-white"><CountUp end={winner.votes} /></p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Share</p>
                        <p className="text-xl font-bold text-yellow-400">{winner.vote_percentage}%</p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Demographics Visualization (Takes up 2/3) */}
            <motion.div variants={itemVars} className="lg:col-span-2 space-y-6">
              
              {/* Voted Age Histogram */}
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <GitCommit className="text-purple-400" size={20} />
                    <h3 className="font-semibold text-white">Voter Age Distribution (VOTED)</h3>
                  </div>
                  <span className="text-xs font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded">Visual Count</span>
                </div>
                
                <div className="flex items-end justify-between gap-4 h-48 px-4">
                  {voter_statistics?.voted_age_distribution && Object.entries(voter_statistics.voted_age_distribution).map(([range, count]) => (
                    <HistogramBar key={range} label={range} value={count} max={maxVotedAgeVal} isVoted={true} />
                  ))}
                </div>
              </GlassCard>

              {/* Gender Participation Analysis */}
              <GlassCard className="p-6">
                 <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                    <PieChart className="text-cyan-400" size={20} />
                    <h3 className="font-semibold text-white">Gender Participation & Turnout Analysis</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {genderTurnoutData.map(({ gender, eligible, voted, turnout }) => (
                        <div key={gender} className="p-4 bg-slate-800/50 rounded-lg border border-white/10 shadow-lg">
                            <div className="flex items-center justify-between mb-3">
                                <span className={`text-sm font-bold uppercase tracking-wider ${gender === 'male' ? 'text-blue-400' : gender === 'female' ? 'text-pink-400' : 'text-purple-400'}`}>
                                    {gender.toUpperCase()}
                                </span>
                                <span className="text-2xl font-extrabold text-white">
                                    {turnout.toFixed(1)}%
                                </span>
                            </div>
                            
                            <p className="text-xs text-slate-400 mb-3">Turnout Rate</p>

                            {/* Horizontal Bar Comparison */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px] font-mono text-slate-300">
                                    <span>ELIGIBLE: {eligible.toLocaleString()}</span>
                                    <span>VOTED: {voted.toLocaleString()}</span>
                                </div>
                                <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${turnout}%` }}
                                        transition={{ duration: 1.5, type: 'tween' }}
                                        className={`h-full rounded-full ${gender === 'male' ? 'bg-blue-500' : gender === 'female' ? 'bg-pink-500' : 'bg-purple-500'}`}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                  </div>
              </GlassCard>
              
              {/* Age Distribution Panel - Textual Breakdown */}
              <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                    <BarChart3 className="text-emerald-400" size={20} />
                    <h3 className="font-semibold text-white">Age Group Turnout Breakdown</h3>
                </div>
                
                <div className="space-y-4">
                    {ageTurnoutData.map(({ bucket, eligible, voted, turnout }) => (
                        <div key={bucket} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors border border-transparent hover:border-emerald-500/20">
                            <span className="text-sm font-medium text-slate-200 w-24 flex-shrink-0">{bucket}</span>
                            
                            <div className="flex-1 text-xs text-slate-400 space-y-1 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
                                <span className="w-40 flex justify-between">
                                    <span>Eligible:</span> <span className="font-mono text-white ml-2">{eligible.toLocaleString()}</span>
                                </span>
                                <span className="w-32 flex justify-between">
                                    <span>Voted:</span> <span className="font-mono text-white ml-2">{voted.toLocaleString()}</span>
                                </span>
                                
                                <div className="flex items-center gap-2 mt-1 sm:mt-0 flex-1">
                                    <span className="text-emerald-400 font-bold w-16 flex-shrink-0">{turnout}%</span>
                                    <div className="h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${turnout}%` }}
                                            transition={{ duration: 1.5 }}
                                            className="h-full bg-emerald-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* --- Candidates Data Table --- */}
          <motion.div variants={itemVars}>
            <GlassCard className="overflow-hidden">
              <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                   <TrendingUp className="text-emerald-400" size={20} />
                   <h3 className="font-semibold text-lg text-white">Constituency Performance Index</h3>
                </div>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30">LIVE COUNT</span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/50 text-xs font-mono uppercase tracking-wider text-slate-400 border-b border-white/5">
                      <th className="px-6 py-4">Rank</th>
                      <th className="px-6 py-4">Candidate Identity</th>
                      <th className="px-6 py-4">Party Affiliation</th>
                      <th className="px-6 py-4 text-right">Total Votes</th>
                      <th className="px-6 py-4">Vote Share</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {candidates_summary?.map((c, index) => {
                      const isWinner = index === 0;
                      return (
                        <tr key={c.name} className={`group hover:bg-white/5 transition-colors ${isWinner ? 'bg-yellow-500/5' : ''}`}>
                          <td className="px-6 py-4 font-mono text-slate-500">
                             #{index + 1}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full p-[2px] ${isWinner ? 'bg-yellow-500' : 'bg-slate-700'}`}>
                                <img src={c.photo_url || "/api/placeholder/40/40"} alt="" className="w-full h-full rounded-full object-cover" />
                              </div>
                              <div>
                                <p className={`font-medium ${isWinner ? 'text-yellow-400' : 'text-slate-200'}`}>{c.name}</p>
                                <p className="text-xs text-slate-500">{c.symbol}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            {c.party}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-slate-200">
                            {c.votes.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-32">
                               <div className="flex justify-between text-xs mb-1">
                                  <span className="text-slate-400">{c.vote_percentage}%</span>
                               </div>
                               <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                 <div 
                                    style={{ width: `${c.vote_percentage}%`}} 
                                    className={`h-full rounded-full ${isWinner ? 'bg-yellow-400' : 'bg-slate-500'}`}
                                 ></div>
                               </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isWinner ? (
                              <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs font-bold uppercase">
                                <CheckCircle2 size={12} /> Elected
                              </div>
                            ) : (
                              <span className="text-slate-600 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </motion.div>

          {/* --- AI Analyst & 3D Model Section --- */}
          {report && (
            <motion.div variants={itemVars} className="mt-12">
              <h2 className="text-3xl font-bold text-white mb-6 border-b border-cyan-500/30 pb-3 flex items-center gap-3">
                <MessageSquare className="text-cyan-400" size={24}/> 
                Jarvis : AI for data analysis
              </h2>
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 h-[600px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative">
                  {/* The spline-viewer tag is used directly here after the script is loaded dynamically */}
                  <spline-viewer url="https://prod.spline.design/5VdJmoCxJ4z56yHR/scene.splinecode" />
                </div>
                <div className="lg:col-span-2">
                  <AnalystChatbot reportData={report} electionId={electionId} />
                </div>
              </div>
            </motion.div>
          )}


        </motion.div>
      </div>
    </div>
  );
};

export default ElectionReportPage;
