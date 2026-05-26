import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Context
import { useAuth } from './contexts/AuthContext';

// Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import RegistrationSuccessPage from './pages/Auth/RegistrationSuccessPage';
import PendingApprovalPage from './pages/Auth/PendingApprovalPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import AdminDashboard from './pages/Admin/AdminDashboard';
import HospitalDashboard from './pages/Hospital/HospitalDashboard';
import DonorDashboard from './pages/Donor/DonorDashboard';
import ProfilePage from './pages/Profile/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Admin Pages
import AdminHospitals from './pages/Admin/AdminHospitals';
import AdminDonors from './pages/Admin/AdminDonors';
import AdminTickets from './pages/Admin/AdminTickets';
import AdminAnalytics from './pages/Admin/AdminAnalytics';
import AdminAppointments from './pages/Admin/AdminAppointments';
import AdminRewards from './pages/Admin/AdminRewards';

// Hospital Pages
import HospitalInventory from './pages/Hospital/HospitalInventory';
import HospitalTickets from './pages/Hospital/HospitalTickets';
import HospitalAppointments from './pages/Hospital/HospitalAppointments';
import HospitalDonors from './pages/Hospital/HospitalDonors';

// Donor Pages
import DonorHospitals from './pages/Donor/DonorHospitals';
import DonorAppointments from './pages/Donor/DonorAppointments';
import DonorTickets from './pages/Donor/DonorTickets';
import DonorHistory from './pages/Donor/DonorHistory';
import DonorRewards from './pages/Donor/DonorRewards';

function App() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading VitalVeins...</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public Routes */}
        {/* FIX: Redirect logged-in users away from landing page to their dashboard */}
        <Route
          path="/"
          element={
            isAuthenticated && user
              ? <Navigate to={`/${user.role}/dashboard`} replace />
              : <LandingPage />
          }
        />

        {/* FIX: Redirect logged-in users away from login/register */}
        <Route
          path="/login"
          element={isAuthenticated && user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated && user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <RegisterPage />}
        />

        {/* Registration Success Page */}
        <Route path="/registration-success" element={<RegistrationSuccessPage />} />
        <Route path="/pending-approval" element={<PendingApprovalPage />} />

        {/* FIX: Added missing forgot-password route */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Admin Protected Routes */}
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="hospitals" element={<AdminHospitals />} />
                <Route path="donors" element={<AdminDonors />} />
                <Route path="tickets" element={<AdminTickets />} />
                <Route path="appointments" element={<AdminAppointments />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="rewards" element={<AdminRewards />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="" element={<Navigate to="dashboard" replace />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />

        {/* Hospital Protected Routes */}
        <Route path="/hospital/*" element={
          <ProtectedRoute allowedRoles={['hospital']}>
            <Layout>
              <Routes>
                <Route path="dashboard" element={<HospitalDashboard />} />
                <Route path="inventory" element={<HospitalInventory />} />
                <Route path="tickets" element={<HospitalTickets />} />
                <Route path="appointments" element={<HospitalAppointments />} />
                <Route path="donors" element={<HospitalDonors />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="" element={<Navigate to="dashboard" replace />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />

        {/* Donor Protected Routes */}
        <Route path="/donor/*" element={
          <ProtectedRoute allowedRoles={['donor']}>
            <Layout>
              <Routes>
                <Route path="dashboard" element={<DonorDashboard />} />
                <Route path="hospitals" element={<DonorHospitals />} />
                <Route path="appointments" element={<DonorAppointments />} />
                <Route path="tickets" element={<DonorTickets />} />
                <Route path="history" element={<DonorHistory />} />
                <Route path="rewards" element={<DonorRewards />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="" element={<Navigate to="dashboard" replace />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />

        {/* Universal dashboard redirect */}
        <Route
          path="/dashboard"
          element={
            user
              ? <Navigate to={`/${user.role}/dashboard`} replace />
              : <Navigate to="/login" replace />
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;