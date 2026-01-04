import { useState, useEffect } from "react";
import {karnatakaConstituencies,parliamentaryConstituencies} from '../../data/constituencies'

const enrollVoter = async (voterData, photoFile) => {
  const formData = new FormData();
  
  // Append all fields
  Object.keys(voterData).forEach(key => {
    if (voterData[key]) {
      formData.append(key, voterData[key]);
    }
  });

  if (photoFile) {
    formData.append("photo", photoFile);
  }

  try {
    const response = await fetch("/api/enroll", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API call failed:", error);
    throw error;
  }
};

function Voter() {
  const [formData, setFormData] = useState({
    name: "",
    fatherName: "",
    gender: "",
    dob: "",
    address: "",
    epicId: "",
    photo: null,
    karnatakaConstituencies: "",
    parliamentaryConstituencies: "",
    district: "",
    state: "Karnataka",
  });

  const [errors, setErrors] = useState({});
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [malpracticeScore, setMalpracticeScore] = useState(0);

  // Generate random EPIC ID
  const generateRandomEpicId = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const randomLetters = Array.from({ length: 3 }, () =>
      letters.charAt(Math.floor(Math.random() * letters.length))
    ).join("");

    const randomNumbers = Array.from({ length: 7 }, () =>
      Math.floor(Math.random() * 10)
    ).join("");

    return randomLetters + randomNumbers;
  };

  // Initialize EPIC ID
  useEffect(() => {
    const randomEpicId = generateRandomEpicId();
    setFormData(prev => ({ ...prev, epicId: randomEpicId }));
  }, []);

  // Auto-select district based on selected Karnataka constituency
  useEffect(() => {
    const ac = formData.karnatakaConstituencies;
    if (ac) {
      const match = karnatakaConstituencies.find((c) => c.constituency === ac);
      if (match) {
        setFormData(prev => ({ ...prev, district: match.district }));
      } else {
        setFormData(prev => ({ ...prev, district: "" }));
      }
    } else {
      setFormData(prev => ({ ...prev, district: "" }));
    }
  }, [formData.karnatakaConstituencies]);

  // Malpractice detection
  useEffect(() => {
    let score = 0;
    
    // Check for suspicious patterns
    if (formData.name && formData.name.length < 3) score += 10;
    if (formData.fatherName && formData.fatherName.length < 3) score += 10;
    if (formData.dob) {
      const dob = new Date(formData.dob);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age > 100) score += 20;
      if (age < 18) score += 30;
    }
    if (formData.address && formData.address.length < 10) score += 15;
    
    setMalpracticeScore(Math.min(score, 100));
  }, [formData]);

  const validateCurrentStep = () => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.name.trim()) newErrors.name = "Name is required";
      if (!formData.fatherName.trim()) newErrors.fatherName = "Father's name is required";
      if (!formData.gender) newErrors.gender = "Please select your gender";
      if (!formData.dob) {
        newErrors.dob = "Date of Birth is required";
      } else {
        const today = new Date();
        const dob = new Date(formData.dob);
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
        if (age < 18) {
          newErrors.dob = "You must be at least 18 years old";
        }
      }
      if (!formData.address.trim()) newErrors.address = "Address is required";
    }

    if (currentStep === 2) {
      if (!formData.karnatakaConstituencies) newErrors.karnatakaConstituencies = "Assembly constituency is required";
      if (!formData.photo) newErrors.photo = "Photo is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateFinalForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.fatherName.trim()) newErrors.fatherName = "Father's name is required";
    if (!formData.gender) newErrors.gender = "Please select your gender";
    if (!formData.dob) {
      newErrors.dob = "Date of Birth is required";
    } else {
      const today = new Date();
      const dob = new Date(formData.dob);
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      if (age < 18) {
        newErrors.dob = "You must be at least 18 years old";
      }
    }
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.karnatakaConstituencies) newErrors.karnatakaConstituencies = "Assembly constituency is required";
    if (!formData.photo) newErrors.photo = "Photo is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFinalSubmit = async (e) => {
    
    if (!validateFinalForm()) {
      setCurrentStep(1); // Go back to first step if validation fails
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const voterData = {
        name: formData.name,
        epic: formData.epicId,
        father_name: formData.fatherName,
        dob: formData.dob,
        gender: formData.gender,
        address: formData.address,
        state: formData.state,
        district: formData.district,
        karnatakaConstituencies: formData.karnatakaConstituencies,
        parliamentaryConstituencies: formData.parliamentaryConstituencies,
      };

      const result = await enrollVoter(voterData, formData.photo);

      if (result?.status === "ok") {
        setSubmitMessage("✅ Registration successful!");
        // Reset form
        setFormData({
          name: "",
          fatherName: "",
          gender: "",
          dob: "",
          address: "",
          epicId: generateRandomEpicId(),
          photo: null,
          karnatakaConstituencies: "",
          parliamentaryConstituencies: "",
          district: "",
          state: "Karnataka",
        });
        setPhotoPreview(null);
        setCurrentStep(1);
      } else {
        setSubmitMessage(`❌ ${result?.message || "Registration failed"}`);
      }
    } catch (error) {
      console.error("Enrollment failed:", error);
      setSubmitMessage("❌ Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        setErrors(prev => ({ ...prev, photo: "File size must be less than 1MB" }));
        e.target.value = null;
        return;
      }
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, photo: "Please select an image file" }));
        e.target.value = null;
        return;
      }
      setPhotoPreview(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, photo: file }));
      setErrors(prev => ({ ...prev, photo: "" }));
    }
  };

  const nextStep = () => {
    if (validateCurrentStep() && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getSecurityLevel = () => {
    if (malpracticeScore < 20) return { level: "High", color: "text-green-400" };
    if (malpracticeScore < 50) return { level: "Medium", color: "text-yellow-400" };
    return { level: "Low", color: "text-red-400" };
  };

  const securityLevel = getSecurityLevel();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 ">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none ">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10 mt-25">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            TruVoxx
          </h1>
          
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Progress & Security */}
          <div className="lg:col-span-1 space-y-6">
            {/* Progress Steps */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
              <h3 className="text-white font-semibold mb-4">Registration Progress</h3>
              <div className="space-y-4">
                {[
                  { step: 1, label: "Personal Details" },
                  { step: 2, label: "Location & Photo" },
                  { step: 3, label: "Verification" }
                ].map(({ step, label }) => (
                  <div key={step} className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      step === currentStep 
                        ? 'bg-blue-500 border-blue-400' 
                        : step < currentStep 
                        ? 'bg-green-500 border-green-400' 
                        : 'bg-gray-600 border-gray-500'
                    }`}>
                      <span className="text-white text-sm font-bold">{step}</span>
                    </div>
                    <span className={`font-medium ${
                      step === currentStep ? 'text-blue-300' : 'text-gray-400'
                    }`}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

         
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-6 md:p-8">
              {submitMessage && (
                <div className={`mb-6 p-4 rounded-xl text-center font-semibold ${
                  submitMessage.includes("✅") 
                    ? "bg-green-500/20 border border-green-500/30 text-green-300" 
                    : "bg-red-500/20 border border-red-500/30 text-red-300"
                }`}>
                  {submitMessage}
                </div>
              )}

              <form className="space-y-6">
                {/* Step 1: Personal Details */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="border-b border-white/10 pb-4">
                      <h2 className="text-2xl font-bold text-white mb-2">Personal Information</h2>
                      <p className="text-gray-400">Enter your basic personal details</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-white/80 text-sm font-medium mb-2 block">Full Name *</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          className="w-full rounded-xl px-4 py-3 bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                          placeholder="Enter full name"
                        />
                        {errors.name && <p className="text-red-400 text-sm mt-2">{errors.name}</p>}
                      </div>

                      <div>
                        <label className="text-white/80 text-sm font-medium mb-2 block">Father's Name *</label>
                        <input
                          type="text"
                          value={formData.fatherName}
                          onChange={(e) => handleInputChange("fatherName", e.target.value)}
                          className="w-full rounded-xl px-4 py-3 bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                          placeholder="Enter father's name"
                        />
                        {errors.fatherName && <p className="text-red-400 text-sm mt-2">{errors.fatherName}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-white/80 text-sm font-medium mb-2 block">Gender *</label>
                        <select
                          value={formData.gender}
                          onChange={(e) => handleInputChange("gender", e.target.value)}
                          className="w-full rounded-xl px-4 py-3 bg-white/10 text-white border border-white/20 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                        >
                          <option className="text-black" value="">Select Gender</option>
                          <option className="text-black" value="Male">Male</option>
                          <option className="text-black" value="Female">Female</option>
                          <option className="text-black" value="Other">Other</option>
                        </select>
                        {errors.gender && <p className="text-red-400 text-sm mt-2">{errors.gender}</p>}
                      </div>

                      <div>
                        <label className="text-white/80 text-sm font-medium mb-2 block">Date of Birth *</label>
                        <input
                          type="date"
                          value={formData.dob}
                          onChange={(e) => handleInputChange("dob", e.target.value)}
                          className="w-full rounded-xl px-4 py-3 bg-white/10 text-white border border-white/20 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                        />
                        {errors.dob && <p className="text-red-400 text-sm mt-2">{errors.dob}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="text-white/80 text-sm font-medium mb-2 block">Address *</label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        className="w-full rounded-xl px-4 py-3 bg-white/10 text-white border border-white/20 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all resize-none h-24"
                        placeholder="Enter complete address"
                      />
                      {errors.address && <p className="text-red-400 text-sm mt-2">{errors.address}</p>}
                    </div>
                  </div>
                )}

                {/* Step 2: Location & Photo */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="border-b border-white/10 pb-4">
                      <h2 className="text-2xl font-bold text-white mb-2">Location & Photo</h2>
                      <p className="text-gray-400">Select your constituencies and upload photo</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="text-white/80 text-sm font-medium mb-2 block">Assembly Constituency *</label>
                        <select
                          value={formData.karnatakaConstituencies}
                          onChange={(e) => handleInputChange("karnatakaConstituencies", e.target.value)}
                          className="w-full rounded-xl px-4 py-3 bg-white/10 text-white border border-white/20 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                        >
                          <option className="text-black" value="">Select Assembly Constituency</option>
                          {karnatakaConstituencies.map((ac) => (
                            <option className="text-black" key={ac.id} value={ac.constituency}>
                              {ac.constituency}
                            </option>
                          ))}
                        </select>
                        {errors.karnatakaConstituencies && (
                          <p className="text-red-400 text-sm mt-2">{errors.karnatakaConstituencies}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-white/80 text-sm font-medium mb-2 block">Parliamentary Constituency</label>
                        <select
                          value={formData.parliamentaryConstituencies}
                          onChange={(e) => handleInputChange("parliamentaryConstituencies", e.target.value)}
                          className="w-full rounded-xl px-4 py-3 bg-white/10 text-white border border-white/20 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                        >
                          <option className="text-black" value="">Select Parliamentary Constituency</option>
                          {parliamentaryConstituencies.map((pc) => (
                            <option className="text-black" key={pc.id} value={pc.pc}>
                              {pc.pc}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-white/80 text-sm font-medium mb-2 block">State</label>
                        <input
                          type="text"
                          value={formData.state}
                          disabled
                          className="w-full rounded-xl px-4 py-3 bg-white/5 text-gray-400 border border-white/10 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="text-white/80 text-sm font-medium mb-2 block">District</label>
                        <input
                          type="text"
                          value={formData.district}
                          disabled
                          className="w-full rounded-xl px-4 py-3 bg-white/5 text-gray-400 border border-white/10 cursor-not-allowed"
                          placeholder="Auto-selected based on constituency"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-white/80 text-sm font-medium mb-2 block">Voter Photo *</label>
                      <div className="border-2 border-dashed border-white/20 rounded-xl p-4 text-center hover:border-blue-400/50 transition-all cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                          id="photo-upload"
                        />
                        <label htmlFor="photo-upload" className="cursor-pointer block">
                          {photoPreview ? (
                            <div className="flex flex-col items-center">
                              <img
                                src={photoPreview}
                                alt="Preview"
                                className="w-32 h-32 object-cover rounded-lg border-2 border-white/20 mb-3"
                              />
                              <span className="text-blue-400 text-sm">Click to change photo</span>
                            </div>
                          ) : (
                            <div className="py-6">
                              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="text-2xl text-white">📷</span>
                              </div>
                              <p className="text-white font-medium">Click to upload photo</p>
                              <p className="text-gray-400 text-sm mt-1">JPG, PNG - Max 1MB</p>
                            </div>
                          )}
                        </label>
                      </div>
                      {errors.photo && <p className="text-red-400 text-sm mt-2">{errors.photo}</p>}
                    </div>

                    <div>
                      <label className="text-white/80 text-sm font-medium mb-2 block">EPIC ID</label>
                      <input
                        type="text"
                        value={formData.epicId}
                        readOnly
                        className="w-full rounded-xl px-4 py-3 bg-white/10 text-blue-400 font-mono font-bold border border-white/20 cursor-not-allowed"
                      />
                      <p className="text-gray-400 text-xs mt-1">Automatically generated EPIC ID</p>
                    </div>
                  </div>
                )}

                {/* Step 3: Verification */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="border-b border-white/10 pb-4">
                      <h2 className="text-2xl font-bold text-white mb-2">Verification</h2>
                      <p className="text-gray-400">Review your information before submission</p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-6 space-y-4">
                      <h3 className="text-white font-semibold text-lg mb-4">Registration Summary</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-3">
                          <div>
                            <span className="text-gray-400 block text-xs">Full Name:</span>
                            <p className="text-white font-medium">{formData.name || "Not provided"}</p>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-xs">Father's Name:</span>
                            <p className="text-white font-medium">{formData.fatherName || "Not provided"}</p>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-xs">Gender:</span>
                            <p className="text-white font-medium">{formData.gender || "Not provided"}</p>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-xs">Date of Birth:</span>
                            <p className="text-white font-medium">{formData.dob || "Not provided"}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <span className="text-gray-400 block text-xs">Assembly Constituency:</span>
                            <p className="text-white font-medium">{formData.karnatakaConstituencies || "Not provided"}</p>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-xs">Parliamentary Constituency:</span>
                            <p className="text-white font-medium">{formData.parliamentaryConstituencies || "Not provided"}</p>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-xs">District:</span>
                            <p className="text-white font-medium">{formData.district || "Not provided"}</p>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-xs">EPIC ID:</span>
                            <p className="text-blue-400 font-mono font-bold">{formData.epicId}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-white/10">
                        <span className="text-gray-400 block text-xs mb-2">Address:</span>
                        <p className="text-white">{formData.address || "Not provided"}</p>
                      </div>

                      {photoPreview && (
                        <div className="pt-4 border-t border-white/10">
                          <span className="text-gray-400 block text-xs mb-2">Photo Preview:</span>
                          <img
                            src={photoPreview}
                            alt="Voter preview"
                            className="w-24 h-24 object-cover rounded-lg border-2 border-white/20"
                          />
                        </div>
                      )}
                    </div>

                    
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 border-t border-white/10">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="px-6 py-3 rounded-xl text-white font-medium border border-white/20 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ← Previous
                  </button>

                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-8 py-3 rounded-xl text-white font-semibold bg-blue-600 hover:bg-blue-700 transition-all shadow-lg"
                    >
                      Next Step →
                    </button>
                  ) : (
                    <button
                      // FIX: Changed type from "submit" to "button" to prevent auto-submission
                      type="button"
                      // FIX: Call the submission logic directly via onClick
                      onClick={handleFinalSubmit}
                      disabled={isSubmitting}
                      className="px-8 py-3 rounded-xl text-white font-semibold bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all shadow-lg flex items-center space-x-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <span>✓</span>
                          <span>Complete Registration</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
       
      </div>
    </div>
  );
}

export default Voter;