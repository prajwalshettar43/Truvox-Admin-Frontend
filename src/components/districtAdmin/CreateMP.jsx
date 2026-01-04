// CreateMLAFromPCCandidates.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { parliamentaryConstituencies } from "../../data/constituencies";
import { ChevronDown, MapPin, User, Flag, AlertCircle, CheckCircle, Loader2, Landmark } from "lucide-react";

export default function CreateMP() {
  const navigate = useNavigate();

  const [electionType] = useState("MP Election");
  const [stateName] = useState("Karnataka");
  const [district, setDistrict] = useState("");
  const [electionDate, setElectionDate] = useState("");
  const [constituency, setConstituency] = useState(""); // pc id string

  const [data, setData] = useState(null); // raw array returned by GetPC_CandidateDetails (same shape as PCCandidates.jsx)
  const [candidates, setCandidates] = useState([]); // normalized for display & payload
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // === exact unwrap from your PCCandidates.jsx ===
  const unwrap = (value) => {
    let parsed = value;
    let safety = 0;
    while (safety++ < 15) {
      // [{ d: "..." }]
      if (Array.isArray(parsed) && parsed.length === 1 && parsed[0] && typeof parsed[0].d === "string") {
        try { parsed = JSON.parse(parsed[0].d); continue; } catch { break; }
      }
      // { d: "..." }
      if (!Array.isArray(parsed) && parsed && typeof parsed === "object" && typeof parsed.d === "string") {
        try { parsed = JSON.parse(parsed.d); continue; } catch { break; }
      }
      // JSON string
      if (typeof parsed === "string") {
        try { parsed = JSON.parse(parsed); continue; } catch { break; }
      }
      break;
    }
    return parsed;
  };

  // === fetch using the same endpoint & logic as PCCandidates.jsx ===
  const fetchPCCandidates = async (pcId) => {
    setData(null);
    setCandidates([]);
    if (!pcId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/kgis/election/Election.asmx/GetPC_CandidateDetails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ pc_code: pcId }),
      });

      const text = await res.text();
      let outer;
      try { outer = JSON.parse(text); } catch { outer = text; }

      const unwrapped = unwrap(outer);

      // normalize to array
      let arr = Array.isArray(unwrapped) ? unwrapped : [unwrapped];

      // If elements are objects with d string, parse each and flatten
      arr = arr.flatMap((item) => {
        if (item && typeof item === "object" && typeof item.d === "string") {
          try {
            const inner = JSON.parse(item.d);
            return Array.isArray(inner) ? inner : [inner];
          } catch { return [item]; }
        }
        return Array.isArray(item) ? item : [item];
      });

      // keep raw data for debugging / display
      setData(arr);

      // normalize into candidate list suitable for CreateMLA payload
      const normalized = arr
        .flatMap((it) => (Array.isArray(it) ? it : [it]))
        .filter(Boolean)
        .map((c) => {
          const cand = c && typeof c === "object" ? c : {};
          const name = cand.Candidate_Name ?? cand.CandidateName ?? "";
          const party = cand.Party_Name ?? cand.PartyName ?? "";
          const rawSymbol = cand.Symbol ?? cand.Symbol_Name ?? "";
          const symbol = String(rawSymbol).split(":")[0];

          // photo: strip data: prefix if present and validate-ish
          let rawBase64 = "";
          let photo_url = null;
          if (cand.Candidate_Photo) {
            try {
              let maybe = String(cand.Candidate_Photo);
              if (maybe.startsWith("data:")) {
                const comma = maybe.indexOf(",");
                if (comma !== -1) maybe = maybe.slice(comma + 1);
              }
              const cleaned = maybe.replace(/\s+/g, "");
              if (/^[A-Za-z0-9+/=]+$/.test(cleaned) && cleaned.length >= 80) {
                rawBase64 = cleaned;
                photo_url = `data:image/jpeg;base64,${cleaned}`;
              } else {
                rawBase64 = ""; // not usable
              }
            } catch {
              rawBase64 = "";
            }
          }

          return {
            name,
            party,
            symbol,
            photo_url,
            _photo_base64_raw: rawBase64,
          };
        })
        .filter(Boolean);

      setCandidates(normalized);
    } catch (err) {
      console.error("fetch error (GetPC_CandidateDetails):", err);
      setError("Failed to fetch PC candidates");
      setData(null);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  // when constituency (PC) changes
  const onConstituencyChange = (pcId) => {
    setConstituency(pcId);
    // try to set district from the list if present
    const found = parliamentaryConstituencies.find((p) => String(p.id) === String(pcId));
    // logic preserved: uses .pc key for display/district
    if (found) {
        setDistrict(found.pc);
    }
    fetchPCCandidates(pcId);
  };

  // submit: same create logic as your CreateMLA
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const candidatesPayload = candidates.map((c) => ({
        name: String(c.name ?? ""),
        party: String(c.party ?? ""),
        symbol: String(c.symbol ?? ""),
        candidate_photo_base64: String(c._photo_base64_raw ?? ""),
      }));

      const found = parliamentaryConstituencies.find((p) => String(p.id) === String(constituency));
      const consisName = found ? (found.pc ?? found.constituency ?? String(found.id)) : String(constituency);

      const payload = {
        election_type: String(electionType ?? ""),
        state: String(stateName ?? ""),
        district: String(district ?? ""),
        election_date: String(electionDate ?? ""),
        constituency: String(consisName ?? ""),
        candidates: candidatesPayload,
      };

      console.log("Create payload:", payload);

      const resp = await axios.post("http://localhost:8000/election/create", payload, {
        headers: { "Content-Type": "application/json" },
        validateStatus: (status) => status < 500,
      });

      if (resp.status === 200 || resp.status === 201) {
        setMessage("Election created successfully!");
        return;
      }

      if (resp.status === 422) {
        const detail = resp.data?.detail;
        if (Array.isArray(detail)) {
          const msg = detail
            .map((d) => (d.loc && d.msg ? `${d.loc.join(" > ")}: ${d.msg}` : JSON.stringify(d)))
            .join("; ");
          setError(msg);
        } else {
          setError(JSON.stringify(resp.data));
        }
        return;
      }

      setError(resp.data?.detail || `Server returned status ${resp.status}`);
    } catch (err) {
      console.error("Request failed:", err);
      if (err.response) {
        setError(err.response.data?.detail || `Request failed with status ${err.response.status}`);
      } else {
        setError(err.message || "Unknown error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 font-sans pt-25">
      <div className="w-full max-w-4xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden flex flex-col">
        
        {/* Header Section */}
        <div className="p-8 border-b border-white/10 bg-black/20">
          <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200 tracking-wide flex items-center justify-center gap-3">
            <Landmark className="text-purple-300" size={32}/> Create MP Election
          </h2>
          <p className="text-center text-slate-400 mt-2 text-sm">
            Setup Parliamentary Constituency election details
          </p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Constituency (PC) - Spans full width */}
              <div className="col-span-1 md:col-span-2">
                <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-purple-300">
                  Parliamentary Constituency
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-slate-950/50 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none appearance-none transition-all"
                    value={constituency}
                    onChange={(e) => onConstituencyChange(e.target.value)}
                    required
                  >
                    <option value="" className="bg-slate-900">-- Select Parliamentary Constituency --</option>
                    {parliamentaryConstituencies.map((pc) => (
                      <option key={pc.id} value={String(pc.id)} className="bg-slate-900">
                        {pc.id} - {pc.pc ?? pc.constituency}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400">
                    <ChevronDown size={20} />
                  </div>
                </div>
              </div>

              {/* Election Type */}
              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Election Type
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-800/40 border border-slate-700/50 text-slate-400 rounded-xl px-4 py-3 cursor-not-allowed"
                  value={electionType}
                  readOnly
                />
              </div>

              {/* Election Date */}
              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-purple-300">
                  Election Date
                </label>
                <input
                  type="date"
                  className="w-full bg-slate-950/50 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  value={electionDate}
                  onChange={(e) => setElectionDate(e.target.value)}
                  required
                />
              </div>

              {/* State */}
              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  State
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-slate-800/40 border border-slate-700/50 text-slate-400 rounded-xl pl-10 pr-4 py-3 cursor-not-allowed"
                    value={stateName}
                    disabled
                  />
                  <MapPin className="absolute left-3 top-3.5 text-slate-600" size={18} />
                </div>
              </div>

              {/* District */}
              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  District / PC Name
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-slate-800/40 border border-slate-700/50 text-slate-400 rounded-xl pl-10 pr-4 py-3 cursor-not-allowed"
                    value={district || "Auto-filled"}
                    disabled
                  />
                  <MapPin className="absolute left-3 top-3.5 text-slate-600" size={18} />
                </div>
              </div>
            </div>

            {/* Candidates Section */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <User size={20} className="text-purple-400"/> Candidates List
                </h3>
                <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-full">
                  Count: {candidates.length}
                </span>
              </div>

              {loading && (
                <div className="flex flex-col items-center justify-center py-12 text-purple-300">
                  <Loader2 className="animate-spin mb-3" size={32} />
                  <p className="text-sm">Fetching PC candidates...</p>
                </div>
              )}

              {candidates.length === 0 && !loading && (
                <div className="text-center py-12 bg-black/20 rounded-2xl border border-dashed border-slate-700">
                  <p className="text-slate-500 text-sm">Select a Parliamentary Constituency to load candidates.</p>
                </div>
              )}

              {/* Candidate Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {candidates.map((c, i) => (
                  <div key={i} className="bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/50 rounded-xl p-4 flex gap-4 items-center transition-all duration-200 hover:scale-[1.01] hover:shadow-lg group">
                    {/* Photo */}
                    <div className="flex-shrink-0">
                      {c.photo_url ? (
                        <img
                          src={c.photo_url}
                          alt={c.name}
                          className="w-16 h-16 object-cover rounded-lg border-2 border-purple-500/30 group-hover:border-purple-400 shadow-md"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center border border-slate-600 text-slate-500">
                          <User size={24} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{c.name}</p>
                      <p className="text-xs text-purple-300 truncate font-medium">{c.party}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                        <Flag size={12} />
                        <span className="truncate">Symbol: <span className="text-slate-200">{c.symbol}</span></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Messages */}
            {message && (
              <div className="bg-green-500/20 border border-green-500/50 text-green-200 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                <CheckCircle size={20} />
                <span>{message}</span>
              </div>
            )}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                <AlertCircle size={20} className="mt-0.5 shrink-0" />
                <span className="whitespace-pre-wrap text-sm">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.98]
                ${loading 
                  ? "bg-slate-700 cursor-not-allowed" 
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 hover:shadow-purple-500/25"
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={20} /> Processing...
                </span>
              ) : (
                "Create Election"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}