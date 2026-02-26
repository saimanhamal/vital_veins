import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Users, 
  Building2, 
  Shield, 
  Zap, 
  Globe, 
  ArrowRight,
  CheckCircle,
  Star,
  Droplets,
  TrendingUp,
  Lock
} from 'lucide-react';
import Logo from '../components/UI/Logo';

const LandingPage = () => {
  const features = [
    {
      icon: Heart,
      title: 'Smart Matching',
      description: 'Smart donor-hospital matching based on location, blood type, and availability.',
    },
    {
      icon: Zap,
      title: 'Real-time Alerts',
      description: 'Instant notifications for emergency blood and organ needs.',
    },
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'End-to-end encryption and secure data handling for all users.',
    },
    {
      icon: Globe,
      title: 'Global Network',
      description: 'Connect with hospitals and donors worldwide.',
    },
  ];

  const stats = [
    { number: '10K+', label: 'Lives Saved' },
    { number: '500+', label: 'Hospitals' },
    { number: '50K+', label: 'Donors' },
    { number: '99.9%', label: 'Uptime' },
  ];

  const testimonials = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Chief Medical Officer',
      hospital: 'City General Hospital',
      content: 'VitalVeins has revolutionized our blood management system. The real-time alerts have helped us save countless lives.',
      rating: 5,
    },
    {
      name: 'John Smith',
      role: 'Regular Donor',
      content: 'The platform makes it so easy to find nearby hospitals and book appointments. I feel proud to be part of this community.',
      rating: 5,
    },
    {
      name: 'Dr. Michael Chen',
      role: 'Transplant Surgeon',
      hospital: 'Regional Medical Center',
      content: 'The organ matching system is incredibly efficient. We\'ve seen a 40% reduction in waiting times.',
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            <Logo size="small" variant="full" />

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <Link
                to="/login"
                className="px-6 py-2 text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn-primary"
              >
                Get Started
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Donate Blood,{' '}
                Save Lives
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Connect hospitals, donors, and administrators in one unified platform. 
                Make a difference with smart blood and organ donation management.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register" className="btn-primary text-center">
                  Start Donating Today
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <Link to="/login" className="btn-outline text-center">
                  Hospital Login
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="glass p-8 rounded-3xl">
                <div className="grid grid-cols-2 gap-6">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                      className="text-center"
                    >
                      <div className="text-3xl font-bold text-red-600 mb-2">
                        {stat.number}
                      </div>
                      <div className="text-sm text-gray-600">
                        {stat.label}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Removed floating elements for more natural look */}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white/50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose VitalVeins?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform combines cutting-edge technology with compassionate care 
              to create the most efficient donation management system.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card p-6 text-center hover-lift group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 via-pink-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 relative">
                  {/* Animated background glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300" />
                  <feature.icon className="w-8 h-8 text-white relative z-10" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-16">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              For Everyone
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you're a donor, hospital, or administrator, 
              VitalVeins has the tools you need to make a difference.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="card p-8 text-center group hover:shadow-xl transition-all duration-300"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 via-emerald-500 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300 shadow-lg relative">
                {/* Animated glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-300 to-green-600 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300" />
                <Users className="w-10 h-10 text-white relative z-10" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Donors</h3>
              <ul className="text-left space-y-3 mb-6">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-600">Find nearby hospitals</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-600">Book appointments easily</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-600">Track donation history</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-600">Receive emergency alerts</span>
                </li>
              </ul>
              <Link to="/register" className="btn-success w-full">
                Become a Donor
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="card p-8 text-center group hover:shadow-xl transition-all duration-300"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 via-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300 shadow-lg relative">
                {/* Animated glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-300 to-blue-600 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300" />
                <Building2 className="w-10 h-10 text-white relative z-10" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Hospitals</h3>
              <ul className="text-left space-y-3 mb-6">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-600">Manage inventory</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-600">Create emergency tickets</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-600">Schedule appointments</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-600">Track donor relationships</span>
                </li>
              </ul>
              <Link to="/register" className="btn-secondary w-full">
                Join as Hospital
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="card p-8 text-center group hover:shadow-xl transition-all duration-300"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 via-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300 shadow-lg relative">
                {/* Animated glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-300 to-purple-600 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300" />
                <Shield className="w-10 h-10 text-white relative z-10" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Administrators</h3>
              <ul className="text-left space-y-3 mb-6">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-600">Oversee all operations</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-600">Approve hospital registrations</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-600">Monitor system analytics</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-600">Send broadcast notifications</span>
                </li>
              </ul>
              <Link to="/login" className="btn-outline w-full">
                Admin Login
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white/50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What People Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from our community of donors, hospitals, and medical professionals.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card p-6"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div className="border-t border-gray-200 pt-4">
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {testimonial.role}
                    {testimonial.hospital && ` • ${testimonial.hospital}`}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="py-16">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="glass p-12 rounded-3xl max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Ready to Make a Difference?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Join thousands of donors and hospitals working together to save lives.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register" className="btn-primary">
                  Get Started Today
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <Link to="/login" className="btn-outline">
                  Already have an account?
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container-custom">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">Vv</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">VitalVeins</h3>
                  <p className="text-xs text-gray-400">Smart Donation System</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Connecting hospitals, donors, and administrators to save lives through smart technology.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">For Donors</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/register" className="hover:text-white transition-colors">Register</Link></li>
                <li><Link to="/donor/hospitals" className="hover:text-white transition-colors">Find Hospitals</Link></li>
                <li><Link to="/donor/appointments" className="hover:text-white transition-colors">Book Appointments</Link></li>
                <li><Link to="/donor/history" className="hover:text-white transition-colors">Donation History</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">For Hospitals</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/register" className="hover:text-white transition-colors">Register</Link></li>
                <li><Link to="/hospital/inventory" className="hover:text-white transition-colors">Manage Inventory</Link></li>
                <li><Link to="/hospital/tickets" className="hover:text-white transition-colors">Emergency Tickets</Link></li>
                <li><Link to="/hospital/appointments" className="hover:text-white transition-colors">Appointments</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/login" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
