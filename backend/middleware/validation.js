const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Validation failed:', JSON.stringify(errors.array(), null, 2));
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('role')
    .isIn(['admin', 'hospital', 'donor'])
    .withMessage('Role must be admin, hospital, or donor'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Hospital validation rules
const validateHospitalRegistration = [
  body('hospitalName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Hospital name must be between 2 and 100 characters'),
  body('license')
    .trim()
    .notEmpty()
    .withMessage('License number is required'),
  body('address.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  body('address.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('address.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('address.zipCode')
    .trim()
    .isLength({ min: 5, max: 10 })
    .withMessage('Zip code must be between 5 and 10 characters'),
  body('contact.phone')
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('contact.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('location.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Location coordinates must be an array of 2 numbers [longitude, latitude]'),
  body('location.coordinates.*')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Coordinates must be valid longitude and latitude values'),
  handleValidationErrors
];

// Donor validation rules
const validateDonorRegistration = [
  body('personalInfo.firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('personalInfo.lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('personalInfo.dateOfBirth')
    .isISO8601()
    .withMessage('Please provide a valid date of birth')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18 || age > 65) {
        throw new Error('Age must be between 18 and 65 years');
      }
      return true;
    }),
  body('personalInfo.gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  body('personalInfo.bloodType')
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Please provide a valid blood type'),
  body('personalInfo.weight')
    .isFloat({ min: 40, max: 200 })
    .withMessage('Weight must be between 40 and 200 kg'),
  body('personalInfo.height')
    .isFloat({ min: 120, max: 220 })
    .withMessage('Height must be between 120 and 220 cm'),
  body('contact.phone')
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('contact.emergencyContact.name')
    .trim()
    .notEmpty()
    .withMessage('Emergency contact name is required'),
  body('contact.emergencyContact.phone')
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid emergency contact phone number'),
  body('contact.emergencyContact.relationship')
    .trim()
    .notEmpty()
    .withMessage('Emergency contact relationship is required'),
  body('address.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  body('address.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('address.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('address.zipCode')
    .trim()
    .isLength({ min: 5, max: 10 })
    .withMessage('Zip code must be between 5 and 10 characters'),
  body('location.lat')
    .notEmpty()
    .withMessage('Location latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('location.lng')
    .notEmpty()
    .withMessage('Location longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('location.address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must be less than 500 characters'),
  handleValidationErrors
];

// Ticket validation rules
const validateTicketCreation = [
  body('type')
    .isIn(['blood', 'organ'])
    .withMessage('Type must be blood or organ'),
  body('bloodType')
    .if(body('type').equals('blood'))
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Please provide a valid blood type'),
  body('organType')
    .if(body('type').equals('organ'))
    .isIn(['heart', 'liver', 'kidney', 'lung', 'pancreas', 'intestine', 'cornea', 'skin', 'bone'])
    .withMessage('Please provide a valid organ type'),
  body('urgency')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Urgency must be low, medium, high, or critical'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Message must be between 10 and 500 characters'),
  body('location.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Location coordinates must be an array of 2 numbers [longitude, latitude]'),
  body('location.coordinates.*')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Coordinates must be valid longitude and latitude values'),
  handleValidationErrors
];

// Appointment validation rules
const validateAppointmentCreation = [
  body('type')
    .isIn(['blood', 'organ'])
    .withMessage('Type must be blood or organ'),
  body('bloodType')
    .if(body('type').equals('blood'))
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Please provide a valid blood type'),
  body('organType')
    .if(body('type').equals('organ'))
    .isIn(['heart', 'liver', 'kidney', 'lung', 'pancreas', 'intestine', 'cornea', 'skin', 'bone'])
    .withMessage('Please provide a valid organ type'),
  body('hospital')
    .isMongoId()
    .withMessage('Please provide a valid hospital ID'),
  body('scheduledDate')
    .isISO8601()
    .withMessage('Please provide a valid scheduled date')
    .custom((value) => {
      const scheduledDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (scheduledDate < today) {
        throw new Error('Scheduled date cannot be in the past');
      }
      return true;
    }),
  body('scheduledTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid time format (HH:MM)'),
  body('duration')
    .optional()
    .isInt({ min: 15, max: 240 })
    .withMessage('Duration must be between 15 and 240 minutes'),
  body('donorLocation.lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('donorLocation.lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('donorLocation.address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must be less than 500 characters'),
  handleValidationErrors
];

// Notification validation rules
const validateNotificationCreation = [
  body('type')
    .isIn([
      'ticket_created', 'ticket_updated', 'ticket_resolved',
      'appointment_booked', 'appointment_confirmed', 'appointment_cancelled',
      'appointment_reminder', 'donation_completed', 'hospital_approved',
      'hospital_rejected', 'emergency_alert', 'system_announcement',
      'inventory_low', 'donor_registered', 'general', 'info'
    ])
    .withMessage('Please provide a valid notification type'),
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Message must be between 10 and 500 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  body('category')
    .optional()
    .isIn(['info', 'warning', 'success', 'error', 'emergency'])
    .withMessage('Category must be info, warning, success, error, or emergency'),
  handleValidationErrors
];

// Parameter validation
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} ID`),
  handleValidationErrors
];

// Query validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isIn(['createdAt', '-createdAt', 'name', '-name', 'status', '-status'])
    .withMessage('Invalid sort parameter'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateHospitalRegistration,
  validateDonorRegistration,
  validateTicketCreation,
  validateAppointmentCreation,
  validateNotificationCreation,
  validateObjectId,
  validatePagination
};
