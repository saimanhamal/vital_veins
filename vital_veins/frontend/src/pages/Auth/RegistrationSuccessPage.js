import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Heart, Building2, Clock, Mail, ArrowRight, Home } from 'lucide-react';

const RegistrationSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'donor';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const isDonor = role === 'donor';
  const timelineSteps = isDonor
    ? [
        { status: 'done', label: 'Account Created', icon: '✓', color: 'bg-green-500' },
        { status: 'pending', label: 'Admin Review', icon: '⏳', color: 'bg-yellow-500' },
        { status: 'pending', label: 'Approved & Ready', icon: '✓', color: 'bg-blue-500' }
      ]
    : [
        { status: 'done', label: 'Account Created', icon: '✓', color: 'bg-green-500' },
        { status: 'pending', label: 'Under Review', icon: '⏳', color: 'bg-yellow-500' },
        { status: 'pending', label: 'Approved', icon: '✓', color: 'bg-blue-500' }
      ];

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 py-12">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
            className="flex justify-center mb-6"
          >
            {isDonor ? (
              <Clock className="w-24 h-24 text-yellow-500" strokeWidth={1.5} />
            ) : (
              <CheckCircle2 className="w-24 h-24 text-green-500" strokeWidth={1.5} />
            )}
          </motion.div>

          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {isDonor ? '⏳ Registration Submitted!' : '🎉 Welcome to VitalVeins!'}
          </h1>
          <p className="text-xl text-gray-600 font-medium mb-2">
            {isDonor
              ? 'Your account is pending admin approval'
              : 'Hospital Registration Received'}
          </p>
          <p className="text-gray-500">
            {isDonor
              ? 'Our admin team will review your profile and approve your account soon'
              : 'Your account is being verified and will be activated soon'}
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div variants={itemVariants} className="card p-8 mb-8">
          {/* Timeline */}
          <div className="mb-10">
            <h2 className="text-lg font-bold text-gray-900 mb-6 text-center">What Happens Next</h2>

            <div className="flex items-center justify-between relative">
              {/* Connecting Line */}
              <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 -z-10" />

              {/* Steps */}
              {timelineSteps.map((step, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="flex flex-col items-center relative z-10 flex-1"
                >
                  {/* Circle Badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + idx * 0.2 }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mb-3 shadow-lg ${
                      step.status === 'done' ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    {step.icon}
                  </motion.div>

                  {/* Label */}
                  <p className="text-sm font-semibold text-center text-gray-700 w-24">
                    {step.label}
                  </p>

                  {/* Status Badge */}
                  {step.status === 'pending' && (
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-xs text-gray-500 mt-1"
                    >
                      {idx === 1 ? 'in progress' : 'pending'}
                    </motion.span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-8" />

          {/* Info Section */}
          <motion.div variants={itemVariants} className="space-y-5 mb-8">
            {/* Email Check */}
            <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Mail className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">Check Your Email</p>
                <p className="text-sm text-gray-600 mt-1">
                  We've sent a verification email to your registered email address. Please check your inbox (and spam folder).
                </p>
              </div>
            </div>

            {/* Timeline Info */}
            <div className="flex items-start space-x-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <Clock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">Review Process</p>
                <p className="text-sm text-gray-600 mt-1">
                  Our admin team will review your {isDonor ? 'donor' : 'hospital'} profile within <strong>24-48 hours</strong>.
                  {isDonor
                    ? " You'll receive an email confirming your account activation."
                    : " You'll receive verification once complete."
                  }
                </p>
              </div>
            </div>

            {/* What to Do */}
            <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <Heart className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">
                  {isDonor ? 'Ready to Help?' : 'Ready to Request?'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {isDonor
                    ? 'Once approved, you can log in and start your journey as a blood/organ donor.'
                    : 'Once verified, you can access your hospital dashboard to create donation requests.'
                  }
                </p>
              </div>
            </div>
          </motion.div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-8" />

          {/* FAQ Section */}
          <motion.div variants={itemVariants}>
            <p className="text-sm text-gray-600 mb-3 font-semibold">Questions?</p>
            <p className="text-sm text-gray-600">
              If you don't receive a verification email within 2 hours, please check your spam folder or contact our support team.
            </p>
          </motion.div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
          {!isDonor && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/login')}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              <span>Go to Login</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </motion.button>
        </motion.div>

        {/* Footer Text */}
        <motion.p variants={itemVariants} className="text-center text-sm text-gray-500 mt-8">
          Thank you for joining VitalVeins. Together, we save lives. ❤️
        </motion.p>
      </motion.div>
    </div>
  );
};

export default RegistrationSuccessPage;
