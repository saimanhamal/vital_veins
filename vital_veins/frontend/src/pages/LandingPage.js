import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Heart, Droplets, MapPin, Calendar, AlertTriangle, Search,
  ChevronDown, ChevronUp, Star, ArrowRight, Phone, Menu, X,
  CheckCircle, Clock, Shield, Users, Zap, Activity,
  Facebook, Twitter, Instagram, Linkedin, Send,
  Building2, Award
} from 'lucide-react';

const LandingPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeBloodFilter, setActiveBloodFilter] = useState('All');
  const [eligibilityChecked, setEligibilityChecked] = useState({ age: false, weight: false, health: false });
  const [openFaq, setOpenFaq] = useState(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [donationStep, setDonationStep] = useState(0);
  const mapRef = useRef(null);

  // Scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Role-aware navigation handlers
  const handleDonateNow = () => {
    if (isAuthenticated) navigate(`/${user.role}/dashboard`);
    else navigate('/register');
  };

  const handleFindBlood = () => {
    if (isAuthenticated && user.role === 'donor') navigate('/donor/hospitals');
    else if (isAuthenticated) navigate(`/${user.role}/dashboard`);
    else navigate('/register');
  };

  const handleSchedule = () => {
    if (isAuthenticated && user.role === 'donor') navigate('/donor/appointments');
    else if (isAuthenticated) navigate(`/${user.role}/dashboard`);
    else navigate('/register');
  };

  const handleEmergency = () => {
    if (isAuthenticated && user.role === 'donor') navigate('/donor/tickets');
    else if (isAuthenticated && user.role === 'hospital') navigate('/hospital/tickets');
    else navigate('/login');
  };

  const handleViewFullMap = () => {
    if (isAuthenticated && user.role === 'donor') navigate('/donor/hospitals');
    else navigate('/register');
  };

  const handleLogin = () => navigate('/login');
  const handleRegister = () => navigate('/register');

  // Blood availability data
  const bloodAvailability = [
    { type: 'A+', available: 65, status: 'Available', units: 142 },
    { type: 'O-', available: 25, status: 'Critical', units: 31 },
    { type: 'B+', available: 45, status: 'Available', units: 98 },
    { type: 'AB+', available: 35, status: 'Low', units: 54 },
    { type: 'A-', available: 55, status: 'Available', units: 87 },
    { type: 'B-', available: 20, status: 'Critical', units: 18 },
    { type: 'AB-', available: 40, status: 'Low', units: 44 },
    { type: 'O+', available: 70, status: 'Available', units: 201 },
  ];

  const bloodTypes = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const filteredBlood = activeBloodFilter === 'All'
    ? bloodAvailability
    : bloodAvailability.filter(b => b.type === activeBloodFilter);

  // Donation process steps
  const donationSteps = [
    { title: 'Registration', icon: Users, desc: 'Fill in a registration form with your contact details, blood type and basic info. Bring ID/photo ID and donor card if you have one.' },
    { title: 'Screening', icon: Shield, desc: "A nurse checks your hemoglobin, blood pressure, pulse and temperature. Private one-on-one health interview." },
    { title: 'Donation', icon: Droplets, desc: 'Actual donation takes 8-10 minutes. Approx. 450ml of blood collected. Staff monitor you throughout the process.' },
    { title: 'Recovery', icon: Heart, desc: 'Relax for 10-15 minutes. Enjoy refreshments. Staff available to answer questions.' },
  ];

  // Eligibility criteria
  const basicRequirements = [
    'Be at least 17 years old (16 with parental consent in some states)',
    'Weigh at least 110 pounds (50 kg)',
    'Be in good general health and feeling well on donation day',
    'Have not donated blood in the last 56 days',
  ];

  const medicalConditions = [
    { q: 'Recent Illness', a: 'Be in good health — no active infections, colds or flu at time of donation.' },
    { q: 'Medications', a: 'Some medications may affect your eligibility to donate. Check with staff.' },
    { q: 'Recent Travel', a: 'Some travel may affect your eligibility to donate. Please check beforehand.' },
  ];

  // FAQ data
  const faqs = [
    { q: 'How quickly can I donate blood after a healing surgery?', a: 'Recovery from surgery typically requires at least 6 months before you can donate. Emergency requests are processed immediately and matched based on medical urgency.' },
    { q: 'What if my blood type is rare or not listed?', a: 'Even if your type isn\'t listed, please register. Rare types are often the most urgently needed. Our team will contact you when there\'s a match.' },
    { q: 'Are there any restrictions associated with recent tattoos?', a: 'Yes. If you\'ve had a tattoo in the last 3 months, please check with the donation center. Requirements vary by state and facility.' },
    { q: 'Why is some blood rejected when it is received?', a: 'Blood can be rejected due to low hemoglobin, infections, or improper storage. All donated blood is tested before use.' },
    { q: 'Can I request blood for a scheduled surgery?', a: 'Yes. It\'s recommended to pre-arrange 3 days before a scheduled surgery so that blood can be confirmed and reserved.' },
    { q: 'How long does it take to donate blood?', a: 'The entire process takes about 45–60 minutes. The actual blood draw is only 8–10 minutes.' },
  ];

  // Testimonials
  const testimonials = [
    { name: 'Robert Wilson', role: 'Regular Donor', avatar: 'https://i.pravatar.cc/48?img=11', rating: 5, quote: 'I started donating after my daughter needed a transfusion. VitalVeins made it so easy to find centers and schedule. Each donation reminds me why this matters so much.' },
    { name: 'Jennifer Martinez', role: 'Recipient', avatar: 'https://i.pravatar.cc/48?img=16', rating: 5, quote: 'After my accident I needed rare AB- blood. Within hours VitalVeins had matched me with a donor nearby. I literally owe my life to this platform and the generous donors.' },
    { name: 'Dr. James Washington', role: 'Hospital Director', avatar: 'https://i.pravatar.cc/48?img=15', rating: 5, quote: 'As an ER director, blood availability is critical. VitalVeins has transformed how we manage emergency inventory. Real-time tracking has saved countless lives in our department.' },
  ];

  // Stats
  const stats = [
    { value: '50,000+', label: 'Lives Saved', icon: Heart },
    { value: '12,000+', label: 'Active Donors', icon: Users },
    { value: '300+', label: 'Partner Hospitals', icon: Building2 },
    { value: '98%', label: 'Match Success Rate', icon: Award },
  ];

  const getStatusColor = (status) => {
    if (status === 'Critical') return { bg: '#FEE2E2', text: '#991B1B', bar: '#E8192C' };
    if (status === 'Low') return { bg: '#FEF3C7', text: '#92400E', bar: '#F59E0B' };
    return { bg: '#D1FAE5', text: '#065F46', bar: '#10B981' };
  };

  const fadeUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── NAVBAR ── */}
    {/* ── NAVBAR ── Modern glassmorphism */}
<nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
  scrolled
    ? 'bg-white/95 backdrop-blur-xl shadow-lg shadow-black/5'
    : 'bg-transparent'
}`}>
  <div className="max-w-7xl mx-auto px-4 sm:px-8">
    <div className="flex items-center justify-between h-20">

      {/* Logo */}
      <Link to="/" className="flex items-center space-x-2.5 hover:opacity-80 transition-opacity">
        <svg width="38" height="38" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="32" fill="#E8192C" />
          <circle cx="32" cy="32" r="26" fill="white" />
          <path d="M32 12 C32 12 16 30 16 40 C16 50 23 57 32 57 C41 57 48 50 48 40 C48 30 32 12 32 12Z" fill="#E8192C" />
          <path d="M20 40 L25 40 L28 30 L32 50 L36 36 L39 40 L44 40" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="leading-tight">
          <div>
            <span className="text-xl font-black italic" style={{ color: '#E8192C' }}>Vital</span>
            <span className={`text-xl font-black italic transition-colors ${scrolled ? 'text-gray-900' : 'text-white'}`}>Veins</span>
          </div>
        </div>
      </Link>

      {/* Desktop nav — pill style */}
      <div className={`hidden md:flex items-center rounded-full px-2 py-1.5 ${scrolled ? 'bg-gray-100' : 'bg-white/10 backdrop-blur-sm'}`}>
        {[
          { label: 'Home', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
          { label: 'How It Works', action: () => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }) },
          { label: 'Find Blood', action: () => document.getElementById('find-blood')?.scrollIntoView({ behavior: 'smooth' }) },
          { label: 'Donate', action: () => document.getElementById('donate')?.scrollIntoView({ behavior: 'smooth' }) },
        ].map((item) => (
          <motion.button key={item.label}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
            onClick={item.action}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              scrolled ? 'text-gray-600 hover:text-gray-900 hover:bg-white' : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}>
            {item.label}
          </motion.button>
        ))}
      </div>

      {/* Right actions */}
      <div className="hidden md:flex items-center space-x-2">
        {/* SOS pulsing button */}
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={handleEmergency}
          className="relative flex items-center space-x-1.5 px-4 py-2 rounded-full font-bold text-sm text-white overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #E8192C, #C8102E)' }}>
          <motion.span
            animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 rounded-full"
            style={{ background: '#E8192C' }}
          />
          <AlertTriangle className="w-4 h-4 relative z-10" />
          <span className="relative z-10">SOS</span>
        </motion.button>

        {/* Login — outlined with color */}
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={handleLogin}
          className={`px-5 py-2 rounded-full font-semibold text-sm border-2 transition-all ${
            scrolled
              ? 'border-red-500 text-red-600 hover:bg-red-500 hover:text-white'
              : 'border-white/70 text-white hover:bg-white hover:text-red-600'
          }`}>
          Login
        </motion.button>

        {/* Register — solid */}
        <motion.button whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
          onClick={handleRegister}
          className="px-5 py-2 rounded-full font-bold text-sm text-white shadow-lg shadow-red-500/30 transition-all"
          style={{ background: 'linear-gradient(135deg, #E8192C, #C8102E)' }}>
          Register Free →
        </motion.button>
      </div>

      {/* Mobile hamburger */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className={`md:hidden p-2 rounded-xl transition-colors ${scrolled ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}>
        {mobileMenuOpen
          ? <X className={`w-6 h-6 ${scrolled ? 'text-gray-900' : 'text-white'}`} />
          : <Menu className={`w-6 h-6 ${scrolled ? 'text-gray-900' : 'text-white'}`} />}
      </motion.button>
    </div>
  </div>

  {/* Mobile menu */}
  <AnimatePresence>
    {mobileMenuOpen && (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="md:hidden mx-4 mb-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)' }}>
        <div className="p-4 space-y-1">
          {[
            { label: 'Home', action: () => { window.scrollTo({ top: 0, behavior: 'smooth' }); setMobileMenuOpen(false); } },
            { label: 'How It Works', action: () => { document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); } },
            { label: 'Find Blood', action: () => { document.getElementById('find-blood')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); } },
            { label: 'Donate', action: () => { document.getElementById('donate')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); } },
          ].map(item => (
            <button key={item.label} onClick={item.action}
              className="w-full text-left px-4 py-3 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm">
              {item.label}
            </button>
          ))}
          <div className="pt-2 border-t border-gray-100 space-y-2">
            <button onClick={() => { handleEmergency(); setMobileMenuOpen(false); }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #E8192C, #C8102E)' }}>
              <AlertTriangle className="w-4 h-4" /><span>Emergency SOS</span>
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { handleLogin(); setMobileMenuOpen(false); }}
                className="px-4 py-3 rounded-xl text-red-600 font-bold text-sm border-2 border-red-500 hover:bg-red-50 transition-colors">
                Login
              </button>
              <button onClick={() => { handleRegister(); setMobileMenuOpen(false); }}
                className="px-4 py-3 rounded-xl text-white font-bold text-sm"
                style={{ background: '#E8192C' }}>
                Register
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
</nav>

      {/* ── HERO SECTION ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=1800&q=80" alt="Blood donation" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg, rgba(0,0,0,0.88) 40%, rgba(0,0,0,0.3) 100%)' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 w-full py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Hero text */}
            <div>
              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full mb-6 text-sm font-semibold" style={{ background: 'rgba(232,25,44,0.15)', color: '#ff6b7a', border: '1px solid rgba(232,25,44,0.3)' }}>
                  <Activity className="w-4 h-4" />
                  <span>Live Blood Availability Tracking</span>
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-2" style={{ fontFamily: 'DM Serif Display, serif' }}>
                  Every Drop Counts,
                </h1>
                <h1 className="text-5xl lg:text-6xl font-bold italic leading-tight mb-2" style={{ fontFamily: 'DM Serif Display, serif', color: '#E8192C' }}>
                  Save Lives
                </h1>
                <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6" style={{ fontFamily: 'DM Serif Display, serif' }}>
                  Today
                </h1>
                <p className="text-white/80 text-lg mb-8 max-w-md leading-relaxed">
                  Join our community of life-savers. Connect with hospitals, schedule donations, and respond to emergencies — all in one platform.
                </p>

                <div className="flex flex-wrap gap-3 mb-10">
                  <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}
                    onClick={handleDonateNow}
                    className="flex items-center space-x-2 px-7 py-3.5 rounded-xl font-bold text-white shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #E8192C, #C8102E)', boxShadow: '0 8px 25px rgba(232,25,44,0.4)' }}>
                    <Heart className="w-5 h-5" fill="currentColor" />
                    <span>Donate Now</span>
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}
                    onClick={handleFindBlood}
                    className="flex items-center space-x-2 px-7 py-3.5 rounded-xl font-bold border-2 border-white text-white hover:bg-white hover:text-gray-900 transition-all">
                    <Search className="w-5 h-5" />
                    <span>Find Blood</span>
                  </motion.button>
                </div>

                {/* Stats row */}
                <div className="flex flex-wrap gap-6">
                  {stats.slice(0, 3).map((s, i) => (
                    <div key={i} className="text-center">
                      <div className="text-2xl font-black text-white">{s.value}</div>
                      <div className="text-xs text-white/60 uppercase tracking-wide">{s.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right - Eligibility Check Card */}
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
              className="lg:flex justify-end hidden">
              <div className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-sm">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FEE2E2' }}>
                    <CheckCircle className="w-5 h-5" style={{ color: '#E8192C' }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Quick Eligibility Check</h3>
                    <p className="text-xs text-gray-500">See if you can donate today</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  {[
                    { key: 'age', label: 'I am between 18–65 years old' },
                    { key: 'weight', label: 'I weigh at least 50kg (110 lbs)' },
                    { key: 'health', label: 'I am in good health' },
                  ].map(item => (
                    <label key={item.key} className="flex items-center space-x-3 cursor-pointer group">
                      <div
                        onClick={() => setEligibilityChecked(p => ({ ...p, [item.key]: !p[item.key] }))}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${eligibilityChecked[item.key] ? 'border-red-500 bg-red-500' : 'border-gray-300 group-hover:border-red-400'}`}
                      >
                        {eligibilityChecked[item.key] && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </label>
                  ))}
                </div>

             {/* Progress indicator */}
<div className="mb-4">
  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
    <span>Eligibility progress</span>
    <span style={{ color: '#E8192C' }}>
      {Object.values(eligibilityChecked).filter(Boolean).length}/3 checks
    </span>
  </div>
  <div className="w-full bg-gray-100 rounded-full h-1.5">
    <motion.div
      animate={{ width: `${(Object.values(eligibilityChecked).filter(Boolean).length / 3) * 100}%` }}
      transition={{ duration: 0.4 }}
      className="h-1.5 rounded-full"
      style={{ background: 'linear-gradient(90deg, #E8192C, #ff6b7a)' }}
    />
  </div>
</div>

<motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
  onClick={() => {
    const allChecked = Object.values(eligibilityChecked).every(Boolean);
    if (allChecked) handleRegister();
    else document.getElementById('eligibility')?.scrollIntoView({ behavior: 'smooth' });
  }}
  className="w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-lg"
  style={{
    background: Object.values(eligibilityChecked).every(Boolean)
      ? 'linear-gradient(135deg, #10B981, #059669)'
      : Object.values(eligibilityChecked).some(Boolean)
      ? 'linear-gradient(135deg, #F59E0B, #D97706)'
      : 'linear-gradient(135deg, #E8192C, #C8102E)',
    boxShadow: Object.values(eligibilityChecked).every(Boolean)
      ? '0 8px 20px rgba(16,185,129,0.35)'
      : '0 8px 20px rgba(232,25,44,0.35)'
  }}>
  {Object.values(eligibilityChecked).every(Boolean)
    ? '✓ You\'re Eligible — Register Now →'
    : Object.values(eligibilityChecked).some(Boolean)
    ? 'Keep Going... Check Full Eligibility'
    : 'Check Full Eligibility →'}
</motion.button>

<div className="mt-4 p-3 rounded-xl flex items-center space-x-2"
  style={{ background: 'linear-gradient(135deg, #FFF5F5, #FEE2E2)', border: '1px solid #FECACA' }}>
  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
    className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#E8192C' }} />
  <p className="text-xs text-gray-700 font-medium">
    <strong style={{ color: '#E8192C' }}>O- blood critically needed</strong> — 3 hospitals nearby
  </p>
</div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/50 cursor-pointer"
          onClick={() => document.getElementById('blood-availability')?.scrollIntoView({ behavior: 'smooth' })}>
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </section>

      {/* ── BLOOD AVAILABILITY ── */}
      <section id="blood-availability" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="flex items-center justify-between mb-10 flex-wrap gap-4">
            <div>
              <h2 className="text-4xl font-bold text-gray-900" style={{ fontFamily: 'DM Serif Display, serif' }}>Current Blood Availability</h2>
              <p className="text-gray-500 mt-1 text-sm">Live data from partner hospitals in your area</p>
            </div>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={handleFindBlood}
              className="flex items-center space-x-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all"
              style={{ color: '#E8192C', border: '1.5px solid #E8192C' }}>
              <span>View all blood types</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>

          {/* Blood type filter pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {bloodTypes.map(type => (
              <motion.button key={type} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                onClick={() => setActiveBloodFilter(type)}
                className="px-4 py-1.5 rounded-full text-sm font-bold transition-all"
                style={{
                  background: activeBloodFilter === type ? '#E8192C' : '#F3F4F6',
                  color: activeBloodFilter === type ? 'white' : '#374151'
                }}>
                {type}
              </motion.button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredBlood.map((blood, i) => {
              const colors = getStatusColor(blood.status);
              return (
                <motion.div key={blood.type}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }} viewport={{ once: true }}
                  whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(0,0,0,0.1)' }}
                  className="bg-white border border-gray-100 rounded-2xl p-5 text-center cursor-pointer shadow-sm transition-all"
                  onClick={handleFindBlood}
                >
                  <div className="text-4xl font-black mb-1" style={{ color: '#E8192C' }}>{blood.type}</div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Blood Type</p>
                  <div className="w-full rounded-full h-2 mb-3" style={{ background: '#F3F4F6' }}>
                    <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${blood.available}%`, background: colors.bar }} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold" style={{ color: colors.text }}>{blood.units} units</span>
                    <span className="px-2 py-0.5 rounded-full font-bold" style={{ background: colors.bg, color: colors.text }}>{blood.status}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FIND BLOOD NEAR YOU (Map Section) ── */}
      <section id="find-blood" className="py-24 px-6" style={{ background: '#FAFAFA' }}>
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="mb-10">
            <h2 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'DM Serif Display, serif' }}>Find Blood Near You</h2>
            <p className="text-gray-500 text-sm">Locate available blood units and donation centers in your area</p>
          </motion.div>

          {/* Search bar */}
          <motion.div {...fadeUp} className="flex items-center gap-3 mb-6 flex-wrap">
            <div className="flex-1 min-w-64 flex items-center space-x-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
              <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input type="text" placeholder="Enter your location to find nearby hospitals..."
                className="flex-1 outline-none text-sm text-gray-700 bg-transparent" />
            </div>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleFindBlood}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-white shadow-md"
              style={{ background: 'linear-gradient(135deg, #E8192C, #C8102E)' }}>
              <Search className="w-4 h-4" />
              <span>Search Blood Units</span>
            </motion.button>
          </motion.div>

          {/* Map placeholder */}
          <motion.div {...fadeUp}
            className="relative w-full rounded-2xl overflow-hidden shadow-lg cursor-pointer group"
            style={{ height: '400px', background: 'linear-gradient(135deg, #e8e8e8, #d0d0d0)' }}
            onClick={handleViewFullMap}
          >
            <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&q=80" alt="Map" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div whileHover={{ scale: 1.05 }}
                className="bg-white rounded-2xl px-8 py-5 shadow-2xl text-center">
                <MapPin className="w-8 h-8 mx-auto mb-2" style={{ color: '#E8192C' }} />
                <p className="font-bold text-gray-900 text-lg">View Interactive Map</p>
                <p className="text-gray-500 text-sm mt-1">Click to explore hospitals & blood banks near you</p>
              </motion.div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <button onClick={(e) => { e.stopPropagation(); handleViewFullMap(); }} className="flex items-center space-x-1 font-medium hover:text-red-600 transition-colors">
                  <Building2 className="w-4 h-4" /><span>List View</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleFindBlood(); }} className="flex items-center space-x-1 font-medium hover:text-red-600 transition-colors">
                  <Search className="w-4 h-4" /><span>Filters</span>
                </button>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleViewFullMap(); }}
                className="text-sm font-bold px-4 py-2 rounded-lg text-white"
                style={{ background: '#E8192C' }}>
                View Full Map →
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── EMERGENCY BLOOD REQUEST ── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp}
            className="rounded-3xl overflow-hidden shadow-xl"
            style={{ background: 'linear-gradient(135deg, #E8192C 0%, #C8102E 100%)' }}
          >
            <div className="p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full mb-4 text-sm font-bold bg-white/20 text-white">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Emergency Response</span>
                </div>
                <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'DM Serif Display, serif' }}>Need Blood Urgently?</h2>
                <p className="text-white/85 mb-6 max-w-lg leading-relaxed">
                  In critical situations, our emergency request system can help you find donors quickly. We'll broadcast your request to nearby matching donors immediately.
                </p>
                <div className="flex flex-wrap gap-3">
                  <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}
                    onClick={handleEmergency}
                    className="flex items-center space-x-2 px-7 py-3.5 bg-white font-bold rounded-xl transition-all hover:shadow-lg"
                    style={{ color: '#E8192C' }}>
                    <Zap className="w-5 h-5" />
                    <span>Create Emergency Request</span>
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { const el = document.getElementById('emergency-hotline'); el?.scrollIntoView({ behavior: 'smooth' }); }}
                    className="flex items-center space-x-2 px-7 py-3.5 border-2 border-white/60 font-bold rounded-xl text-white hover:bg-white/10 transition-all">
                    <Phone className="w-5 h-5" />
                    <span>Call Emergency Hotline</span>
                  </motion.button>
                </div>
              </div>
              <div className="flex-shrink-0">
                <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  className="w-36 h-36 rounded-full flex items-center justify-center border-4 border-white/30"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <Droplets className="w-16 h-16 text-white" />
                </motion.div>
              </div>
            </div>

            {/* Emergency form teaser */}
            <div className="bg-white/10 backdrop-blur-sm px-10 md:px-14 py-6 border-t border-white/20">
              <p className="text-white/80 text-sm font-medium mb-4">Quick Emergency Request:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Patient Name', 'Contact Number', 'Hospital/Facility', 'Blood Type Needed'].map((placeholder, i) => (
                  <input key={i} type="text" placeholder={placeholder}
                    className="px-4 py-2.5 rounded-xl text-sm bg-white/20 text-white placeholder-white/60 outline-none border border-white/20 focus:border-white/60 transition-colors"
                    onFocus={handleEmergency} />
                ))}
              </div>
              <p className="text-white/60 text-xs mt-3">* Emergency requests are reviewed immediately and matched based on medical urgency. Our coordinators will contact you within minutes.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-6" style={{ background: '#FAFAFA' }}>
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'DM Serif Display, serif' }}>How It Works</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Our platform connects blood donors with those in need, making the process simple, efficient, and life-saving.</p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { n: 1, title: 'Register as Donor', desc: 'Create your profile, add your blood type, and set your location preferences.', icon: Users, color: '#FEE2E2', iconColor: '#E8192C' },
              { n: 2, title: 'Schedule Donation', desc: 'Book appointments at nearby donation centers or respond to urgent requests.', icon: Calendar, color: '#D1FAE5', iconColor: '#059669' },
              { n: 3, title: 'Save Lives', desc: 'Your donation helps patients in critical need and supports medical treatments.', icon: Heart, color: '#FEE2E2', iconColor: '#E8192C' },
              { n: 4, title: 'Earn Rewards', desc: 'Get badges, track your impact, and join our community of life-savers.', icon: Award, color: '#CCFBF1', iconColor: '#0D9488' },
            ].map((step, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }} viewport={{ once: true }}
                whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(0,0,0,0.08)' }}
                onClick={step.n === 1 || step.n === 2 ? handleRegister : step.n === 3 ? handleDonateNow : undefined}
                className="bg-white rounded-2xl p-7 text-center shadow-sm border border-gray-100 cursor-pointer transition-all relative"
              >
                <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white" style={{ background: '#E8192C' }}>{step.n}</div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: step.color }}>
                  <step.icon className="w-7 h-7" style={{ color: step.iconColor }} />
                </div>
                <h3 className="font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp} className="mt-10 text-center">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              onClick={handleSchedule}
              className="inline-flex items-center space-x-2 px-8 py-4 rounded-xl font-bold text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, #E8192C, #C8102E)' }}>
              <Calendar className="w-5 h-5" />
              <span>Schedule Your Donation</span>
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ── DONATION PROCESS ── */}
      <section id="donate" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'DM Serif Display, serif' }}>The Donation Process</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Blood donation is a simple and straightforward process that honestly takes less than an hour from start to finish.</p>
          </motion.div>

          {/* Step progress bar */}
          <div className="flex items-center justify-center mb-12 gap-0">
            {donationSteps.map((step, i) => (
              <React.Fragment key={i}>
                <motion.button whileHover={{ scale: 1.05 }}
                  onClick={() => setDonationStep(i)}
                  className="flex flex-col items-center cursor-pointer group">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${donationStep === i ? 'text-white shadow-lg' : 'bg-gray-100 text-gray-500'}`}
                    style={donationStep === i ? { background: '#E8192C' } : {}}>
                    {i + 1}
                  </div>
                  <span className={`text-xs mt-2 font-semibold transition-all ${donationStep === i ? 'text-red-600' : 'text-gray-400'}`}>{step.title}</span>
                </motion.button>
                {i < donationSteps.length - 1 && (
                  <div className="w-16 h-0.5 mb-5 mx-1" style={{ background: donationStep > i ? '#E8192C' : '#E5E7EB' }} />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {donationSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }} viewport={{ once: true }}
                  whileHover={{ y: -4 }}
                  onClick={() => setDonationStep(i)}
                  className={`rounded-2xl p-7 border-2 cursor-pointer transition-all ${donationStep === i ? 'border-red-500 shadow-lg' : 'border-gray-100 shadow-sm'}`}
                  style={{ background: donationStep === i ? '#FFF5F5' : 'white' }}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: donationStep === i ? '#E8192C' : '#F3F4F6' }}>
                      <Icon className="w-6 h-6" style={{ color: donationStep === i ? 'white' : '#6B7280' }} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#FEE2E2', color: '#E8192C' }}>{i + 1}. {step.title}</span>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
                      <p className="text-xs text-gray-400 mt-2">⏱ Time: {i === 0 ? '10–15 minutes' : i === 1 ? '10–15 minutes' : i === 2 ? '8–10 minutes' : '10–15 minutes'}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div {...fadeUp} className="mt-10 flex flex-wrap gap-4 justify-center">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              onClick={handleSchedule}
              className="flex items-center space-x-2 px-8 py-4 rounded-xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #E8192C, #C8102E)' }}>
              <Calendar className="w-5 h-5" /><span>Schedule Appointment</span>
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              onClick={() => document.getElementById('eligibility')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center space-x-2 px-8 py-4 rounded-xl font-bold border-2 border-gray-200 text-gray-700 hover:border-red-500 hover:text-red-600 transition-all">
              <Shield className="w-5 h-5" /><span>Check Eligibility</span>
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ── ELIGIBILITY REQUIREMENTS ── */}
      <section id="eligibility" className="py-24 px-6" style={{ background: '#FAFAFA' }}>
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'DM Serif Display, serif' }}>Eligibility Requirements</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Before donating blood, please review the basic eligibility criteria to ensure the safety of both donors and recipients.</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Basic Requirements */}
            <motion.div {...fadeUp} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg mb-5 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" style={{ color: '#E8192C' }} />
                <span>Basic Requirements</span>
              </h3>
              <ul className="space-y-3">
                {basicRequirements.map((req, i) => (
                  <motion.li key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                    className="flex items-start space-x-3 text-sm text-gray-600">
                    <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: '#D1FAE5' }}>
                      <CheckCircle className="w-3 h-3" style={{ color: '#059669' }} />
                    </div>
                    <span>{req}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Medical Conditions */}
            <motion.div {...fadeUp} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg mb-5 flex items-center space-x-2">
                <Shield className="w-5 h-5" style={{ color: '#E8192C' }} />
                <span>Medical Conditions</span>
              </h3>
              <div className="space-y-3">
                {medicalConditions.map((item, i) => (
                  <div key={i} className="p-4 rounded-xl border border-gray-100 hover:border-red-200 transition-colors cursor-default">
                    <p className="font-semibold text-gray-800 text-sm mb-1">{item.q}</p>
                    <p className="text-gray-500 text-xs leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={handleRegister}
                  className="flex-1 py-3 rounded-xl font-bold text-white text-sm"
                  style={{ background: '#E8192C' }}>
                  Check Eligibility Quiz
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={handleEmergency}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-700 text-sm border-2 border-gray-200 hover:border-red-400 transition-colors">
                  Contact Support
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── BLOOD AVAILABILITY CHART ── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'DM Serif Display, serif' }}>Blood Availability Overview</h2>
            <p className="text-gray-500">Current blood type availability across all partner hospitals in your area</p>
          </motion.div>

          <motion.div {...fadeUp} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-end space-x-3 h-48 mb-4">
              {bloodAvailability.map((blood, i) => {
                const colors = getStatusColor(blood.status);
                return (
                  <motion.div key={i}
                    initial={{ height: 0 }} whileInView={{ height: `${blood.available}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }} viewport={{ once: true }}
                    whileHover={{ scale: 1.05 }}
                    onClick={handleFindBlood}
                    className="flex-1 rounded-t-lg cursor-pointer relative group"
                    style={{ background: colors.bar, minHeight: '8px' }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {blood.type}: {blood.available}%
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="flex items-center space-x-3">
              {bloodAvailability.map((blood, i) => (
                <div key={i} className="flex-1 text-center text-xs font-bold text-gray-600">{blood.type}</div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs">
              {[{ color: '#10B981', label: 'Available (>40%)' }, { color: '#F59E0B', label: 'Low (20-40%)' }, { color: '#E8192C', label: 'Critical (<20%)' }].map((item, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                  <span className="text-gray-600">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SUCCESS STORIES ── */}
      <section className="py-24 px-6" style={{ background: '#FAFAFA' }}>
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'DM Serif Display, serif' }}>Donor Stories</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Hear from people who have experienced the true impact of blood donation firsthand.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }} viewport={{ once: true }}
                whileHover={{ y: -6, boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
                className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 transition-all cursor-default"
              >
                <div className="flex items-center space-x-4 mb-5">
                  <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{t.name}</h4>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
                <div className="flex space-x-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">"{t.quote}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'DM Serif Display, serif' }}>Frequently Asked Questions</h2>
            <p className="text-gray-500">Find answers to common questions about blood donation and using our platform.</p>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }} viewport={{ once: true }}
                className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-800 text-sm pr-4">{faq.q}</span>
                  <div className="flex-shrink-0">
                    {openFaq === i
                      ? <ChevronUp className="w-5 h-5" style={{ color: '#E8192C' }} />
                      : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }} className="overflow-hidden">
                      <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4"
                        style={{ background: '#FAFAFA' }}>
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp} className="mt-10 flex gap-4 justify-center">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleFindBlood}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl font-bold border-2 border-gray-200 text-gray-700 hover:border-red-500 hover:text-red-600 transition-all text-sm">
              <span>View All Articles</span>
            </motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleEmergency}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-white text-sm"
              style={{ background: '#E8192C' }}>
              <Phone className="w-4 h-4" /><span>Contact Support</span>
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ── READY TO SAVE LIVES ── */}
      <section className="py-24 px-6" style={{ background: '#FAFAFA' }}>
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'DM Serif Display, serif' }}>Ready to Save Lives?</h2>
            <p className="text-gray-500 mb-10 max-w-2xl mx-auto text-lg">
              Join our community of donors and help save lives. Your donation can make a difference for someone in need.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}
                onClick={handleSchedule}
                className="flex items-center justify-center space-x-2 px-8 py-4 rounded-xl font-bold text-white shadow-lg"
                style={{ background: 'linear-gradient(135deg, #E8192C, #C8102E)', boxShadow: '0 8px 25px rgba(232,25,44,0.35)' }}>
                <Calendar className="w-5 h-5" /><span>Schedule Appointment</span>
              </motion.button>
              <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}
                onClick={handleFindBlood}
                className="flex items-center justify-center space-x-2 px-8 py-4 rounded-xl font-bold border-2 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white transition-all">
                <Search className="w-5 h-5" /><span>Find Blood</span>
              </motion.button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
              {stats.map((s, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }} viewport={{ once: true }}
                  className="text-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#FEE2E2' }}>
                    <s.icon className="w-6 h-6" style={{ color: '#E8192C' }} />
                  </div>
                  <div className="text-3xl font-black text-gray-900">{s.value}</div>
                  <div className="text-sm text-gray-500 mt-1">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer id="emergency-hotline" className="bg-gray-950 text-gray-400 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#E8192C' }}>
                  <Droplets className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold italic text-white">Vital Veins</span>
              </div>
              <p className="text-sm leading-relaxed mb-6 text-gray-500">Connecting donors with those in need, saving lives one donation at a time.</p>
              <div className="flex gap-2">
                {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                  <motion.button key={i} whileHover={{ scale: 1.2, backgroundColor: '#E8192C' }} whileTap={{ scale: 0.9 }}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <Icon className="w-4 h-4 text-white" />
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4">Quick Links</h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { label: 'Home', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
                  { label: 'About Us', action: () => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }) },
                  { label: 'Donate Blood', action: handleDonateNow },
                  { label: 'Find Blood', action: handleFindBlood },
                  { label: 'Emergency Request', action: handleEmergency },
                ].map((link, i) => (
                  <li key={i}><button onClick={link.action} className="text-gray-500 hover:text-white transition-colors">{link.label}</button></li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4">Resources</h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { label: 'FAQs', action: () => document.getElementById('eligibility')?.scrollIntoView({ behavior: 'smooth' }) },
                  { label: 'Blood Donation Guide', action: () => document.getElementById('donate')?.scrollIntoView({ behavior: 'smooth' }) },
                  { label: 'Eligibility Criteria', action: () => document.getElementById('eligibility')?.scrollIntoView({ behavior: 'smooth' }) },
                  { label: 'Blood Types Explained', action: () => document.getElementById('blood-availability')?.scrollIntoView({ behavior: 'smooth' }) },
                  { label: 'Support Center', action: handleEmergency },
                ].map((link, i) => (
                  <li key={i}><button onClick={link.action} className="text-gray-500 hover:text-white transition-colors">{link.label}</button></li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4">Newsletter</h4>
              <p className="text-gray-500 text-xs mb-4">Subscribe for updates on blood drives and critical needs.</p>
              <div className="flex">
                <input type="email" placeholder="Your email" value={newsletterEmail}
                  onChange={e => setNewsletterEmail(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-white text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '8px 0 0 8px', border: '1px solid rgba(255,255,255,0.1)', borderRight: 'none' }} />
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => { if (newsletterEmail) { alert('Subscribed!'); setNewsletterEmail(''); } }}
                  className="px-4 py-2.5 font-bold text-white text-sm flex items-center"
                  style={{ background: '#E8192C', borderRadius: '0 8px 8px 0' }}>
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Emergency hotline */}
              <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(232,25,44,0.1)', border: '1px solid rgba(232,25,44,0.2)' }}>
                <p className="text-xs text-gray-400 mb-1">24/7 Emergency Hotline</p>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" style={{ color: '#E8192C' }} />
                  <span className="font-bold text-white text-sm">1-800-VITAL-1</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-600">© 2025 Vital Veins. All rights reserved.</p>
            <div className="flex gap-6 text-xs">
              <button className="text-gray-600 hover:text-white transition-colors">Privacy Policy</button>
              <span className="text-gray-700">·</span>
              <button className="text-gray-600 hover:text-white transition-colors">Terms of Service</button>
              <span className="text-gray-700">·</span>
              <button className="text-gray-600 hover:text-white transition-colors">Accessibility</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;