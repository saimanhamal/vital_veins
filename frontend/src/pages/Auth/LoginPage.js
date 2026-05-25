import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Heart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const LoginPage = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: localStorage.getItem('vv_remembered_email') || '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  // FIX: Track if submit is in progress to prevent double submit
  const [submitting, setSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('vv_remembered_email'));

  const from = location.state?.from?.pathname || null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // FIX: Prevent double submit
    if (submitting || loading) return;
    if (!validateForm()) return;

    // FIX: Remember me — store email if checked
    if (rememberMe) {
      localStorage.setItem('vv_remembered_email', formData.email);
    } else {
      localStorage.removeItem('vv_remembered_email');
    }

    setSubmitting(true);
    try {
      const result = await login(formData);
      if (result.success) {
        if (from) navigate(from, { replace: true });
        // App.js handles role-based redirect on re-render
      } else if (result.error && typeof result.error === 'string' && result.error.toLowerCase().includes('under verification')) {
        setErrors({
          submit: result.error + ' Admin will review your profile and send you an email once approved.'
        });
      } else if (result.error) {
        setErrors({ submit: String(result.error) });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const heartVariants = {
    beat: {
      scale: [1, 1.2, 1],
      transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' }
    }
  };

  // FIX: useMemo so hearts don't regenerate on every render
  const floatingHearts = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 20 + 10,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 10
    }));
  }, []);

  const isLoading = loading || submitting;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-red-50 via-pink-50 to-rose-100 flex items-center justify-center p-4">
      {/* Animated Background Hearts */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingHearts.map((heart) => (
          <motion.div key={heart.id}
            className="absolute text-red-200"
            style={{ left: `${heart.x}%`, top: `${heart.y}%`, fontSize: `${heart.size}px` }}
            animate={{ y: [-20, -100, -20], opacity: [0.3, 0.7, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: heart.duration, repeat: Infinity, delay: heart.delay, ease: 'easeInOut' }}
          >
            <Heart fill="currentColor" />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Link to="/"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-red-600 mb-8 transition-colors duration-200">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>

        <div className="bg-white/90 backdrop-blur-sm shadow-2xl rounded-3xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              variants={heartVariants}
              animate="beat"
              className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <Heart className="w-10 h-10 text-white" fill="currentColor" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your VitalVeins account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {errors.submit && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                <p className="font-medium">{errors.submit}</p>
              </motion.div>
            )}

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter your email" autoComplete="email" />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input type={showPassword ? 'text' : 'password'} id="password" name="password"
                  value={formData.password} onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter your password" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-red-600 transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <Link to="/forgot-password"
                className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit — disabled during loading to prevent double submit */}
            <motion.button type="submit"
              disabled={isLoading}
              whileHover={!isLoading ? { scale: 1.02 } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
              className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <>
                  <Heart className="w-5 h-5 mr-2" fill="currentColor" />
                  Sign In
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-red-600 hover:text-red-700 font-medium transition-colors">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;