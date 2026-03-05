import { useState, useEffect } from "react";

// API function (include this at the top or import from separate file)
const enrollVoter = async (voterData, photoFile) => {
  const formData = new FormData();
  formData.append('name', voterData.name);
  formData.append('epic', voterData.epic);
  if (voterData.father_name) formData.append('father_name', voterData.father_name);
  if (voterData.dob) formData.append('dob', voterData.dob);
  if (voterData.gender) formData.append('gender', voterData.gender);
  if (voterData.address) formData.append('address', voterData.address);
  formData.append('photo', photoFile);

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/enroll`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
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
  });
  const [errors, setErrors] = useState({});
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  // Generate random EPIC ID
  const generateRandomEpicId = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomLetters = Array.from({ length: 3 }, () => 
      letters.charAt(Math.floor(Math.random() * letters.length))
    ).join('');
    
    const randomNumbers = Array.from({ length: 7 }, () => 
      Math.floor(Math.random() * 10)
    ).join('');
    
    return randomLetters + randomNumbers;
  };

  useEffect(() => {
    const randomEpicId = generateRandomEpicId();
    setFormData(prev => ({ ...prev, epicId: randomEpicId }));
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.fatherName.trim()) newErrors.fatherName = "Father's name is required";
    if (!formData.gender) newErrors.gender = "Please select your gender";
    if (!formData.dob) {
      newErrors.dob = "Date of Birth is required";
    } else {
      const today = new Date();
      const dob = new Date(formData.dob);
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 18) {
        newErrors.dob = "You must be at least 18 years old";
      }
    }
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.photo) newErrors.photo = "Photo is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitMessage("");
    setErrors({});

    try {
      const voterData = {
        name: formData.name,
        epic: formData.epicId,
        father_name: formData.fatherName,
        dob: formData.dob,
        gender: formData.gender,
        address: formData.address,
      };

      const result = await enrollVoter(voterData, formData.photo);
      
      if (result.status === "ok") {
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
        });
        setPhotoPreview(null);
      } else {
        setSubmitMessage(`❌ ${result.message}`);
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
      setPhotoPreview(URL.createObjectURL(file));
      handleInputChange("photo", file);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-6">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl w-full max-w-md p-6">
        <h1 className="text-2xl font-bold text-center text-white mb-6">
          Voter Registration
        </h1>

        {submitMessage && (
          <div className="mb-4 p-3 rounded-lg bg-white/20 text-white text-center">
            {submitMessage}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="w-full rounded-lg px-3 py-2 bg-white/20 text-white placeholder-gray-300 border border-white/30 focus:outline-none focus:border-green-400"
              placeholder="Full Name"
            />
            {errors.name && <p className="text-red-300 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <input
              type="text"
              value={formData.fatherName}
              onChange={(e) => handleInputChange("fatherName", e.target.value)}
              className="w-full rounded-lg px-3 py-2 bg-white/20 text-white placeholder-gray-300 border border-white/30 focus:outline-none focus:border-green-400"
              placeholder="Father's Name"
            />
            {errors.fatherName && <p className="text-red-300 text-sm mt-1">{errors.fatherName}</p>}
          </div>

          <div>
            <select
              value={formData.gender}
              onChange={(e) => handleInputChange("gender", e.target.value)}
              className="w-full rounded-lg px-3 py-2 bg-white/20 text-white border border-white/30 focus:outline-none focus:border-green-400"
            >
              <option value="">Select Gender</option>
              <option value="Male" className="text-black">Male</option>
              <option value="Female" className="text-black">Female</option>
              <option value="Transgender" className="text-black">Transgender</option>
            </select>
            {errors.gender && <p className="text-red-300 text-sm mt-1">{errors.gender}</p>}
          </div>

          <div>
            <input
              type="date"
              value={formData.dob}
              onChange={(e) => handleInputChange("dob", e.target.value)}
              className="w-full rounded-lg px-3 py-2 bg-white/20 text-white border border-white/30 focus:outline-none focus:border-green-400"
            />
            {errors.dob && <p className="text-red-300 text-sm mt-1">{errors.dob}</p>}
          </div>

          <div>
            <textarea
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              className="w-full rounded-lg px-3 py-2 bg-white/20 text-white border border-white/30 focus:outline-none focus:border-green-400 resize-none h-16"
              placeholder="Address"
            />
            {errors.address && <p className="text-red-300 text-sm mt-1">{errors.address}</p>}
          </div>

          <div>
            <input
              type="text"
              value={formData.epicId}
              className="w-full rounded-lg px-3 py-2 bg-white/20 text-white border border-white/30 focus:outline-none"
              placeholder="EPIC ID"
              readOnly
            />
          </div>

          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="w-full rounded-lg px-3 py-2 bg-white/20 text-white border border-white/30 focus:outline-none cursor-pointer"
            />
            {photoPreview && (
              <img
                src={photoPreview}
                alt="Preview"
                className="mt-2 w-20 h-20 object-cover rounded-lg border border-white/40 mx-auto"
              />
            )}
            {errors.photo && <p className="text-red-300 text-sm mt-1">{errors.photo}</p>}
          </div>

          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl text-white font-semibold shadow-lg transition-all duration-300 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Registering..." : "Register"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Voter;