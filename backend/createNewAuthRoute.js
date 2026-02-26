const fs = require('fs');
const path = require('path');

// Create a completely new auth route with detailed logging
const newAuthRoute = `const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Donor = require('../models/Donor');
const { authenticate, authorize } = require('../middleware/auth');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');
const bcrypt = require('bcryptjs');

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
        status: 'active'
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
      message: 'Server error during registration',
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
    
    console.log(\`🔐 Login attempt: \${email}\`);

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log(\`❌ User not found: \${email}\`);
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }
    
    console.log(\`✅ User found: \${user.name} (Role: \${user.role})\`);
    console.log(\`📊 User active: \${user.isActive}, verified: \${user.verified}\`);

    // Check if account is active
    if (!user.isActive) {
      console.log(\`❌ Account inactive: \${email}\`);
      return res.status(401).json({
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Check password using direct bcrypt comparison
    console.log(\`🔍 Checking password for: \${email}\`);
    console.log(\`🔍 Password hash exists: \${user.password ? 'Yes' : 'No'}\`);
    
    if (!user.password) {
      console.log(\`❌ No password hash found for: \${email}\`);
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(\`🔐 Password valid: \${isPasswordValid} for \${email}\`);
    
    if (!isPasswordValid) {
      console.log(\`❌ Invalid password for: \${email}\`);
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // For hospitals, check approval status
    if (user.role === 'hospital') {
      const hospital = await Hospital.findOne({ user: user._id });
      if (hospital && hospital.status !== 'approved') {
        console.log(\`❌ Hospital not approved: \${email}\`);
        return res.status(401).json({
          message: 'Hospital account is pending approval',
          status: hospital.status
        });
      }
    }

    // For donors, ensure donor profile exists
    if (user.role === 'donor') {
      const donor = await Donor.findOne({ user: user._id });
      if (!donor) {
        console.log(\`⚠️ No donor profile found for: \${email}\`);
        // Create a basic donor profile if it doesn't exist
        const newDonor = new Donor({
          user: user._id,
          personalInfo: {
            firstName: user.name.split(' ')[0] || 'Unknown',
            lastName: user.name.split(' ')[1] || '',
            bloodType: 'Unknown'
          },
          status: 'active'
        });
        await newDonor.save();
        console.log(\`✅ Created donor profile for: \${email}\`);
      }
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = user.generateAuthToken();
    
    console.log(\`✅ Login successful: \${email}\`);

    res.json({
      message: 'Login successful',
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
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticate, async (req, res) => {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we'll just send a success response
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      message: 'Server error during logout',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        isActive: user.isActive,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/auth/verify/:token
// @desc    Verify user email
// @access  Public
router.put('/verify/:token', async (req, res) => {
  try {
    // Implementation for email verification
    res.json({ message: 'Email verification endpoint' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      message: 'Server error during verification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    // Implementation for password reset request
    res.json({ message: 'Password reset endpoint' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      message: 'Server error during password reset request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    // Implementation for password reset
    res.json({ message: 'Password reset endpoint' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      message: 'Server error during password reset',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
`;

// Backup the original file
const authPath = path.join(__dirname, 'routes', 'auth.js');
const backupPath = path.join(__dirname, 'routes', 'auth.js.backup');

if (fs.existsSync(authPath)) {
  fs.copyFileSync(authPath, backupPath);
  console.log('✅ Backed up original auth.js to auth.js.backup');
}

// Write the new auth route
fs.writeFileSync(authPath, newAuthRoute);
console.log('✅ Created new auth route with detailed logging and direct bcrypt comparison');
console.log('🔄 Please restart the backend server for changes to take effect');
console.log('   Stop server (Ctrl+C) then: npm start');
console.log('');
console.log('🧪 After restarting, the login will have detailed console logs');
console.log('📝 Check the server console for detailed login attempt information');
