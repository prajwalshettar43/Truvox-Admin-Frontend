import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, MapPin, Phone, Lock, Loader2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import ParticleNetwork from '../home/ParticleNetwork'; // Reusing your background
import Logo from '../common/Logo'; // Reusing your logo

function DistrictAdminForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    district: '',
    phone_number: '',
    password: '',
  });

  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [createdAdmin, setCreatedAdmin] = useState(null);

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null); // Clear error on type
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError(null);
    setCreatedAdmin(null);

    // Minimum delay to show animation
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/district-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Registration failed.');
      }

      setStatus('success');
      setCreatedAdmin(result);
      setFormData({ name: '', email: '', district: '', phone_number: '', password: '' });
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  };

  // --- Animation Variants ---
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut", staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 text-white overflow-hidden p-4">
      {/* 1. Background */}
      <ParticleNetwork />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* 2. Main Card */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-4xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
      >
        
        {/* Left Side: Visuals & Info */}
        <div className="md:w-2/5 bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-8 flex flex-col justify-between relative overflow-hidden">
          {/* Decorative Circle */}
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-blue-500/30 rounded-full blur-3xl" />
          
          <div>
            <Logo size="small" animated={true} />
            <motion.h2 variants={itemVariants} className="text-3xl font-bold mt-8 mb-4">
              District Portal Access
            </motion.h2>
            <motion.p variants={itemVariants} className="text-blue-200 leading-relaxed">
              Empower your district with secure, blockchain-verified election monitoring tools.
            </motion.p>
          </div>

          <motion.div variants={itemVariants} className="mt-12 space-y-4">
            <div className="flex items-center gap-3 text-sm text-blue-100">
              <div className="p-2 rounded-lg bg-white/10"><CheckCircle size={16} /></div>
              <span>Real-time Voter Analytics</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-blue-100">
              <div className="p-2 rounded-lg bg-white/10"><CheckCircle size={16} /></div>
              <span>Constituency Management</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-blue-100">
              <div className="p-2 rounded-lg bg-white/10"><CheckCircle size={16} /></div>
              <span>Secure Admin Dashboard</span>
            </div>
          </motion.div>
        </div>

        {/* Right Side: The Form */}
        <div className="md:w-3/5 p-8 md:p-12 bg-slate-900/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField 
                icon={<User size={18} />}
                label="Full Name"
                name="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                variants={itemVariants}
              />
               <InputField 
                icon={<MapPin size={18} />}
                label="District Name"
                name="district"
                type="text"
                placeholder="e.g. Bangalore South"
                value={formData.district}
                onChange={handleChange}
                variants={itemVariants}
              />
            </div>

            <InputField 
              icon={<Mail size={18} />}
              label="Official Email"
              name="email"
              type="email"
              placeholder="admin@election.gov.in"
              value={formData.email}
              onChange={handleChange}
              variants={itemVariants}
            />

            <InputField 
              icon={<Phone size={18} />}
              label="Secure Phone Line"
              name="phone_number"
              type="tel"
              placeholder="+91 98765 43210"
              value={formData.phone_number}
              onChange={handleChange}
              variants={itemVariants}
            />

            <InputField 
              icon={<Lock size={18} />}
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              variants={itemVariants}
            />

            <motion.button
              variants={itemVariants}
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
                  <Loader2 className="animate-spin" /> Creating Account...
                </>
              ) : status === 'success' ? (
                <>
                  <CheckCircle /> Account Created
                </>
              ) : (
                <>
                  Register Admin <ArrowRight size={20} />
                </>
              )}
            </motion.button>
          </form>

          {/* Feedback Messages */}
          <AnimatePresence mode="wait">
            {status === 'error' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 flex items-center gap-3"
              >
                <AlertCircle className="text-red-500 shrink-0" />
                <p className="text-sm">{error}</p>
              </motion.div>
            )}

            {status === 'success' && createdAdmin && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-200 flex items-center gap-3"
              >
                <div className="p-2 bg-green-500 rounded-full text-white">
                   <CheckCircle size={20} />
                </div>
                <div>
                  <p className="font-bold">Registration Successful!</p>
                  <p className="text-sm opacity-80">Admin ID: {createdAdmin.id || "Generated"}</p>
                  <p className="text-sm opacity-80">Status: {createdAdmin.status || "Active"}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </div>
  );
}

// --- Helper Component for Inputs ---
const InputField = ({ icon, label, ...props }) => (
  <motion.div variants={props.variants} className="space-y-2">
    <label className="text-sm font-medium text-gray-400 ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors">
        {icon}
      </div>
      <input
        {...props}
        className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10 transition-all"
      />
    </div>
  </motion.div>
);

export default DistrictAdminForm;