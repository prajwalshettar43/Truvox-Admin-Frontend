import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Vote, ShieldCheck, Users, Activity, Globe, AlertTriangle, Terminal, XCircle, ChevronRight } from 'lucide-react';
import HolographicSphere from './HolographicSphere';
import ParticleNetwork from './ParticleNetwork';
import Logo from '../common/Logo';

// --- NEW COMPONENT: Static Terminal Warning ---
const SystemLogTerminal = () => {
  const [logs, setLogs] = useState([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // Replace with your actual API URL
        const response = await fetch('http://localhost:8000/logs');
        const data = await response.json();
        setLogs(data);
      } catch (error) {
        console.error("Failed to fetch system logs");
      }
    };

    fetchLogs();
    // Poll every 5 seconds to check for new warnings
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!logs || logs.length === 0 || !isVisible) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full mb-12 relative group"
    >
      {/* Glowing Backdrop */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl opacity-20 group-hover:opacity-40 blur transition duration-1000"></div>
      
      {/* Main Terminal Box */}
      <div className="relative w-full rounded-xl bg-slate-950/90 border border-red-500/30 backdrop-blur-xl overflow-hidden shadow-[0_0_40px_rgba(220,38,38,0.15)]">
        
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-red-950/50 border-b border-red-500/20">
          <div className="flex items-center gap-3">
            <div className="relative">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="absolute inset-0 animate-ping opacity-50 rounded-full bg-red-500"></span>
            </div>
            <span className="text-red-400 font-mono text-sm font-bold tracking-widest uppercase">
              System Security Alerts ({logs.length})
            </span>
          </div>
          
          <button 
            onClick={() => setIsVisible(false)}
            className="flex items-center gap-2 text-xs font-mono text-red-400/70 hover:text-red-400 transition-colors uppercase tracking-wider"
          >
            [ Dismiss ] <XCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Log Content Area */}
        <div className="p-6 font-mono text-sm relative">
          {/* Scanline overlay effect */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(255,0,0,0.02),rgba(255,0,0,0.06))] z-10 background-size-[100%_2px,3px_100%]" />
          
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-red-900 scrollbar-track-transparent">
            {logs.map((log, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-3 text-red-200/90 border-l-2 border-red-500/20 pl-3 hover:bg-red-900/10 hover:border-red-500 transition-colors py-1"
              >
                <ChevronRight className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="break-all leading-relaxed font-semibold text-red-100 shadow-red-500/50 drop-shadow-[0_0_3px_rgba(220,38,38,0.5)]">
                    {log.message}
                  </span>
                  <span className="text-[10px] text-red-400/50 mt-1 uppercase tracking-widest">
                    ID: {Math.random().toString(36).substr(2, 9)} // PRIORITY: HIGH
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- MAIN LANDING PAGE ---
const LandingPage = () => {
  const navigate = useNavigate();

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: { transition: { staggerChildren: 0.2 } }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-x-hidden font-sans selection:bg-blue-500/30">
      {/* Background */}
      <ParticleNetwork />
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2 mix-blend-screen" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none translate-x-1/2 translate-y-1/2 mix-blend-screen" />

      {/* 2. Main Content */}
      <div className="relative z-10 container mx-auto px-6 pt-32 pb-20">
        
        {/* --- INSERTED HERE: LOG WARNING SYSTEM --- */}
        {/* This sits above the hero section but inside the container, respecting navbar space */}
        <SystemLogTerminal />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Left: Text Content */}
          <motion.div 
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="space-y-8 text-center lg:text-left"
          >
            <motion.div variants={fadeInUp} className="flex justify-center lg:justify-start items-center gap-4 mb-4">
              <Logo size="medium" animated={true} />
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={fadeInUp} className="text-6xl lg:text-8xl font-extrabold tracking-tight leading-[1.1]">
              The Future of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 animate-gradient-x">
                Democracy
              </span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              TruVox empowers citizens with a <strong>Blockchain-Secured</strong>, <strong>AI-Verified</strong> voting ecosystem. 
              Experience the transparency of decentralized elections with the security of biometric identity.
            </motion.p>

            {/* Action Buttons */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start pt-4">
              <button 
                onClick={() => navigate('/Register')}
                className="group relative px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative flex items-center gap-2">
                  Register to Vote <Vote className="w-5 h-5" />
                </span>
              </button>
              
              <button 
                onClick={() => navigate('/view-election')}
                className="px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-lg border border-white/10 backdrop-blur-md transition-all hover:border-white/20 flex items-center justify-center gap-2"
              >
                <Activity className="w-5 h-5 text-green-400" />
                View Live Results
              </button>
            </motion.div>

            {/* Trust Metrics */}
            <motion.div variants={fadeInUp} className="flex items-center justify-center lg:justify-start gap-8 pt-8 border-t border-white/10">
              <div>
                <p className="text-3xl font-bold text-white">100%</p>
                <p className="text-sm text-gray-400">Secure</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <p className="text-3xl font-bold text-white">0%</p>
                <p className="text-sm text-gray-400">Fraud</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <p className="text-3xl font-bold text-white">24/7</p>
                <p className="text-sm text-gray-400">Monitoring</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: 3D Holographic Element */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2, type: "spring" }}
            className="h-[600px] w-full flex items-center justify-center relative"
          >
            <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full" />
            <HolographicSphere />
          </motion.div>
        </div>

        {/* Ticker and Features Sections remain the same... */}
        <div className="my-24 border-y border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden py-4">
          <div className="flex animate-marquee whitespace-nowrap gap-12 text-gray-300 font-mono text-sm">
             {[...Array(10)].map((_, i) => (
               <span key={i} className="flex items-center gap-2">
                 <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                 LIVE: Voting currently active in Karnataka District {i+1} • Turnout: {Math.floor(Math.random() * 40) + 40}% • Blockchain Height: #892{i}44
               </span>
             ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Why Choose <span className="text-blue-400">TruVox?</span></h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">Our platform combines three cutting-edge technologies to create the most secure voting system in history.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<ShieldCheck className="w-10 h-10 text-emerald-400" />}
              title="Blockchain Ledger"
              desc="Every vote is recorded as an immutable transaction on a decentralized ledger. Once cast, a vote cannot be altered, deleted, or tampered with by anyone, including admins."
              delay={0.1}
            />
            <FeatureCard 
              icon={<Users className="w-10 h-10 text-blue-400" />}
              title="Biometric Verification"
              desc="We use advanced AI facial recognition to ensure 'One Person, One Vote'. Our liveness detection prevents spoofing using photos or videos."
              delay={0.2}
            />
            <FeatureCard 
              icon={<Globe className="w-10 h-10 text-purple-400" />}
              title="Decentralized Access"
              desc="Voters can cast their ballot from any registered constituency booth without physical paperwork, thanks to our centralized digital registry."
              delay={0.3}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
    className="p-8 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all group"
  >
    <div className="mb-6 p-4 rounded-2xl bg-slate-900 w-fit border border-white/10 group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
    <p className="text-gray-400 leading-relaxed">{desc}</p>
  </motion.div>
);

export default LandingPage;