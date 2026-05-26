import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Mail, Home, CheckCircle2 } from 'lucide-react';

const PendingApprovalPage = () => {
  const navigate = useNavigate();

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
            <Clock className="w-24 h-24 text-yellow-500" strokeWidth={1.5} />
          </motion.div>

          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            ⏳ Registration Submitted!
          </h1>
          <p className="text-xl text-gray-600 font-medium mb-2">
            Your account is pending admin approval
          </p>
          <p className="text-gray-500">
            Our admin team will review your profile and approve your account soon
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div variants={itemVariants} className="card p-8 mb-8">
          {/* Steps */}
          <div className="mb-10">
            <h2 className="text-lg font-bold text-gray-900 mb-6 text-center">What Happens Next</h2>

            <div className="space-y-4">
              <motion.div
                variants={itemVariants}
                className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg border border-green-200"
              >
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Step 1: Account Created ✓</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Your account has been created and is now being reviewed by our admin team.
                  </p>
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="flex items-start space-x-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200"
              >
                <Clock className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Step 2: Admin Review (In Progress)</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Our admin team will review your profile within <strong>24-48 hours</strong>.
                  </p>
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
              >
                <Mail className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Step 3: You'll Receive an Email</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Once approved, you'll receive a confirmation email. Then you can login and access your dashboard!
                  </p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-8" />

          {/* Important Info */}
          <motion.div variants={itemVariants} className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="font-bold text-gray-900 mb-3">📧 Check Your Email</h3>
            <p className="text-sm text-gray-600 mb-3">
              We've sent a confirmation email to your registered email address. Please keep an eye on your inbox for our approval notification.
            </p>
            <p className="text-sm text-gray-600">
              <strong>Didn't receive it?</strong> Check your spam or junk folder.
            </p>
          </motion.div>

          {/* FAQ */}
          <motion.div variants={itemVariants}>
            <h3 className="font-bold text-gray-900 mb-3">❓ Questions?</h3>
            <p className="text-sm text-gray-600">
              If you have any questions or don't receive approval within 48 hours, please contact our support team at <strong>support@vitalveins.com</strong>
            </p>
          </motion.div>
        </motion.div>

        {/* Action Button */}
        <motion.div variants={itemVariants} className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')}
            className="flex items-center justify-center space-x-2 px-8 py-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
          >
            <Home className="w-5 h-5" />
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

export default PendingApprovalPage;
