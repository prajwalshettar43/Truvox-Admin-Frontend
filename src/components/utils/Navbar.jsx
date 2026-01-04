import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, User, Shield, Vote } from "lucide-react";
import Logo from '../common/Logo';

const Navbar = ({ isAdminLoggedIn, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredPath, setHoveredPath] = useState(location.pathname);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Get email from localStorage when component mounts
    const email = localStorage.getItem('districtEmail') || localStorage.getItem('adminEmail') || localStorage.getItem('userEmail');
    if (email) {
      setUserEmail(email);
    }
  }, [isAdminLoggedIn]);

  // Show only district register before login, show all admin links after login
  const publicLinks = [
    { path: "/district-register", name: "District Register", icon: <Vote size={22} /> },
  ];

  const adminLinks = [
    { path: "/district-dashboard", name: "Dashboard" },
    { path: "/create-election", name: "Create Election" },
    { path: "/view-election", name: "All Elections" },
    { path: "/Register", name: "Register Voter", icon: <User size={22} /> },
    { path: "/Verify", name: "Verify Voter", icon: <Shield size={22} /> },
  ];

  const links = isAdminLoggedIn ? adminLinks : publicLinks;

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-white/10 backdrop-blur-md shadow-2xl shadow-blue-500/20 border-b border-white/20"
      >
        <div className="max-w-[1600px] mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            {/* LOGO */}
            <div
              onClick={() => navigate("/")}
              className="cursor-pointer scale-110"
            >
              <Logo />
            </div>

            {/* DESKTOP NAVIGATION */}
            <div className="hidden lg:flex items-center gap-4">
              {links.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onMouseEnter={() => setHoveredPath(item.path)}
                    onMouseLeave={() => setHoveredPath(location.pathname)}
                    className="relative px-8 py-3 rounded-full text-lg font-medium transition-colors duration-300 flex items-center gap-2.5"
                  >
                    {/* The Sliding Glow Background */}
                    <AnimatePresence>
                      {hoveredPath === item.path && (
                        <motion.div
                          layoutId="navbar-glow"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-purple-600/30 backdrop-blur-sm rounded-full border border-blue-400/50 shadow-lg shadow-blue-500/20"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </AnimatePresence>

                    {/* The Text/Icon */}
                    <span
                      className={`relative z-10 flex items-center gap-2 ${
                        isActive ? "text-blue-400" : "text-gray-300"
                      }`}
                    >
                      {item.icon && item.icon}
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* AUTH BUTTONS */}
            <div className="hidden lg:flex items-center gap-4">
              {!isAdminLoggedIn ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/district-login")}
                  className="px-7 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-bold shadow-lg border border-white/10 transition-all"
                >
                  District Login
                </motion.button>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onLogout}
                    className="px-7 py-3 rounded-xl bg-red-500/20 text-red-400 text-lg font-bold border border-red-500/30 flex items-center gap-2 hover:bg-red-500/30 transition-all"
                  >
                    <LogOut size={20} />
                    Logout
                  </motion.button>
                  
                  {userEmail && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 flex items-center gap-3"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50" />
                      <span className="text-blue-200 font-medium">{userEmail}</span>
                    </motion.div>
                  )}
                </>
              )}
            </div>

            {/* MOBILE MENU TOGGLE */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-3 rounded-xl bg-white/5 text-white border border-white/10"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* MOBILE MENU OVERLAY */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed inset-0 z-40 lg:hidden bg-gray-900/98 backdrop-blur-xl"
          >
            <div className="flex flex-col gap-4 p-8 pt-24">
              {links.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-4 p-4 rounded-xl border border-white/5 text-lg ${
                    location.pathname === item.path
                      ? "bg-blue-600 text-white"
                      : "bg-white/5 text-gray-300"
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}

              {!isAdminLoggedIn ? (
                <button
                  onClick={() => {
                    navigate("/district-login");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full p-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-bold"
                >
                  District Login
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      onLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full p-4 rounded-xl bg-red-500/20 text-red-400 text-lg font-bold border border-red-500/30"
                  >
                    <LogOut size={20} className="inline mr-2" />
                    Logout
                  </button>
                  
                  {userEmail && (
                    <div className="w-full p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50" />
                      <span className="text-blue-200 font-medium text-lg">{userEmail}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;