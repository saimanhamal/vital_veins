/**
 * Comprehensive Validation Utilities
 * Centralized validation functions for all user inputs
 */

const validator = require('validator');

/**
 * Validate Age (18+)
 * @param {Date} dateOfBirth - User's date of birth
 * @returns {Object} {isValid: boolean, age: number, message: string}
 */
const validateAge = (dateOfBirth) => {
  if (!dateOfBirth || !(dateOfBirth instanceof Date)) {
    return { isValid: false, age: 0, message: 'Invalid date format' };
  }

  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 0) {
    return { isValid: false, age: 0, message: 'Date of birth cannot be in the future' };
  }

  if (age < 18) {
    return { isValid: false, age, message: 'User must be at least 18 years old', minor: true };
  }

  return { isValid: true, age, message: 'Age validation passed' };
};

/**
 * Validate Password Strength
 * @param {string} password - Password to validate
 * @returns {Object} {isValid: boolean, strength: string, requirements: Object}
 */
const validatePasswordStrength = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, strength: 'none', requirements: {} };
  }

  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password),
    noCommonPatterns: !/(.)\1{3,}/.test(password) && !/^(qwerty|123456|password)/.test(password.toLowerCase())
  };

  const passedRequirements = Object.values(requirements).filter(v => v).length;
  
  let strength = 'weak';
  if (passedRequirements >= 5) strength = 'strong';
  else if (passedRequirements >= 4) strength = 'good';
  else if (passedRequirements >= 3) strength = 'fair';

  const isValid = requirements.minLength && 
                  requirements.hasUppercase && 
                  requirements.hasLowercase && 
                  requirements.hasNumber;

  return { isValid, strength, requirements };
};

/**
 * Validate Email Format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  return validator.isEmail(trimmed);
};

/**
 * Validate Phone Number
 * @param {string} phone - Phone number to validate
 * @returns {boolean}
 */
const validatePhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  // Support international format: +country-area-number
  const phoneRegex = /^[\+]?[1-9][\d\s\-()]{0,15}$/;
  return phoneRegex.test(phone.trim());
};

/**
 * Validate Blood Type
 * @param {string} bloodType - Blood type to validate
 * @returns {boolean}
 */
const validateBloodType = (bloodType) => {
  const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  return validBloodTypes.includes(bloodType);
};

/**
 * Validate Gender
 * @param {string} gender - Gender to validate
 * @returns {boolean}
 */
const validateGender = (gender) => {
  const validGenders = ['male', 'female', 'other'];
  return validGenders.includes(gender.toLowerCase());
};

/**
 * Sanitize String Input
 * Removes/escapes potentially dangerous characters
 * @param {string} input - String to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string}
 */
const sanitizeString = (input, maxLength = 255) => {
  if (!input || typeof input !== 'string') return '';
  
  let sanitized = input
    .trim() // Remove leading/trailing whitespace
    .substring(0, maxLength) // Limit length
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/['"]/g, match => ({ "'": '&#39;', '"': '&quot;' })[match] || match); // Escape quotes
  
  return sanitized;
};

/**
 * Validate Location Coordinates
 * @param {Object} location - {lat: number, lng: number}
 * @returns {boolean}
 */
const validateCoordinates = (location) => {
  if (!location || typeof location !== 'object') return false;
  
  const { lat, lng } = location;
  const latitude = lat !== undefined ? lat : location.latitude;
  const longitude = lng !== undefined ? lng : location.longitude;
  
  return (
    typeof latitude === 'number' && 
    typeof longitude === 'number' &&
    latitude >= -90 && latitude <= 90 &&
    longitude >= -180 && longitude <= 180
  );
};

/**
 * Validate Donation Request
 * @param {Object} request - Request object to validate
 * @returns {Object} {isValid: boolean, errors: Array}
 */
const validateBloodRequest = (request) => {
  const errors = [];

  if (!request.bloodType || !validateBloodType(request.bloodType)) {
    errors.push('Valid blood type is required');
  }

  if (!request.urgency || !['normal', 'urgent', 'emergency'].includes(request.urgency)) {
    errors.push('Valid urgency level is required');
  }

  if (!request.location || !validateCoordinates(request.location)) {
    errors.push('Valid location coordinates are required');
  }

  if (!request.hospitalId || typeof request.hospitalId !== 'string') {
    errors.push('Valid hospital ID is required');
  }

  if (request.notes && typeof request.notes !== 'string') {
    errors.push('Notes must be a string');
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Validate Donation History Check
 * @param {Date} lastDonationDate - Last donation date
 * @returns {Object} {canDonate: boolean, daysUntilEligible: number, message: string}
 */
const validateDonationEligibility = (lastDonationDate) => {
  const DONATION_INTERVAL_DAYS = 90;
  
  if (!lastDonationDate) {
    return { canDonate: true, daysUntilEligible: 0, message: 'Eligible to donate' };
  }

  const today = new Date();
  const lastDate = new Date(lastDonationDate);
  const daysSinceDonation = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
  const daysUntilEligible = Math.max(0, DONATION_INTERVAL_DAYS - daysSinceDonation);

  if (daysUntilEligible === 0) {
    return { canDonate: true, daysUntilEligible: 0, message: 'Eligible to donate' };
  }

  return { 
    canDonate: false, 
    daysUntilEligible,
    message: `Must wait ${daysUntilEligible} more days before donating again`
  };
};

/**
 * Prevent Self-Request Validation
 * @param {string} donorId - Donor's ID
 * @param {string} requestorId - Requestor's ID
 * @returns {boolean}
 */
const validateNotSelfRequest = (donorId, requestorId) => {
  return donorId !== requestorId;
};

module.exports = {
  validateAge,
  validatePasswordStrength,
  validateEmail,
  validatePhoneNumber,
  validateBloodType,
  validateGender,
  sanitizeString,
  validateCoordinates,
  validateBloodRequest,
  validateDonationEligibility,
  validateNotSelfRequest
};
