import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import NotRegistered from './pages/NotRegistered';
import DonorDashboard from './pages/donor/Dashboard';
import DonorProfile from './pages/donor/Profile';
import DonorHistory from './pages/donor/History';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminSchedule from './pages/admin/Schedule';
import AdminAppointments from './pages/admin/Appointments';
import AdminRegistrationRequests from './pages/admin/RegistrationRequests';
import Navbar from './components/Navbar';

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Caricamento...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !user.is_admin) {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

function AppContent() {
  const { user } = useAuth();

  return (
    <div className="App">
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/not-registered" element={<NotRegistered />} />

        {/* Donor Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DonorDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <DonorProfile />
            </PrivateRoute>
          }
        />
        <Route
          path="/history"
          element={
            <PrivateRoute>
              <DonorHistory />
            </PrivateRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <PrivateRoute adminOnly>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <PrivateRoute adminOnly>
              <AdminUsers />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/schedule"
          element={
            <PrivateRoute adminOnly>
              <AdminSchedule />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/appointments"
          element={
            <PrivateRoute adminOnly>
              <AdminAppointments />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/registration-requests"
          element={
            <PrivateRoute adminOnly>
              <AdminRegistrationRequests />
            </PrivateRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

function App() {
  // Usa basename solo per GitHub Pages (non per localhost)
  const basename = process.env.NODE_ENV === 'production' ? process.env.PUBLIC_URL : '';

  return (
    <Router basename={basename}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
