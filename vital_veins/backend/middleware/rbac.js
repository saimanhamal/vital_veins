/**
 * Enhanced Role-Based Access Control (RBAC) Middleware
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Donor = require('../models/Donor');
const { AppError } = require('./errorHandler');

/**
 * Main Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'No token provided. Please log in.'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          statusCode: 401,
          message: 'Token has expired. Please log in again.',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Invalid token'
      });
    }

    // Fetch user from database
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'User not found'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        message: 'Your account has been deactivated. Contact support for assistance.'
      });
    }

    // Load additional role-specific data
    if (user.role === 'donor') {
      const donor = await Donor.findOne({ user: user._id });
      if (donor) {
        req.donor = donor;
        req.donorStatus = donor.status;
      }
    }

    // Attach user to request object
    req.user = user;
    req.userId = user._id;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Authentication error'
    });
  }
};

/**
 * Authorization Middleware - Check Roles
 * @param {...string} allowedRoles - Roles allowed to access the route
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.warn(`🚫 Unauthorized access attempt: User ${req.user._id} (${req.user.role}) tried to access ${req.method} ${req.path}`);
      return res.status(403).json({
        success: false,
        statusCode: 403,
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};

/**
 * Check if Donor is Approved
 * Donors must be approved by admin before performing actions
 */
const requireApprovedDonor = async (req, res, next) => {
  try {
    if (req.user.role !== 'donor') {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        message: 'Only donors can access this resource'
      });
    }

    const donor = await Donor.findOne({ user: req.user._id });
    
    if (!donor) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Donor profile not found'
      });
    }

    if (donor.status !== 'active') {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        message: `Your account status is ${donor.status}. Please wait for admin approval.`
      });
    }

    req.donor = donor;
    next();
  } catch (error) {
    console.error('Donor approval check error:', error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error checking donor status'
    });
  }
};

/**
 * Check if User is Not Minor
 * Prevent minors from donating
 */
const requireAdultDonor = async (req, res, next) => {
  try {
    if (req.user.role !== 'donor') {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        message: 'Only donors can access this resource'
      });
    }

    const donor = await Donor.findOne({ user: req.user._id });
    
    if (!donor) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Donor profile not found'
      });
    }

    // Check age
    const today = new Date();
    const birthDate = new Date(donor.personalInfo.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        message: 'You must be at least 18 years old to donate'
      });
    }

    req.donor = donor;
    next();
  } catch (error) {
    console.error('Adult donor check error:', error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error checking age eligibility'
    });
  }
};

/**
 * Verify User Ownership
 * Ensure user can only modify their own resources
 */
const verifyOwnership = async (req, res, next) => {
  try {
    const resourceUserId = req.params.userId || req.body.userId;

    if (resourceUserId && req.user._id.toString() !== resourceUserId) {
      // Allow admins to modify other users
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          statusCode: 403,
          message: 'You cannot modify other users\' data'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Ownership verification error:', error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Error verifying ownership'
    });
  }
};

/**
 * Optional Authentication
 * Allows requests to proceed even without authentication
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (user && user.isActive) {
      req.user = user;
      req.userId = user._id;
    }

    next();
  } catch (error) {
    // Silently continue if token is invalid
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  requireApprovedDonor,
  requireAdultDonor,
  verifyOwnership,
  optionalAuth
};
