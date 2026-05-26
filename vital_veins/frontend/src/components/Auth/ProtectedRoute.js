import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../UI/LoadingSpinner';
import { Clock, AlertTriangle, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  // Not logged in — redirect to login with return url
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Wrong role — redirect to their own dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  // FIX: Pending account — show informative screen instead of broken dashboard
  const isPending =
    (user.role === 'donor' && user.status && user.status !== 'active') ||
    (user.role === 'hospital' && user.status === 'pending');

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-red-50 to-rose-100 p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center"
        >
          {/* Animated clock icon */}
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)' }}
          >
            <Clock className="w-10 h-10 text-amber-500" />
          </motion.div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">Account Under Review</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Your <strong>{user.role}</strong> account is currently being reviewed by our admin team.
            You'll receive an email at <strong>{user.email}</strong> once your account is approved and ready to use.
          </p>

          <div className="p-4 rounded-2xl mb-6 text-left space-y-2" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
            <div className="flex items-center space-x-2 text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span><strong>What happens next?</strong></span>
            </div>
            <ul className="text-xs text-amber-700 space-y-1 pl-6 list-disc">
              <li>Admin reviews your profile and documents</li>
              <li>You'll receive an approval email within 24–48 hours</li>
              <li>Once approved, you can access all features</li>
            </ul>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #E8192C, #C8102E)' }}
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </motion.button>

          <p className="text-xs text-gray-400 mt-4">
            Need help? Contact{' '}
            <a href="mailto:support@vitalveins.com" className="text-red-500 hover:underline">
              support@vitalveins.com
            </a>
          </p>
        </motion.div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;