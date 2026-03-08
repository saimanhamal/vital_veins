import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Building2, 
  Shield, 
  Zap, 
  Globe, 
  ArrowRight,
  CheckCircle,
  Star,
  Droplets,
  Lock,
  Menu,
  X,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from 'lucide-react';
import Logo from '../components/UI/Logo';

const LandingPage = () => {
  // VITAL VEINS HOME UI: State management for mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // VITAL VEINS HOME UI: Blood availability data
  const bloodAvailability = [
    { type: 'A+', available: 65, icon: 'A+', color: '#E8192C', bgColor: '#D1FAE5', status: 'Available' },
    { type: 'O-', available: 25, icon: 'O-', color: '#E8192C', bgColor: '#FEE2E2', status: 'Critical' },
    { type: 'B+', available: 45, icon: 'B+', color: '#E8192C', bgColor: '#D1FAE5', status: 'Available' },
    { type: 'AB+', available: 35, icon: 'AB+', color: '#F59E0B', bgColor: '#FEF3C7', status: 'Low' }
  ];

  // VITAL VEINS HOME UI: Testimonials data
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Regular Donor',
      quote: 'I\'ve been donating blood every 3 months for the past 5 years. The Vital Veins app makes it so easy to schedule appointments and track my donations. It\'s rewarding to know I\'m helping save lives.',
      avatar: 'https://i.pravatar.cc/48?img=1',
      rating: 5
    },
    {
      name: 'David Chen',
      role: 'Recipient',
      quote: 'After my accident, I needed multiple blood transfusions. Thanks to the quick response from Vital Veins donors, I received the rare blood type I needed. I\'m forever grateful.',
      avatar: 'https://i.pravatar.cc/48?img=3',
      rating: 5
    },
    {
      name: 'Michael Thompson',
      role: 'Hospital Administrator',
      quote: 'Vital Veins has revolutionized how our hospital manages blood supply. The real-time inventory tracking and emergency request system have helped us respond quickly to critical situations.',
      avatar: 'https://i.pravatar.cc/48?img=5',
      rating: 4
    }
  ];

  // VITAL VEINS HOME UI: How it works steps
  const steps = [
    {
      number: 1,
      title: 'Register as Donor',
      description: 'Create your profile, add your blood type, and set your location preferences.',
      icon: Heart,
      bgColor: '#FEE2E2'
    },
    {
      number: 2,
      title: 'Schedule Donation',
      description: 'Book appointments at nearby donation centers or respond to urgent requests.',
      icon: Heart,
      bgColor: '#D1FAE5'
    },
    {
      number: 3,
      title: 'Save Lives',
      description: 'Your donation helps patients in critical need and supports medical treatments.',
      icon: Heart,
      bgColor: '#FEE2E2'
    },
    {
      number: 4,
      title: 'Earn Rewards',
      description: 'Get badges, track your impact, and join our community of life-savers.',
      icon: Star,
      bgColor: '#CCFBF1'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* VITAL VEINS HOME UI: Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r border-b border-gray-200" style={{ backgroundImage: 'linear-gradient(to right, #fff 0%, #FFF5F5 50%, #fff 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* VITAL VEINS HOME UI: Logo/Brand */}
            <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center shadow-lg">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold italic" style={{ color: '#E8192C', fontFamily: 'DM Sans' }}>
                Vital Veins
              </span>
            </Link>

            {/* VITAL VEINS HOME UI: Right Section - Login & Register */}
            <div className="hidden md:flex items-center space-x-4">
              <Link 
                to="/login"
                className="px-6 py-2 text-gray-700 hover:text-white font-semibold transition-all duration-300 rounded-lg hover:bg-gradient-to-r hover:from-gray-400 hover:to-gray-500"
                style={{ fontFamily: 'DM Sans' }}
              >
                Login
              </Link>
              <Link 
                to="/register"
                className="px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl text-white bg-gradient-to-r hover:from-red-600 hover:to-red-700"
                style={{ backgroundColor: '#E8192C', fontFamily: 'DM Sans', backgroundImage: 'linear-gradient(to right, #E8192C, #C8102E)' }}
              >
                Register
              </Link>
            </div>

            {/* VITAL VEINS HOME UI: Mobile Menu Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* VITAL VEINS HOME UI: Hero Section */}
      <section className="pt-24 mt-20 relative h-auto min-h-[520px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=1600"
            alt="Blood donation"
            className="w-full h-full object-cover"
          />
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to right, rgba(0,0,0,0.82) 35%, rgba(0,0,0,0.15) 100%)'
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-12 w-full">
          <div className="relative">
            {/* VITAL VEINS HOME UI: Hero Headline */}
            <div className="mb-6">
              <h1 className="text-6xl font-bold text-white mb-2" style={{ fontFamily: 'DM Serif Display' }}>
                Every Drop Counts,
              </h1>
              <h1 className="text-6xl font-bold italic mb-2" style={{ fontFamily: 'DM Serif Display', color: '#E8192C' }}>
                Save Lives
              </h1>
              <h1 className="text-6xl font-bold text-white" style={{ fontFamily: 'DM Serif Display' }}>
                Today
              </h1>
            </div>

            {/* VITAL VEINS HOME UI: Hero Subtext */}
            <p className="text-base mb-8 leading-relaxed max-w-sm" style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'DM Sans' }}>
              Join our community of donors and help save lives. Your donation can make a difference for someone in need.
            </p>

            {/* VITAL VEINS HOME UI: CTA Button */}
            <Link 
              to="/register"
              className="inline-block px-8 py-4 font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-2xl text-white hover:from-red-600 hover:to-red-700 hover:brightness-110"
              style={{ backgroundColor: '#E8192C', fontFamily: 'DM Sans', backgroundImage: 'linear-gradient(to right, #E8192C, #C8102E)' }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* VITAL VEINS HOME UI: Current Blood Availability Section */}
      <section className="py-32 px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-4xl font-bold text-gray-900" style={{ fontFamily: 'DM Sans', fontWeight: 700 }}>
              Current Blood Availability
            </h2>
            <a href="#" className="font-semibold transition-colors" style={{ color: '#E8192C', fontSize: '14px' }}>
              View all blood types →
            </a>
          </div>

          {/* VITAL VEINS HOME UI: Blood Type Cards */}
          <div className="grid md:grid-cols-4 gap-5">
            {bloodAvailability.map((blood) => (
              <motion.div
                key={blood.type}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-white border border-gray-200 rounded-3xl p-6 text-center hover:-translate-y-1 transition-all duration-300"
              >
                <div 
                  className="text-5xl font-black mb-3 text-center rounded-2xl p-4"
                  style={{ color: blood.color }}
                >
                  {blood.type}
                </div>
                <p className="text-xs text-gray-500 font-bold mb-4 uppercase tracking-wide">Blood Type</p>
                
                {/* VITAL VEINS HOME UI: Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3" style={{ backgroundColor: '#FEE2E2' }}>
                  <div 
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${blood.available}%`,
                      backgroundColor: blood.color
                    }}
                  />
                </div>
                
                {/* VITAL VEINS HOME UI: Availability Badge */}
                <div 
                  className="inline-block px-3 py-1 rounded-full text-xs font-bold mt-2"
                  style={{
                    backgroundColor: blood.status === 'Critical' ? '#FEE2E2' : '#D1FAE5',
                    color: blood.status === 'Critical' ? '#991B1B' : '#065F46'
                  }}
                >
                  {blood.status === 'Critical' ? 'Critical' : ''} {blood.available}%
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* VITAL VEINS HOME UI: How It Works Section */}
      <section className="py-24 px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* VITAL VEINS HOME UI: Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'DM Sans', fontWeight: 700 }}>
              How It Works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: 'DM Sans', fontSize: '15px' }}>
              Our platform connects blood donors with those in need, making the process simple, efficient, and life-saving.
            </p>
          </motion.div>

          {/* VITAL VEINS HOME UI: Step Cards */}
          <div className="grid md:grid-cols-4 gap-5">
            {steps.map((step) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: step.number * 0.1 }}
                viewport={{ once: true }}
                className="bg-white border border-gray-200 rounded-3xl p-7 text-center hover:-translate-y-1.5 transition-all duration-300"
              >
                {/* VITAL VEINS HOME UI: Icon Circle */}
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: step.bgColor }}
                >
                  <step.icon className="w-7 h-7" style={{ color: '#E8192C' }} />
                </div>
                
                <h3 className="font-bold text-gray-900 mb-3 text-base" style={{ fontFamily: 'DM Sans' }}>
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed" style={{ fontFamily: 'DM Sans' }}>
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* VITAL VEINS HOME UI: Emergency CTA Banner Section */}
      <section className="py-20 px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="rounded-3xl p-12 flex items-center justify-between gap-8"
            style={{ backgroundColor: '#E8192C' }}
          >
            {/* VITAL VEINS HOME UI: Emergency Text Content */}
            <div className="flex-1">
              <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'DM Sans', fontWeight: 700 }}>
                Need Blood Urgently?
              </h2>
              <p className="text-white/90 mb-6 leading-relaxed max-w-lg" style={{ fontFamily: 'DM Sans', fontSize: '15px' }}>
                In critical situations, our emergency request system can help you find donors quickly. We'll broadcast your request to nearby matching donors.
              </p>
              <Link 
                to="/emergency-request"
                className="inline-block px-7 py-3.5 bg-white font-bold rounded-lg transition-all hover:bg-gray-50"
                style={{ color: '#E8192C' }}
              >
                Create Emergency Request
              </Link>
            </div>

            {/* VITAL VEINS HOME UI: Emergency Icon Circle */}
            <div 
              className="w-32 h-32 rounded-full flex items-center justify-center flex-shrink-0 border-2"
              style={{
                borderColor: 'rgba(255,255,255,0.3)'
              }}
            >
              <Droplets className="w-14 h-14 text-white" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* VITAL VEINS HOME UI: Success Stories Section */}
      <section className="py-24 px-8" style={{ backgroundColor: '#FAFAFA' }}>
        <div className="max-w-7xl mx-auto">
          {/* VITAL VEINS HOME UI: Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'DM Sans', fontWeight: 700 }}>
              Success Stories
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: 'DM Sans', fontSize: '15px' }}>
              Hear from donors and recipients who have experienced the impact of blood donation.
            </p>
          </motion.div>

          {/* VITAL VEINS HOME UI: Testimonial Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl p-7 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300"
              >
                {/* VITAL VEINS HOME UI: Avatar & Name */}
                <div className="flex items-center space-x-4 mb-4">
                  <img 
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm" style={{ fontFamily: 'DM Sans' }}>
                      {testimonial.name}
                    </h4>
                    <p className="text-xs text-gray-600">{testimonial.role}</p>
                  </div>
                </div>

                {/* VITAL VEINS HOME UI: Stars */}
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  {[...Array(5 - testimonial.rating)].map((_, i) => (
                    <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
                  ))}
                </div>

                {/* VITAL VEINS HOME UI: Quote */}
                <p className="text-gray-700 text-sm leading-relaxed" style={{ fontFamily: 'DM Sans' }}>
                  "{testimonial.quote}"
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* VITAL VEINS HOME UI: Ready to Make a Difference CTA */}
      <section className="py-24 px-8 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'DM Sans', fontWeight: 700 }}>
              Ready to Make a Difference?
            </h2>
            <p className="text-gray-600 mb-10 max-w-2xl mx-auto" style={{ fontFamily: 'DM Sans', fontSize: '16px' }}>
              Join our community of donors and help save lives. Your donation can make a difference for someone in need.
            </p>

            {/* VITAL VEINS HOME UI: CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register"
                className="px-8 py-3.5 font-semibold rounded-lg inline-flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105"
                style={{ backgroundColor: '#E8192C', color: 'white' }}
              >
                <Heart className="w-5 h-5" />
                Register as Donor
              </Link>
              <Link 
                to="/login"
                className="px-8 py-3.5 font-semibold rounded-lg inline-flex items-center justify-center"
                style={{
                  backgroundColor: 'white',
                  color: '#1A1A1A',
                  border: '2px solid #1A1A1A'
                }}
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* VITAL VEINS HOME UI: Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16 px-8">
        <div className="max-w-7xl mx-auto">
          {/* VITAL VEINS HOME UI: Footer Content Grid */}
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            
            {/* VITAL VEINS HOME UI: Brand Column */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl font-bold italic" style={{ color: '#E8192C', fontFamily: 'DM Sans' }}>
                  Vital Veins
                </span>
              </div>
              <p className="text-sm leading-relaxed mb-6 max-w-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Connecting donors with those in need, saving lives one donation at a time.
              </p>
              
              {/* VITAL VEINS HOME UI: Social Icons */}
              <div className="flex gap-3">
                {[Facebook, Twitter, Instagram, Linkedin].map((Icon, idx) => (
                  <button
                    key={idx}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-red-600"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </button>
                ))}
              </div>
            </div>

            {/* VITAL VEINS HOME UI: Quick Links Column */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4" style={{ fontFamily: 'DM Sans' }}>
                Quick Links
              </h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Home</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Donate Blood</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Find Blood</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Emergency Request</a></li>
              </ul>
            </div>

            {/* VITAL VEINS HOME UI: Resources Column */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4" style={{ fontFamily: 'DM Sans' }}>
                Resources
              </h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">FAQs</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blood Donation Guide</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Eligibility Criteria</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blood Types Explained</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Support Center</a></li>
              </ul>
            </div>

            {/* VITAL VEINS HOME UI: Newsletter Column */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4" style={{ fontFamily: 'DM Sans' }}>
                Newsletter
              </h4>
              <p className="text-gray-400 text-xs mb-4" style={{ fontFamily: 'DM Sans' }}>
                Subscribe to our newsletter for updates on blood drives and critical needs.
              </p>
              <div className="flex">
                <input 
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-4 py-3 bg-white/10 text-white placeholder-gray-500 outline-none text-sm"
                  style={{ borderRadius: '8px 0 0 8px' }}
                />
                <button 
                  className="px-5 py-3 font-bold text-white text-sm transition-all"
                  style={{ backgroundColor: '#E8192C', borderRadius: '0 8px 8px 0' }}
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* VITAL VEINS HOME UI: Footer Bottom */}
          <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row items-center justify-between">
            <p className="text-xs text-gray-500" style={{ color: 'rgba(255,255,255,0.5)' }}>
              © 2025 Vital Veins. All rights reserved.
            </p>
            <div className="flex gap-6 text-xs mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
              <span className="text-gray-600">·</span>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
              <span className="text-gray-600">·</span>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Accessibility</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
