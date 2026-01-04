import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, User, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

const FaceVerification = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [malpracticeScore, setMalpracticeScore] = useState(0);

  // Start camera
  const startCamera = async () => {
    try {
      setError(''); // Clear any previous errors
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser');
      }

      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user' // Front-facing camera
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setShowCamera(true);
      
      // Wait a bit for the video element to be ready
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(e => {
            console.error('Error playing video:', e);
            setError('Failed to start video playback');
          });
        }
      }, 100);
      
    } catch (err) {
      console.error('Camera access error:', err);
      let errorMessage = 'Failed to access camera: ';
      
      switch (err.name) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
          errorMessage += 'Permission denied. Please allow camera access and try again.';
          break;
        case 'NotFoundError':
        case 'DevicesNotFoundError':
          errorMessage += 'No camera found on this device.';
          break;
        case 'NotReadableError':
        case 'TrackStartError':
          errorMessage += 'Camera is already in use by another application.';
          break;
        case 'OverconstrainedError':
          errorMessage += 'Camera constraints not supported.';
          break;
        case 'SecurityError':
          errorMessage += 'Camera access blocked due to security restrictions.';
          break;
        default:
          errorMessage += err.message || 'Unknown error occurred.';
      }
      
      setError(errorMessage);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        setSelectedImage(blob);
        setPreviewUrl(canvas.toDataURL());
        stopCamera();
      }, 'image/jpeg', 0.8);
    }
  };

  // Handle file upload
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Verify face
  const verifyFace = async () => {
    if (!userId.trim()) {
      setError('Please enter a User ID');
      return;
    }
    
    if (!selectedImage) {
      setError('Please select or capture an image');
      return;
    }

    setIsVerifying(true);
    setError('');
    setVerificationResult(null);

    try {
      const formData = new FormData();
      formData.append('epic', userId);
      formData.append('photo', selectedImage, 'verification_image.jpg');

      const response = await fetch('/api/verify', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      console.log(result);

      if (response.ok) {
        setVerificationResult(result);
        // Update malpractice score based on verification result
        if (result.match && result.match_score >= 0.7) {
          setMalpracticeScore(0); // High trust
        } else if (result.match && result.match_score >= 0.5) {
          setMalpracticeScore(30); // Medium trust
        } else {
          setMalpracticeScore(80); // Low trust
        }
      } else {
        let errorMessage = 'Verification failed';
        
        if (result.detail) {
          if (Array.isArray(result.detail)) {
            errorMessage = result.detail.map(err => `${err.loc?.join?.('.')} - ${err.msg}`).join(', ');
          } else if (typeof result.detail === 'string') {
            errorMessage = result.detail;
          } else {
            errorMessage = JSON.stringify(result.detail);
          }
        }
        
        setError(errorMessage);
        setMalpracticeScore(100); // High risk on error
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Network error: ' + err.message);
      setMalpracticeScore(100);
    } finally {
      setIsVerifying(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedImage(null);
    setPreviewUrl('');
    setVerificationResult(null);
    setError('');
    setUserId('');
    setMalpracticeScore(0);
    stopCamera();
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
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
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
          {/* Left Sidebar - Security Monitor */}
          <div className="lg:col-span-1 space-y-6">
            
           

            {/* Instructions */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
              <h3 className="text-white font-semibold mb-4">Verification Guide</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs mt-0.5">1</div>
                  <span>Enter your registered User ID</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs mt-0.5">2</div>
                  <span>Capture or upload a clear face photo</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs mt-0.5">3</div>
                  <span>Wait for AI-powered verification</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Verification Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-6 md:p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Face Verification</h2>
                <p className="text-gray-400">Verify your identity using advanced facial recognition</p>
              </div>

              {/* User ID Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  <User className="inline w-4 h-4 mr-2" />
                  User ID
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter your user ID"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                  disabled={isVerifying}
                />
              </div>

              {/* Image Capture/Upload Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Verification Image
                </label>
                
                {/* Camera View */}
                {showCamera && (
                  <div className="mb-4">
                    <div className="relative max-w-md mx-auto">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full rounded-xl border-2 border-white/20"
                        style={{ transform: 'scaleX(-1)' }}
                        onLoadedMetadata={() => {
                          console.log('Video metadata loaded');
                        }}
                        onError={(e) => {
                          console.error('Video error:', e);
                          setError('Video playback error');
                        }}
                      />
                      <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
                        LIVE
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4 justify-center">
                      <button
                        onClick={capturePhoto}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      >
                        📸 Capture Photo
                      </button>
                      <button
                        onClick={stopCamera}
                        className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Image Preview */}
                {previewUrl && !showCamera && (
                  <div className="mb-4 text-center">
                    <div className="relative inline-block">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-xs rounded-xl border-2 border-white/20"
                      />
                      <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
                        READY
                      </div>
                    </div>
                  </div>
                )}

                {/* Capture/Upload Buttons */}
                {!showCamera && !previewUrl && (
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={startCamera}
                      className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-medium"
                      disabled={isVerifying}
                    >
                      <Camera className="w-4 h-4" />
                      Use Camera
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium"
                      disabled={isVerifying}
                    >
                      <Upload className="w-4 h-4" />
                      Upload Image
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                  <div className="flex items-center text-red-300">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Verification Result */}
              {verificationResult && (
                <div className={`mb-6 p-5 rounded-xl border ${
                  verificationResult.match 
                    ? 'bg-green-500/20 border-green-500/30' 
                    : 'bg-red-500/20 border-red-500/30'
                }`}>
                  <div className={`flex items-center mb-3 ${
                    verificationResult.match ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {verificationResult.match ? (
                      <CheckCircle className="w-6 h-6 mr-2" />
                    ) : (
                      <XCircle className="w-6 h-6 mr-2" />
                    )}
                    <span className="font-bold text-lg">
                      {verificationResult.match ? 'Verification Successful' : 'Verification Failed'}
                    </span>
                  </div>
                  
                  <div className="text-white/90 space-y-2">
                    <div>
                      <span className="font-medium">Confidence Score: </span>
                      <span className={verificationResult.match_score >= 0.7 ? 'text-green-300' : 'text-red-300'}>
                        {(verificationResult.match_score * 100).toFixed(1)}%
                      </span>
                    </div>
                    {verificationResult.is_live !== undefined && (
                      <div>
                        <span className="font-medium">Liveness Check: </span>
                        <span className={verificationResult.is_live ? 'text-green-300' : 'text-red-300'}>
                          {verificationResult.is_live ? 'Passed' : 'Failed'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={verifyFace}
                  disabled={isVerifying || !userId.trim() || !selectedImage}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all font-semibold"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Verify Face
                    </>
                  )}
                </button>
                
                <button
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all font-medium"
                  disabled={isVerifying}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
       
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default FaceVerification;