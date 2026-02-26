const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Donor = require('../models/Donor');
const Notification = require('../models/Notification');
const { authenticate, authorize } = require('../middleware/auth');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');
const bcrypt = require('bcryptjs');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    console.log('📥 Registration request body:', JSON.stringify(req.body));
    const { name, email, password, role, ...additionalData } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this email'
      });
    }

    // Create user - new donors start as unverified (pending)
    const user = new User({
      name,
      email,
      password,
      role,
      verified: role === 'donor' ? false : true  // Donors need verification, others don't
    });

    await user.save();
    console.log(`📝 User created: ${user.email}, verified: ${user.verified}, role: ${role}`);

    // Create role-specific profile
    if (role === 'hospital') {
      const hospital = new Hospital({
        user: user._id,
        hospitalName: additionalData.hospitalName || name,
        license: additionalData.license || '',
        address: additionalData.address || {
          street: 'N/A', city: 'N/A', state: 'N/A', zipCode: '00000', country: 'N/A'
        },
        location: additionalData.location || { type: 'Point', coordinates: [0, 0] },
        contact: additionalData.contact || { phone: additionalData.phone || '+0000000000', email },
        status: 'pending'
      });
      await hospital.save();
      
      // Create notification for admin about new hospital registration
      const adminUsers = await User.find({ role: 'admin' });
      if (adminUsers.length > 0) {
        const notification = new Notification({
          notificationId: `hospital_reg_${Date.now()}`,
          sender: user._id,
          recipients: adminUsers.map(admin => ({
            user: admin._id,
            role: 'admin',
            read: false
          })),
          type: 'hospital_registered',
          title: 'New Hospital Registration',
          message: `${hospital.hospitalName} has registered and is pending approval`,
          data: {
            hospitalId: hospital._id,
            hospitalName: hospital.hospitalName
          },
          priority: 'high'
        });
        await notification.save();
        
        // Send notification via socket if available
        if (req.io) {
          adminUsers.forEach(admin => {
            req.io.to(`user_${admin._id}`).emit('notification', {
              type: 'hospital_registered',
              message: `${hospital.hospitalName} has registered and is pending approval`
            });
          });
        }
      }
    } else if (role === 'donor') {
      // Create donor profile immediately using provided personalInfo or sensible defaults
      try {
        const personalInfo = additionalData.personalInfo || {};
        const donor = new Donor({
          user: user._id,
          personalInfo: {
            firstName: personalInfo.firstName || (user.name ? user.name.split(' ')[0] : ''),
            lastName: personalInfo.lastName || (user.name ? (user.name.split(' ')[1] || '') : ''),
            dateOfBirth: personalInfo.dateOfBirth || new Date('1970-01-01'),
            gender: (personalInfo.gender || 'other').toString().toLowerCase(),
            bloodType: personalInfo.bloodType || 'O+',
            weight: personalInfo.weight || 70,
            height: personalInfo.height || 170
          },
          contact: additionalData.contact || {
            phone: additionalData.phone || '+0000000000',
            emergencyContact: {
              name: 'Not provided',
              phone: '+0000000000',
              relationship: 'Unknown'
            }
          },
          address: additionalData.address || {
            street: 'N/A',
            city: 'N/A',
            state: 'N/A',
            zipCode: '00000',
            country: 'India'
          },
          location: additionalData.location || { type: 'Point', coordinates: [0, 0] },
          status: 'pending',
          isActive: true
        });
        await donor.save();
        console.log(`✅ Created donor profile (pending) for: ${user.email}`);
      } catch (createErr) {
        console.error('Failed to create donor profile on registration:', createErr);
      }
    }

    // Generate token
    const token = user.generateAuthToken();

    // Send confirmation notification for hospital registration
    if (role === 'hospital') {
      // Create a confirmation notification for the hospital
      const confirmationNotification = new Notification({
        notificationId: `hospital_confirm_${Date.now()}`,
        sender: user._id, // Self-notification
        recipients: [{
          user: user._id,
          role: 'hospital',
          read: false
        }],
        type: 'general',
        title: 'Registration Received',
        message: 'Your hospital registration has been received and is pending admin approval.',
        priority: 'medium'
      });
      await confirmationNotification.save();
      
      // Send notification via socket if available
      if (req.io) {
        req.io.to(`user_${user._id}`).emit('notification', {
          type: 'general',
          message: 'Your hospital registration has been received and is pending admin approval.'
        });
      }
    }

    res.status(201).json({
      message: 'Thank you for joining! Verification is underway.',
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
    
    console.log(`🔐 Login attempt: ${email}`);
    console.log(`🔐 Request body:`, req.body);

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }
    
    console.log(`✅ User found: ${user.name} (Role: ${user.role})`);
    console.log(`📊 User active: ${user.isActive}, verified: ${user.verified}`);
    console.log(`📊 User password hash: ${user.password}`);

    // Check if account is active
    if (!user.isActive) {
      console.log(`❌ Account inactive: ${email}`);
      return res.status(401).json({
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Check password using direct bcrypt comparison
    console.log(`🔍 Checking password for: ${email}`);
    console.log(`🔍 Password hash exists: ${user.password ? 'Yes' : 'No'}`);
    
    if (!user.password) {
      console.log(`❌ No password hash found for: ${email}`);
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(`🔐 Password valid: ${isPasswordValid} for ${email}`);
    
    if (!isPasswordValid) {
      console.log(`❌ Invalid password for: ${email}`);
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // For hospitals, check approval status
    if (user.role === 'hospital') {
      let hospital = await Hospital.findOne({ user: user._id });
      
      // If no hospital profile exists, create one
      if (!hospital) {
        console.log(`⚠️  No hospital profile found, creating default profile for: ${email}`);
        try {
          hospital = new Hospital({
            user: user._id,
            hospitalName: user.name || 'Hospital',
            license: '',
            address: {},
            location: { type: 'Point', coordinates: [0, 0] },
            contact: { phone: user.phone || '', email: user.email },
            status: 'pending'
          });
          await hospital.save();
          console.log(`✅ Created default hospital profile for: ${email}`);
        } catch (err) {
          console.error(`❌ Failed to create hospital profile: ${err.message}`);
          return res.status(500).json({ message: 'Failed to create hospital profile' });
        }
      }
      
      // Check approval status
      if (hospital.status !== 'approved') {
        console.log(`⏳ Hospital not approved: ${email} (status: ${hospital.status})`);
        return res.status(401).json({
          message: 'Hospital account is pending approval. Please wait for admin review.',
          status: hospital.status
        });
      }
    }

    // For donors, check approval status (pending validation)
    if (user.role === 'donor') {
      const donor = await Donor.findOne({ user: user._id });
      
      // Check if donor is pending
      if (donor && donor.status === 'pending') {
        console.log(`⏳ Donor account pending approval: ${email}`);
        return res.status(403).json({
          message: 'Your account is under verification. Admin will review your profile soon.',
          status: 'pending',
          hint: 'Please check back later or contact support for updates'
        });
      }

      if (!donor) {
        console.log(`⚠️ No donor profile found for: ${email}`);
        // Create a minimal donor profile that satisfies required schema fields
        try {
          const newDonor = new Donor({
            user: user._id,
            personalInfo: {
              firstName: user.name ? user.name.split(' ')[0] : 'Donor',
              lastName: user.name ? (user.name.split(' ')[1] || '') : '',
              dateOfBirth: new Date('1970-01-01'),
              gender: 'Other',
              bloodType: 'O+',
              weight: 70,
              height: 170
            },
            contact: {
              phone: '+0000000000',
              emergencyContact: {
                name: 'Not provided',
                phone: '+0000000000',
                relationship: 'Unknown'
              }
            },
            address: {
              street: 'N/A',
              city: 'N/A',
              state: 'N/A',
              zipCode: '00000',
              country: 'India'
            },
            location: { type: 'Point', coordinates: [0, 0] },
            status: 'pending'
          });
          await newDonor.save();
          console.log(`✅ Created minimal donor profile (pending) for: ${email}`);
        } catch (createErr) {
          console.error('Failed to create donor profile on login:', createErr);
        }
      } else {
        console.log(`✅ Donor profile found for: ${email}`);
      }
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = user.generateAuthToken();
    
    console.log(`✅ Login successful: ${email}`);

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
    res.json({ message: 'Logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      message: 'Server error during logout',
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
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      message: 'Server error changing password',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
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
