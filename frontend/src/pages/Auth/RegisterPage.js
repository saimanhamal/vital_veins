import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Building2, Heart, CheckCircle, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import LocationPicker from '../../components/Maps/LocationPicker';

const RegisterPage = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('donor');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'donor',
    // Hospital specific fields
    hospitalName: '',
    license: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    contact: {
      phone: '',
    },
    // Donor specific fields
    personalInfo: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      bloodType: '',
      weight: '',
      height: '',
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
    // Donor location
    location: {
      lat: null,
      lng: null,
      address: '',
    },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFormData(prev => ({
      ...prev,
      role: tab
    }));
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleLocationSelect = (locationData) => {
    // Convert latitude/longitude to lat/lng format if needed
    const normalizedLocation = {
      lat: locationData.lat !== undefined ? locationData.lat : locationData.latitude,
      lng: locationData.lng !== undefined ? locationData.lng : locationData.longitude,
      address: locationData.address || ''
    };
    
    setFormData(prev => ({
      ...prev,
      location: normalizedLocation
    }));
    // Clear location error if it exists
    if (errors.location) {
      setErrors(prev => ({
        ...prev,
        location: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Common validations
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter, one uppercase letter, and one number';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Role-specific validations
    if (activeTab === 'hospital') {
      if (!formData.hospitalName) {
        newErrors.hospitalName = 'Hospital name is required';
      }
      if (!formData.license) {
        newErrors.license = 'License number is required';
      }
      if (!formData.address.street) {
        newErrors['address.street'] = 'Street address is required';
      }
      if (!formData.address.city) {
        newErrors['address.city'] = 'City is required';
      }
      if (!formData.address.state) {
        newErrors['address.state'] = 'State is required';
      }
      if (!formData.address.zipCode) {
        newErrors['address.zipCode'] = 'Zip code is required';
      }
      if (!formData.contact.phone) {
        newErrors['contact.phone'] = 'Phone number is required';
      }
    } else if (activeTab === 'donor') {
      if (!formData.personalInfo.firstName) {
        newErrors['personalInfo.firstName'] = 'First name is required';
      }
      if (!formData.personalInfo.lastName) {
        newErrors['personalInfo.lastName'] = 'Last name is required';
      }
      if (!formData.personalInfo.dateOfBirth) {
        newErrors['personalInfo.dateOfBirth'] = 'Date of birth is required';
      }
      if (!formData.personalInfo.gender) {
        newErrors['personalInfo.gender'] = 'Gender is required';
      }
      if (!formData.personalInfo.bloodType) {
        newErrors['personalInfo.bloodType'] = 'Blood type is required';
      }
      if (!formData.personalInfo.weight) {
        newErrors['personalInfo.weight'] = 'Weight is required';
      }
      if (!formData.personalInfo.height) {
        newErrors['personalInfo.height'] = 'Height is required';
      }
      if (!formData.emergencyContact.name) {
        newErrors['emergencyContact.name'] = 'Emergency contact name is required';
      }
      if (!formData.emergencyContact.phone) {
        newErrors['emergencyContact.phone'] = 'Emergency contact phone is required';
      }
      if (!formData.emergencyContact.relationship) {
        newErrors['emergencyContact.relationship'] = 'Emergency contact relationship is required';
      }
      if (!formData.location.lat || !formData.location.lng) {
        newErrors.location = 'Please select your location';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const registrationData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: activeTab,
    };
    
    // Add role-specific data
    if (activeTab === 'hospital') {
      Object.assign(registrationData, {
        hospitalName: formData.hospitalName,
        license: formData.license,
        address: formData.address,
        contact: formData.contact,
      });
    } else if (activeTab === 'donor') {
      Object.assign(registrationData, {
        personalInfo: formData.personalInfo,
        contact: {
          phone: formData.contact.phone,
          emergencyContact: formData.emergencyContact,
        },
        location: formData.location,
      });
    }
    
    const result = await register(registrationData);
    if (result.success) {
      setShowSuccessModal(true);
    }
  };

  const tabs = [
    { id: 'donor', label: 'Donor', icon: Heart },
    { id: 'hospital', label: 'Hospital', icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl fade-in"
      >
        {/* Back to Home */}
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-primary-600 mb-8 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>

        {/* Registration Card */}
        <div className="card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">Vv</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Join VitalVeins</h1>
            <p className="text-gray-600">Create your account and start making a difference</p>
          </div>

          {/* Role Tabs */}
          <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-xl slide-in-left">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 button-hover ${
                    activeTab === tab.id
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Common Fields */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  {activeTab === 'donor' ? 'Full Name' : 'Contact Person Name'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`input-primary pl-10 ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Enter your name"
                  />
                </div>
                {errors.name && (
                  <p className="form-error">{errors.name}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`input-primary pl-10 ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="form-error">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`input-primary pl-10 pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="form-error">{errors.password}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`input-primary pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="form-error">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Role-specific Fields */}
            {activeTab === 'hospital' && (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label htmlFor="hospitalName" className="form-label">
                      Hospital Name
                    </label>
                    <input
                      type="text"
                      id="hospitalName"
                      name="hospitalName"
                      value={formData.hospitalName}
                      onChange={handleChange}
                      className={`input-primary ${errors.hospitalName ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Enter hospital name"
                    />
                    {errors.hospitalName && (
                      <p className="form-error">{errors.hospitalName}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="license" className="form-label">
                      License Number
                    </label>
                    <input
                      type="text"
                      id="license"
                      name="license"
                      value={formData.license}
                      onChange={handleChange}
                      className={`input-primary ${errors.license ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Enter license number"
                    />
                    {errors.license && (
                      <p className="form-error">{errors.license}</p>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="contact.phone" className="form-label">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="contact.phone"
                    name="contact.phone"
                    value={formData.contact.phone}
                    onChange={handleChange}
                    className={`input-primary ${errors['contact.phone'] ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Enter phone number"
                  />
                  {errors['contact.phone'] && (
                    <p className="form-error">{errors['contact.phone']}</p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label htmlFor="address.street" className="form-label">
                      Street Address
                    </label>
                    <input
                      type="text"
                      id="address.street"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleChange}
                      className={`input-primary ${errors['address.street'] ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Enter street address"
                    />
                    {errors['address.street'] && (
                      <p className="form-error">{errors['address.street']}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="address.city" className="form-label">
                      City
                    </label>
                    <input
                      type="text"
                      id="address.city"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleChange}
                      className={`input-primary ${errors['address.city'] ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Enter city"
                    />
                    {errors['address.city'] && (
                      <p className="form-error">{errors['address.city']}</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label htmlFor="address.state" className="form-label">
                      State
                    </label>
                    <input
                      type="text"
                      id="address.state"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleChange}
                      className={`input-primary ${errors['address.state'] ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Enter state"
                    />
                    {errors['address.state'] && (
                      <p className="form-error">{errors['address.state']}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="address.zipCode" className="form-label">
                      Zip Code
                    </label>
                    <input
                      type="text"
                      id="address.zipCode"
                      name="address.zipCode"
                      value={formData.address.zipCode}
                      onChange={handleChange}
                      className={`input-primary ${errors['address.zipCode'] ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Enter zip code"
                    />
                    {errors['address.zipCode'] && (
                      <p className="form-error">{errors['address.zipCode']}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'donor' && (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label htmlFor="personalInfo.firstName" className="form-label">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="personalInfo.firstName"
                      name="personalInfo.firstName"
                      value={formData.personalInfo.firstName}
                      onChange={handleChange}
                      className={`input-primary ${errors['personalInfo.firstName'] ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Enter first name"
                    />
                    {errors['personalInfo.firstName'] && (
                      <p className="form-error">{errors['personalInfo.firstName']}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="personalInfo.lastName" className="form-label">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="personalInfo.lastName"
                      name="personalInfo.lastName"
                      value={formData.personalInfo.lastName}
                      onChange={handleChange}
                      className={`input-primary ${errors['personalInfo.lastName'] ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Enter last name"
                    />
                    {errors['personalInfo.lastName'] && (
                      <p className="form-error">{errors['personalInfo.lastName']}</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="form-group">
                    <label htmlFor="personalInfo.dateOfBirth" className="form-label">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      id="personalInfo.dateOfBirth"
                      name="personalInfo.dateOfBirth"
                      value={formData.personalInfo.dateOfBirth}
                      onChange={handleChange}
                      className={`input-primary ${errors['personalInfo.dateOfBirth'] ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {errors['personalInfo.dateOfBirth'] && (
                      <p className="form-error">{errors['personalInfo.dateOfBirth']}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="personalInfo.gender" className="form-label">
                      Gender
                    </label>
                    <select
                      id="personalInfo.gender"
                      name="personalInfo.gender"
                      value={formData.personalInfo.gender}
                      onChange={handleChange}
                      className={`input-primary ${errors['personalInfo.gender'] ? 'border-red-500 focus:ring-red-500' : ''}`}
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors['personalInfo.gender'] && (
                      <p className="form-error">{errors['personalInfo.gender']}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="personalInfo.bloodType" className="form-label">
                      Blood Type
                    </label>
                    <select
                      id="personalInfo.bloodType"
                      name="personalInfo.bloodType"
                      value={formData.personalInfo.bloodType}
                      onChange={handleChange}
                      className={`input-primary ${errors['personalInfo.bloodType'] ? 'border-red-500 focus:ring-red-500' : ''}`}
                    >
                      <option value="">Select blood type</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                    {errors['personalInfo.bloodType'] && (
                      <p className="form-error">{errors['personalInfo.bloodType']}</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label htmlFor="personalInfo.weight" className="form-label">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      id="personalInfo.weight"
                      name="personalInfo.weight"
                      value={formData.personalInfo.weight}
                      onChange={handleChange}
                      className={`input-primary ${errors['personalInfo.weight'] ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Enter weight"
                      min="40"
                      max="200"
                    />
                    {errors['personalInfo.weight'] && (
                      <p className="form-error">{errors['personalInfo.weight']}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="personalInfo.height" className="form-label">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      id="personalInfo.height"
                      name="personalInfo.height"
                      value={formData.personalInfo.height}
                      onChange={handleChange}
                      className={`input-primary ${errors['personalInfo.height'] ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Enter height"
                      min="120"
                      max="220"
                    />
                    {errors['personalInfo.height'] && (
                      <p className="form-error">{errors['personalInfo.height']}</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="form-group">
                    <label htmlFor="emergencyContact.name" className="form-label">
                      Emergency Contact Name
                    </label>
                    <input
                      type="text"
                      id="emergencyContact.name"
                      name="emergencyContact.name"
                      value={formData.emergencyContact.name}
                      onChange={handleChange}
                      className={`input-primary ${errors['emergencyContact.name'] ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Enter contact name"
                    />
                    {errors['emergencyContact.name'] && (
                      <p className="form-error">{errors['emergencyContact.name']}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="emergencyContact.phone" className="form-label">
                      Emergency Contact Phone
                    </label>
                    <input
                      type="tel"
                      id="emergencyContact.phone"
                      name="emergencyContact.phone"
                      value={formData.emergencyContact.phone}
                      onChange={handleChange}
                      className={`input-primary ${errors['emergencyContact.phone'] ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Enter contact phone"
                    />
                    {errors['emergencyContact.phone'] && (
                      <p className="form-error">{errors['emergencyContact.phone']}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="emergencyContact.relationship" className="form-label">
                      Relationship
                    </label>
                    <input
                      type="text"
                      id="emergencyContact.relationship"
                      name="emergencyContact.relationship"
                      value={formData.emergencyContact.relationship}
                      onChange={handleChange}
                      className={`input-primary ${errors['emergencyContact.relationship'] ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="e.g., Spouse, Parent"
                    />
                    {errors['emergencyContact.relationship'] && (
                      <p className="form-error">{errors['emergencyContact.relationship']}</p>
                    )}
                  </div>
                </div>

                {/* Location Selection */}
                <div className="form-group">
                  <label className="form-label flex items-center space-x-2">
                    <MapPin className="w-5 h-5" />
                    <span>Your Location <span className="text-red-500">*</span></span>
                  </label>
                  <p className="text-sm text-gray-600 mb-3">
                    Please select your location for better hospital recommendations
                  </p>
                  <LocationPicker
                    onLocationSelect={handleLocationSelect}
                    initialLocation={formData.location.lat ? { lat: formData.location.lat, lng: formData.location.lng } : null}
                    required={true}
                  />
                  {errors.location && (
                    <p className="form-error">{errors.location}</p>
                  )}
                </div>
              </>
            )}

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="terms"
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-1"
                required
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                I agree to the{' '}
                <Link to="/terms" className="text-primary-600 hover:text-primary-700 font-medium">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-700 font-medium">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                `Create ${activeTab === 'donor' ? 'Donor' : 'Hospital'} Account`
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Success Modal */}
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowSuccessModal(false);
              navigate(`/${activeTab}/dashboard`);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
                  className="flex justify-center mb-6"
                >
                  <CheckCircle className="w-16 h-16 text-green-500" />
                </motion.div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Verification Underway
                </h2>
                
                <p className="text-gray-600 mb-6">
                  Thank you for joining VitalVeins! Your account has been created successfully. Our admin team is reviewing your profile and will approve it shortly. You'll receive an email once your account is verified and ready to use.
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setShowSuccessModal(false);
                      navigate(`/${activeTab}/dashboard`);
                    }}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                  >
                    Go to Dashboard
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowSuccessModal(false);
                      navigate('/');
                    }}
                    className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default RegisterPage;
