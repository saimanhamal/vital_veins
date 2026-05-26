/**
 * Authentication Service
 * Handles JWT token generation, refresh tokens, and password management
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');

class AuthService {
  /**
   * Generate Access Token
   * @param {string} userId - User ID
   * @param {string} role - User role
   * @returns {string} JWT token
   */
  static generateAccessToken(userId, role) {
    return jwt.sign(
      { id: userId, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
  }

  /**
   * Generate Refresh Token
   * @param {string} userId - User ID
   * @returns {string} JWT refresh token
   */
  static generateRefreshToken(userId) {
    return jwt.sign(
      { id: userId, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
  }

  /**
   * Verify JWT Token
   * @param {string} token - JWT token
   * @param {string} secret - JWT secret (optional, uses default if not provided)
   * @returns {Object} Decoded token
   */
  static verifyToken(token, secret = null) {
    try {
      return jwt.verify(token, secret || process.env.JWT_SECRET);
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  /**
   * Hash Password
   * @param {string} password - Plain password
   * @returns {Promise<string>} Hashed password
   */
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compare Passwords
   * @param {string} plainPassword - Plain password
   * @param {string} hashedPassword - Hashed password
   * @returns {Promise<boolean>}
   */
  static async comparePasswords(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Generate Password Reset Token
   * @returns {Object} {token: string, hashedToken: string, expiresAt: Date}
   */
  static generatePasswordResetToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    return { token, hashedToken, expiresAt };
  }

  /**
   * Generate Email Verification Token
   * @returns {Object} {token: string, hashedToken: string, expiresAt: Date}
   */
  static generateEmailVerificationToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    return { token, hashedToken, expiresAt };
  }

  /**
   * Generate OTP (One-Time Password)
   * @returns {Object} {otp: string, expiresAt: Date}
   */
  static generateOTP() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    return { otp, expiresAt };
  }

  /**
   * Refresh Access Token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} {accessToken: string, refreshToken: string}
   */
  static async refreshAccessToken(refreshToken) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );

      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      const newAccessToken = this.generateAccessToken(user._id, user.role);
      const newRefreshToken = this.generateRefreshToken(user._id);

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Validate Password Strength
   * @param {string} password - Password to validate
   * @returns {boolean}
   */
  static validatePasswordStrength(password) {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/\d/.test(password)) return false;
    return true;
  }

  /**
   * Update User Password
   * @param {string} userId - User ID
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>}
   */
  static async updatePassword(userId, oldPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    
    if (!user) throw new Error('User not found');

    const isPasswordValid = await this.comparePasswords(oldPassword, user.password);
    if (!isPasswordValid) throw new Error('Current password is incorrect');

    if (!this.validatePasswordStrength(newPassword)) {
      throw new Error('New password does not meet strength requirements');
    }

    user.password = newPassword;
    await user.save();

    return true;
  }

  /**
   * Reset Password
   * @param {string} userId - User ID
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>}
   */
  static async resetPassword(userId, newPassword) {
    if (!this.validatePasswordStrength(newPassword)) {
      throw new Error('Password does not meet strength requirements');
    }

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    user.password = newPassword;
    await user.save();

    return true;
  }

  /**
   * Check if Email is Already Registered
   * @param {string} email - Email to check
   * @returns {Promise<boolean>}
   */
  static async isEmailRegistered(email) {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    return !!user;
  }

  /**
   * Check if Phone is Already Registered
   * @param {string} phone - Phone to check
   * @returns {Promise<boolean>}
   */
  static async isPhoneRegistered(phone) {
    const user = await User.findOne({ phone: phone.trim() });
    return !!user;
  }
}

module.exports = AuthService;
