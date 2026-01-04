import React, { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import { Vote } from 'lucide-react';
import { useNavigate } from "react-router-dom";
const IMG_PLACEHOLDER_SVG = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect fill='%23e5e7eb' width='100%' height='100%'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='12' fill='%23737479'>No Image</text></svg>`;

const AllElections = () => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedElection, setSelectedElection] = useState(null);
  const [resultElection, setResultElection] = useState(null);
  const [results, setResults] = useState([]);
  const [loadingResult, setLoadingResult] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyData, setVerifyData] = useState(null);
  const [verifyElection, setVerifyElection] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchElections = async () => {
      try {
        const res = await fetch("http://localhost:8000/election/all");
        const data = await res.json();
        setElections(data.elections || []);
      } catch (err) {
        console.error("Failed fetching elections:", err);
        setError("Unable to load elections. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };
    fetchElections();
  }, []);

  const fetchResults = async (electionId) => {
    setLoadingResult(true);
    try {
      const res = await fetch(`http://localhost:8000/api/vote/results/${electionId}`);
      const data = await res.json();
      setResults(data.results || []);
      setResultElection(elections.find((e) => e._id === electionId));
    } catch (err) {
      console.error("Failed fetching results:", err);
      setError("Unable to load results");
    } finally {
      setLoadingResult(false);
    }
  };

  const verifyElectionIntegrity = async (electionId) => {
    setVerifying(true);
    setVerifyData(null);
    setVerifyElection(elections.find((e) => e._id === electionId));
    try {
      const res = await fetch("http://localhost:8000/api/vote/verify-election-integrity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ election_id: electionId })
      });
      const data = await res.json();
      setVerifyData(data);
    } catch (err) {
      console.error("Verification error:", err);
      setVerifyData({
        error: true,
        message: "Unable to verify votes",
      });
    } finally {
      setVerifying(false);
    }
  };

  const openReport=(electionId)=>{
    navigate('/view-election-report/'+electionId);
  }

  const looksLikeImage = (str) => {
    if (!str || typeof str !== "string") return false;
    if (str.startsWith("data:image/")) return true;
    if (/\.(jpg|jpeg|png|gif|svg|webp)(\?.*)?$/i.test(str)) return true;
    if (/^[A-Za-z0-9+/=\s]+$/.test(str) && str.length > 500) return true;
    return false;
  };

  const resolveCandidatePhotoSrc = (cand) => {
    const b64 = cand?.candidate_photo_base64;
    if (b64 && typeof b64 === "string" && b64.trim()) {
      if (b64.startsWith("data:image/")) return b64;
      return `data:image/jpeg;base64,${b64.trim()}`;
    }
    const photoUrl = cand?.photo_url || cand?.photo || cand?.photo_path;
    if (photoUrl && typeof photoUrl === "string" && photoUrl.trim()) {
      return photoUrl.trim();
    }
    return IMG_PLACEHOLDER_SVG;
  };

  const renderSymbol = (cand) => {
    const symbolUrl = cand?.symbol_url;
    const symbolText = cand?.symbol || cand?.symbol_name || (symbolUrl && !looksLikeImage(symbolUrl) ? symbolUrl : null);

    if (symbolUrl && looksLikeImage(symbolUrl)) {
      return (
        <img
          src={symbolUrl}
          alt={`${cand?.name || "candidate"} symbol`}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = IMG_PLACEHOLDER_SVG;
          }}
          className="w-10 h-10 object-contain rounded-lg bg-white bg-opacity-20 p-1"
        />
      );
    }

    if (symbolText) {
      return (
        <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-sm shadow-lg">
          {symbolText}
        </div>
      );
    }

    return <img src={IMG_PLACEHOLDER_SVG} alt="no symbol" className="w-10 h-10 object-contain rounded-lg opacity-50" />;
  };

  const handlePhotoError = (e, src) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = IMG_PLACEHOLDER_SVG;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900  p-6">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }

        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out forwards;
        }

        .animate-shimmer {
          background: linear-gradient(90deg, #1e3a8a 0%, #4c1d95 50%, #1e3a8a 100%);
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }

        .stagger-1 { animation-delay: 0.1s; opacity: 0; }
        .stagger-2 { animation-delay: 0.2s; opacity: 0; }
        .stagger-3 { animation-delay: 0.3s; opacity: 0; }
        .stagger-4 { animation-delay: 0.4s; opacity: 0; }
        .stagger-5 { animation-delay: 0.5s; opacity: 0; }
        .stagger-6 { animation-delay: 0.6s; opacity: 0; }
      `}</style>

      <div className="max-w-7xl mx-auto w-full mt-25">
        {/* Enhanced Header */}
        <div className="text-center mb-12 animate-fadeInUp">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-2xl tracking-tight">
            Election Dashboard
          </h1>
          <p className="text-xl text-blue-100 font-light max-w-2xl mx-auto">
            Track elections, view candidates, and monitor voting results in real-time
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20 animate-fadeIn">
            <div className="inline-block relative mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
              <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-t-4 border-b-4 border-purple-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
            </div>
            <p className="text-white text-lg font-medium">Loading elections...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500 bg-opacity-90 border-2 border-red-300 text-white p-5 rounded-2xl mb-8 backdrop-blur-sm shadow-2xl animate-scaleIn">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-bold text-lg">Error</p>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Election Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {elections.map((election, index) => (
            <div 
              key={election._id} 
              className={`group bg-white bg-opacity-95 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border-2 border-purple-200 hover:border-purple-400 hover:shadow-purple-500/50 transition-all duration-300 hover:-translate-y-2 hover:scale-105 animate-fadeInUp stagger-${(index % 6) + 1}`}
            >
              {/* Election Header */}
              <div className="mb-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-2xl font-bold text-gray-800 leading-tight flex-1">
                    {election.election_type}
                  </h3>
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg transform group-hover:rotate-12 transition-transform">
                    {index + 1}
                  </div>
                </div>
                
                {/* Election Details */}
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-blue-100 p-2.5 rounded-xl transform transition-all hover:scale-105">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="font-semibold text-gray-600 w-20">State:</span>
                    <span className="text-gray-800 font-medium">{election.state}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-green-100 p-2.5 rounded-xl transform transition-all hover:scale-105">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-semibold text-gray-600 w-20">District:</span>
                    <span className="text-gray-800 font-medium">{election.district}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-purple-100 p-2.5 rounded-xl transform transition-all hover:scale-105">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span className="font-semibold text-gray-600 w-20">Area:</span>
                    <span className="text-gray-800 font-medium">{election.constituency}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-orange-100 p-2.5 rounded-xl transform transition-all hover:scale-105">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-semibold text-gray-600 w-20">Date:</span>
                    <span className="text-gray-800 font-medium">
                      {election.election_date ? new Date(election.election_date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : "Not scheduled"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Candidate Count Badge */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 mb-5 text-center shadow-lg transform transition-all hover:scale-105">
                <p className="text-white text-sm font-medium mb-1">Total Candidates</p>
                <p className="text-white text-4xl font-bold">
                  {Array.isArray(election.candidates) ? election.candidates.length : 0}
                </p>
              </div>

              {/* Candidate Avatars */}
              {Array.isArray(election.candidates) && election.candidates.length > 0 && (
                <div className="mb-5">
                  <p className="text-gray-600 text-xs font-semibold mb-2 uppercase tracking-wide">Candidates Preview</p>
                  <div className="flex -space-x-3 overflow-x-auto pb-2">
                    {election.candidates.slice(0, 8).map((c, idx) => {
                      const src = resolveCandidatePhotoSrc(c);
                      return (
                        <div
                          key={idx}
                          className="relative group/avatar"
                          title={`${c.name || 'Candidate'} ${c.party ? `(${c.party})` : ''}`}
                        >
                          <img
                            src={src}
                            alt={c.name || `candidate-${idx}`}
                            onError={(e) => handlePhotoError(e, src)}
                            className="w-12 h-12 object-cover rounded-full border-3 border-white shadow-lg hover:scale-125 hover:z-10 transition-transform duration-200 cursor-pointer"
                          />
                        </div>
                      );
                    })}
                    {election.candidates.length > 8 && (
                      <div className="w-12 h-12 rounded-full border-3 border-white bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xs shadow-lg hover:scale-125 transition-transform cursor-pointer">
                        +{election.candidates.length - 8}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => setSelectedElection(election)}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3.5 px-5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group/btn transform hover:scale-105"
                >
                  <svg className="w-5 h-5 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>View All Candidates</span>
                </button>

                <button
                  onClick={() => fetchResults(election._id)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3.5 px-5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group/btn transform hover:scale-105"
                >
                  <svg className="w-5 h-5 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Check Results</span>
                </button>

                <button
                  onClick={() => verifyElectionIntegrity(election._id)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-3.5 px-5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group/btn transform hover:scale-105"
                >
                  <svg className="w-5 h-5 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Verify Security</span>
                </button>

                <button
                  onClick={() => openReport(election._id)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-3.5 px-5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group/btn transform hover:scale-105"
                >
                  <svg className="w-5 h-5 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>View Report</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {!loading && elections.length === 0 && (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    className="flex flex-col items-center justify-center py-24 px-4 text-center"
  >
    <div className="relative">
      {/* Background Glow Blob */}
      <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 rounded-full animate-pulse" />
      
      <motion.div 
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="relative bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-3xl shadow-2xl"
      >
        <Vote className="w-16 h-16 text-blue-300 mx-auto mb-4" strokeWidth={1.5} />
        <h3 className="text-2xl font-bold text-white mb-2">No Active Elections</h3>
        <p className="text-blue-200/80 max-w-xs mx-auto">
          The ballot boxes are currently closed. Please check back later for upcoming voting events.
        </p>
      </motion.div>
    </div>
  </motion.div>
)}

        {/* Candidate Modal */}
        {selectedElection && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white p-8 rounded-3xl w-full max-w-3xl relative shadow-2xl max-h-[90vh] overflow-y-auto animate-scaleIn">
              <button
                onClick={() => setSelectedElection(null)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 hover:rotate-90 text-3xl font-bold bg-gray-100 hover:bg-gray-200 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
              >
                ✕
              </button>
              
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="text-3xl font-bold text-gray-800">{selectedElection.election_type}</h3>
                </div>
                <p className="text-gray-600 text-lg">All candidates competing in this election</p>
              </div>

              <div className="space-y-4">
                {selectedElection.candidates.map((c, idx) => {
                  const photoSrc = resolveCandidatePhotoSrc(c);
                  return (
                    <div 
                      key={idx} 
                      className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 p-5 rounded-2xl flex items-center gap-5 hover:shadow-lg transition-all hover:border-purple-300 hover:scale-102 animate-fadeInUp"
                      style={{ animationDelay: `${idx * 0.1}s`, opacity: 0 }}
                    >
                      <img
                        src={photoSrc}
                        alt={`${c.name || "Candidate"} photo`}
                        onError={(e) => handlePhotoError(e, photoSrc)}
                        className="w-24 h-24 object-cover rounded-xl border-4 border-white shadow-lg flex-shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 text-xl mb-1">{c.name || "Unnamed Candidate"}</p>
                        <p className="text-purple-700 font-semibold text-lg mb-3">{c.party || "Independent"}</p>

                        <div className="flex items-center gap-3">
                          <span className="text-gray-600 text-sm font-semibold">Party Symbol:</span>
                          {renderSymbol(c)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Results Modal */}
        {resultElection && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white p-8 rounded-3xl w-full max-w-3xl relative shadow-2xl max-h-[90vh] overflow-y-auto animate-scaleIn">
              <button
                onClick={() => setResultElection(null)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 hover:rotate-90 text-3xl font-bold bg-gray-100 hover:bg-gray-200 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
              >
                ✕
              </button>
              
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="text-3xl font-bold text-gray-800">{resultElection.election_type}</h3>
                </div>
                <p className="text-gray-600 text-lg">Current voting results and tallies</p>
              </div>

              {loadingResult ? (
                <div className="text-center py-16">
                  <div className="inline-block animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-green-500 mb-4"></div>
                  <p className="text-gray-700 text-lg font-medium">Fetching latest results...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-3">
                  {results
                    .sort((a, b) => b.count - a.count)
                    .map((r, idx) => (
                      <div 
                        key={idx} 
                        className={`p-5 rounded-2xl flex justify-between items-center border-2 transition-all hover:shadow-lg animate-fadeInUp ${
                          idx === 0 
                            ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-400' 
                            : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300'
                        }`}
                        style={{ animationDelay: `${idx * 0.1}s`, opacity: 0 }}
                      >
                        <div className="flex items-center gap-4">
                          {idx === 0 && <span className="text-3xl">🏆</span>}
                          {idx === 1 && <span className="text-3xl">🥈</span>}
                          {idx === 2 && <span className="text-3xl">🥉</span>}
                          {idx > 2 && (
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-gray-600 font-bold">#{idx + 1}</span>
                            </div>
                          )}
                          <span className="font-bold text-gray-800 text-lg">{r._id}</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold text-4xl ${idx === 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {r.count}
                          </span>
                          <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">votes</p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-2xl">
                  <svg className="w-20 h-20 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-600 text-lg font-medium">No votes recorded yet</p>
                  <p className="text-gray-500 text-sm mt-2">Results will appear once voting begins</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Verification Modal */}
        {verifyElection && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white p-8 rounded-3xl w-full max-w-4xl relative shadow-2xl max-h-[90vh] overflow-y-auto animate-scaleIn">
              <button
                onClick={() => setVerifyElection(null)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 hover:rotate-90 text-3xl font-bold bg-gray-100 hover:bg-gray-200 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
              >
                ✕
              </button>
              
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <h3 className="text-3xl font-bold text-gray-800">{verifyElection.election_type}</h3>
                </div>
                <p className="text-gray-600 text-lg">Vote integrity verification and security audit</p>
              </div>

              {verifying && (
                <div className="text-center py-16">
                  <div className="inline-block relative mb-6">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
                    <svg className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="text-gray-700 text-lg font-medium">Analyzing vote security...</p>
                  <p className="text-gray-500 text-sm mt-2">This may take a moment</p>
                </div>
              )}

              {verifyData && !verifying && (
                <div className="space-y-6">
                  {verifyData.error ? (
                    <div className="bg-red-50 border-2 border-red-400 text-red-800 p-6 rounded-2xl animate-scaleIn">
                      <div className="flex items-center gap-3 mb-2">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="font-bold text-xl">Verification Failed</p>
                      </div>
                      <p className="text-lg">{verifyData.message}</p>
                    </div>
                  ) : (
                    <>
                      {/* Summary Cards */}
                      <div className="grid grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 p-6 rounded-2xl text-center shadow-lg transform hover:scale-105 transition-transform animate-fadeInUp stagger-1">
                          <svg className="w-12 h-12 mx-auto mb-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-5xl font-bold text-green-700 mb-2">{verifyData.verified_count}</p>
                          <p className="text-green-800 font-semibold text-sm uppercase tracking-wide">Verified Secure</p>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-400 p-6 rounded-2xl text-center shadow-lg transform hover:scale-105 transition-transform animate-fadeInUp stagger-2">
                          <svg className="w-12 h-12 mx-auto mb-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <p className="text-5xl font-bold text-yellow-700 mb-2">{verifyData.corrected_count}</p>
                          <p className="text-yellow-800 font-semibold text-sm uppercase tracking-wide">Issues Found</p>
                        </div>
                      </div>

                      {/* Issues Section */}
                      {verifyData.corrected_count > 0 && (
                        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 animate-fadeInUp stagger-3">
                          <div className="flex items-center gap-3 mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h4 className="font-bold text-red-800 text-2xl">Security Issues Detected</h4>
                          </div>
                          <div className="space-y-3 max-h-80 overflow-y-auto">
                            {verifyData.corrected.map((c, idx) => (
                              <div key={idx} className="bg-white border border-red-200 p-4 rounded-xl hover:shadow-md transition-shadow">
                                <p className="text-gray-800 font-semibold mb-2">
                                  <span className="text-red-600">Transaction ID:</span> {c.transaction_id}
                                </p>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div className="bg-red-100 p-3 rounded-lg">
                                    <p className="text-red-700 font-semibold mb-1 flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      Previous Hash
                                    </p>
                                    <p className="text-red-900 font-mono text-xs break-all">{c.old}</p>
                                  </div>
                                  <div className="bg-green-100 p-3 rounded-lg">
                                    <p className="text-green-700 font-semibold mb-1 flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      Corrected Hash
                                    </p>
                                    <p className="text-green-900 font-mono text-xs break-all">{c.new}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Verified Votes Section */}
                      {verifyData.verified_count > 0 && (
                        <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-6 animate-fadeInUp stagger-4">
                          <div className="flex items-center gap-3 mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <h4 className="font-bold text-green-800 text-2xl">Verified Secure Votes</h4>
                          </div>
                          <div className="space-y-3 max-h-80 overflow-y-auto">
                            {verifyData.verified.map((v, idx) => (
                              <div key={idx} className="bg-white border border-green-200 p-4 rounded-xl flex items-center justify-between hover:shadow-md transition-shadow">
                                <div>
                                  <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-1">Transaction ID</p>
                                  <p className="text-gray-800 font-mono text-sm">{v.transaction_id}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-green-700 font-bold text-lg">{v.candidate}</p>
                                  <p className="text-gray-600 text-sm">Voter: {v.epic_id}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllElections;