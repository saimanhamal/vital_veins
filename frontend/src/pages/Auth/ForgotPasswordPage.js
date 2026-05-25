import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, Droplets } from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/api/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setSent(true); // Don't reveal if email exists
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #fff5f5 0%, #fff 50%, #fff5f5 100%)' }}>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div key={i} className="absolute rounded-full"
            style={{ width: Math.random() * 100 + 40, height: Math.random() * 100 + 40, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, background: '#E8192C' }}
            animate={{ y: [-20, 20, -20], opacity: [0.05, 0.12, 0.05] }}
            transition={{ duration: Math.random() * 5 + 5, repeat: Infinity, delay: i * 0.5 }} />
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10">

        <Link to="/login" className="inline-flex items-center space-x-2 text-gray-600 hover:text-red-600 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Login</span>
        </Link>

        <div className="bg-white/90 backdrop-blur-sm shadow-2xl rounded-3xl p-8 border border-white/20">
          {!sent ? (
            <>
              <div className="text-center mb-8">
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #E8192C, #C8102E)' }}>
                  <Droplets className="w-10 h-10 text-white" />
                </motion.div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
                <p className="text-gray-500 text-sm">Enter your email and we'll send you a reset link.</p>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-6">
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    <input type="email" value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      placeholder="Enter your registered email" />
                  </div>
                </div>

                <motion.button type="submit" disabled={loading}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-white shadow-lg disabled:opacity-50 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #E8192C, #C8102E)' }}>
                  {loading ? <LoadingSpinner size="sm" /> : 'Send Reset Link'}
                </motion.button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Remember your password?{' '}
                  <Link to="/login" className="font-medium hover:underline" style={{ color: '#E8192C' }}>Sign in</Link>
                </p>
              </div>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 100 }} className="flex justify-center mb-6">
                <CheckCircle className="w-20 h-20 text-green-500" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Check Your Email</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                If an account exists for <strong>{email}</strong>, we've sent a password reset link. Check your inbox and spam folder.
              </p>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/login')}
                className="w-full py-3 rounded-xl font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #E8192C, #C8102E)' }}>
                Back to Login
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;