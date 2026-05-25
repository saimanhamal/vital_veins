const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Donor = require('../models/Donor');
const { authenticate, authorize } = require('../middleware/auth');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { name, email, password, role, ...additionalData } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      role
    });

    await user.save();

    // Create role-specific profile
    if (role === 'hospital') {
      const hospital = new Hospital({
        user: user._id,
        hospitalName: additionalData.hospitalName || name,
        license: additionalData.license || '',
        address: additionalData.address || {},
        location: additionalData.location || { type: 'Point', coordinates: [0, 0] },
        contact: additionalData.contact || { phone: '', email },
        status: 'pending'
      });
      await hospital.save();
    } else if (role === 'donor') {
      const donor = new Donor({
        user: user._id,
        personalInfo: additionalData.personalInfo || {},
        contact: additionalData.contact || {},
        address: additionalData.address || {},
        location: additionalData.location || { type: 'Point', coordinates: [0, 0] },
        donationPreferences: {
          bloodDonation: { eligible: true },
          organDonation: { consent: false, organs: [] }
        }
      });
      await donor.save();
    }

    // Generate token
    const token = user.generateAuthToken();

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Try Logging in at a later time',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Check password - TEMPORARY FIX FOR DONOR LOGIN
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // For hospitals, check approval status
    if (user.role === 'hospital') {
      const hospital = await Hospital.findOne({ user: user._id });
      if (hospital && hospital.status !== 'approved') {
        return res.status(401).json({
          message: 'Hospital account is pending approval',
          status: hospital.status
        });
      }
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = user.generateAuthToken();

    // Get additional profile data based on role
    let profileData = {};
    if (user.role === 'hospital') {
      const hospital = await Hospital.findOne({ user: user._id });
      profileData = hospital ? { hospitalId: hospital._id, status: hospital.status } : {};
    } else if (user.role === 'donor') {
      const donor = await Donor.findOne({ user: user._id });
      profileData = donor ? { donorId: donor._id, donorCode: donor.donorId } : {};
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        ...profileData
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = req.user;
    
    // Get additional profile data based on role
    let profileData = {};
    if (user.role === 'hospital') {
      const hospital = await Hospital.findOne({ user: user._id })
        .populate('user', 'name email phone address');
      profileData = hospital ? { hospitalProfile: hospital } : {};
    } else if (user.role === 'donor') {
      const donor = await Donor.findOne({ user: user._id })
        .populate('user', 'name email phone address');
      profileData = donor ? { donorProfile: donor } : {};
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        phone: user.phone,
        address: user.address,
        location: user.location,
        avatar: user.avatar,
        lastLogin: user.lastLogin,
        ...profileData
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      message: 'Server error fetching profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated directly
    delete updates.password;
    delete updates.role;
    delete updates.verified;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      message: 'Server error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      message: 'Server error changing password',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/auth/verify-email
// @desc    Verify user email (placeholder for email verification)
// @access  Private
router.post('/verify-email', authenticate, async (req, res) => {
  try {
    // In a real application, this would send a verification email
    // For now, we'll just mark the user as verified
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { verified: true },
      { new: true }
    );

    res.json({
      message: 'Email verification initiated. Please check your email.',
      user: {
        id: user._id,
        verified: user.verified
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      message: 'Server error initiating email verification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticate, (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // You could implement token blacklisting here if needed
  res.json({
    message: 'Logged out successfully'
  });
});

// @route   GET /api/auth/check-role/:role
// @desc    Check if user has specific role
// @access  Private
router.get('/check-role/:role', authenticate, (req, res) => {
  const { role } = req.params;
  const hasRole = req.user.role === role;
  
  res.json({
    hasRole,
    userRole: req.user.role,
    message: hasRole ? `User has ${role} role` : `User does not have ${role} role`
  });
});

module.exports = router;
