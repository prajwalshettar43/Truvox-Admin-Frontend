import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import ParticleNetwork from '../home/ParticleNetwork'; // Reuse your background
import Logo from '../common/Logo'; // Reuse your logo

function AdminLoginForm({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError(null);

    // Add a small artificial delay for the "Verification" effect
    await new Promise(resolve => setTimeout(resolve, 1000));

    const formBody = new URLSearchParams();
    formBody.append('email', email);
    formBody.append('password', password);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/district-admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.detail || 'Login failed. Access Denied.');
      }

      setStatus('success');
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userType', 'district');
      
      // Wait a moment to show the success state before redirecting
      setTimeout(() => {
        onLoginSuccess();
        navigate('/district-dashboard');
      }, 800);

    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  };

  // Animation Variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 text-white overflow-hidden p-6">
      {/* 1. Background */}
      <ParticleNetwork />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* 2. Login Card */}
      <motion.div 
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 overflow-hidden relative group">
          
          {/* Decorative Top Light */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6 scale-110">
               <Logo size="small" animated={true} />
            </div>
            <motion.h2 variants={fadeInUp} className="text-2xl font-bold text-white mb-2">
              Secure Admin Access
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-slate-400 text-sm">
              Authenticate to access the District Election Portal.
            </motion.p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div variants={fadeInUp} className="space-y-4">
              
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Admin ID</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@kgis.gov.in"
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-slate-900 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Secure Key</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-slate-900 transition-all"
                  />
                </div>
              </div>

            </motion.div>

            {/* Action Button */}
            <motion.button
              variants={fadeInUp}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={status === 'loading' || status === 'success'}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${
                status === 'success' 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-blue-500/25 text-white'
              } disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> Verifying Credentials...
                </>
              ) : status === 'success' ? (
                <>
                  <ShieldCheck size={20} /> Access Granted
                </>
              ) : (
                <>
                  Initialize Session <ArrowRight size={20} />
                </>
              )}
            </motion.button>
          </form>

          {/* Error Message */}
          <AnimatePresence>
            {status === 'error' && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-200"
              >
                <AlertCircle className="shrink-0" size={20} />
                <span className="text-sm font-medium">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Link */}
          <div className="mt-8 text-center">
             <p className="text-slate-500 text-sm">
               New District Admin?{' '}
               <span 
                 onClick={() => navigate('/district-register')} 
                 className="text-blue-400 hover:text-blue-300 cursor-pointer font-medium transition-colors"
               >
                 Request Access
               </span>
             </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default AdminLoginForm;