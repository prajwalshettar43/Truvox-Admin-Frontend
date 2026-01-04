import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Components
import DistrictAdminForm from "./components/districtAdmin/DistrictAdminForm";
import AdminLoginForm from "./components/districtAdmin/AdminLoginForm";
import AdminDashboard from "./components/districtAdmin/AdminDashboard";
import VoterReg from "./components/voter/VoterReg";
import FaceVerification from "./components/voter/FaceVerification";
import CreateElectionForm from "./components/districtAdmin/CreateElectionForm";
import AllElections from "./components/districtAdmin/AllElections";
import CreateMLA from "./components/districtAdmin/CreateMLA";
import CreateMP from "./components/districtAdmin/CreateMP";
import LandingPage from "./components/home/LandingPage";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import Navbar from "./components/utils/Navbar";
import ElectionReport from "./components/districtAdmin/ElectionReport";

function App() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    const userType = localStorage.getItem("userType");
    if (userEmail && userType === "district") {
      setIsAdminLoggedIn(true);
    }
  }, []);

  const handleLogin = () => setIsAdminLoggedIn(true);

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userType");
    setIsAdminLoggedIn(false);
  };

  return (
    <div>
      <Navbar isAdminLoggedIn={isAdminLoggedIn} onLogout={handleLogout} />

      <Routes>

        {/* -------- PUBLIC ROUTES ---------- */}
        <Route path="/district-login" element={
          isAdminLoggedIn ? <Navigate to="/district-dashboard" replace /> :
          <AdminLoginForm onLoginSuccess={handleLogin} />
        }/>

        <Route path="/district-register" element={<DistrictAdminForm />} />


        {/* -------- PROTECTED ROUTES ---------- */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <LandingPage />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/register" 
          element={
            <ProtectedRoute>
              <VoterReg />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/verify" 
          element={
            <ProtectedRoute>
              <FaceVerification />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/district-dashboard" 
          element={
            <ProtectedRoute>
              <LandingPage />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/create-election" 
          element={
            <ProtectedRoute>
              <CreateElectionForm />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/create-mla" 
          element={
            <ProtectedRoute>
              <CreateMLA />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/create-mp" 
          element={
            <ProtectedRoute>
              <CreateMP />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/view-election" 
          element={
            <ProtectedRoute>
              <AllElections />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/view-election-report/:electionId" 
          element={
            <ProtectedRoute>
              <ElectionReport />
            </ProtectedRoute>
          }
        />
      </Routes>

    </div>
  );
}

export default App;
