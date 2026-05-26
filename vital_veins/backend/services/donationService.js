/**
 * Donation Service
 * Handles all donation-related business logic
 */

const Donor = require('../models/Donor');
const Appointment = require('../models/Appointment');
const { validateAge, validateDonationEligibility, validateNotSelfRequest } = require('../utils/validators');

class DonationService {
  /**
   * Check Donor Eligibility for Donation
   * @param {string} donorId - Donor ID
   * @returns {Promise<Object>}
   */
  static async checkDonorEligibility(donorId) {
    const donor = await Donor.findById(donorId).populate('user');

    if (!donor) {
      throw new Error('Donor not found');
    }

    const eligibility = {
      canDonate: true,
      reasons: [],
      restrictions: []
    };

    // Check donor status
    if (donor.status !== 'active') {
      eligibility.canDonate = false;
      eligibility.reasons.push(`Donor status is ${donor.status}. Only active donors can donate.`);
    }

    // Check if donor is available
    if (!donor.availability.isAvailable) {
      eligibility.canDonate = false;
      eligibility.reasons.push('Donor has marked themselves as unavailable');
      eligibility.restrictions.push({
        type: 'availability',
        until: donor.availability.unavailableUntil,
        reason: donor.availability.unavailableReason
      });
    }

    // Check age (must be 18+)
    const ageValidation = validateAge(donor.personalInfo.dateOfBirth);
    if (!ageValidation.isValid) {
      eligibility.canDonate = false;
      eligibility.reasons.push(ageValidation.message);
    }

    // Check last donation date (90-day rule)
    const donationEligibility = validateDonationEligibility(donor.lastCompletedDonationDate);
    if (!donationEligibility.canDonate) {
      eligibility.canDonate = false;
      eligibility.reasons.push(donationEligibility.message);
      eligibility.restrictions.push({
        type: 'donation_interval',
        daysUntilEligible: donationEligibility.daysUntilEligible
      });
    }

    // Check for cancellation rate (flag if > 20%)
    if (donor.appointmentMetrics.cancellationRate > 20) {
      eligibility.restrictions.push({
        type: 'high_cancellation_rate',
        rate: donor.appointmentMetrics.cancellationRate
      });
    }

    // Check if flagged for review
    if (donor.appointmentMetrics.flaggedForReview) {
      eligibility.canDonate = false;
      eligibility.reasons.push('Donor account is flagged for review');
    }

    return eligibility;
  }

  /**
   * Check if Donor Can Accept Blood Request
   * @param {string} donorId - Donor ID
   * @param {string} requestorId - Requestor ID
   * @param {string} requestedBloodType - Blood type requested
   * @returns {Promise<Object>}
   */
  static async canAcceptRequest(donorId, requestorId, requestedBloodType) {
    // Prevent self-requests
    if (!validateNotSelfRequest(donorId, requestorId)) {
      throw new Error('Donors cannot request their own blood');
    }

    // Check donor eligibility
    const eligibility = await this.checkDonorEligibility(donorId);

    if (!eligibility.canDonate) {
      return {
        canAccept: false,
        reasons: eligibility.reasons
      };
    }

    // Check blood type match
    const donor = await Donor.findById(donorId);
    if (donor.personalInfo.bloodType !== requestedBloodType) {
      return {
        canAccept: false,
        reasons: [`Donor blood type (${donor.personalInfo.bloodType}) does not match requested type (${requestedBloodType})`]
      };
    }

    // Check for conflicting appointments
    const conflictingAppointments = await Appointment.countDocuments({
      donor: donorId,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (conflictingAppointments > 0) {
      return {
        canAccept: false,
        reasons: ['Donor already has pending or confirmed appointments']
      };
    }

    return {
      canAccept: true,
      reasons: []
    };
  }

  /**
   * Calculate Last Possible Donation Date
   * @param {string} donorId - Donor ID
   * @returns {Promise<Date>}
   */
  static async calculateNextDonationDate(donorId) {
    const donor = await Donor.findById(donorId);

    if (!donor || !donor.lastCompletedDonationDate) {
      return new Date(); // Can donate now
    }

    const DONATION_INTERVAL_DAYS = 90;
    const nextDate = new Date(donor.lastCompletedDonationDate);
    nextDate.setDate(nextDate.getDate() + DONATION_INTERVAL_DAYS);

    return nextDate;
  }

  /**
   * Get Donor Statistics
   * @param {string} donorId - Donor ID
   * @returns {Promise<Object>}
   */
  static async getDonorStats(donorId) {
    const donor = await Donor.findById(donorId);

    if (!donor) {
      throw new Error('Donor not found');
    }

    const totalDonations = donor.donationHistory.filter(d => d.status === 'completed').length;
    const completedAppointments = donor.appointmentMetrics.completedAppointments;
    const cancelledAppointments = donor.appointmentMetrics.cancelledAppointments;

    return {
      totalDonations,
      completedAppointments,
      cancelledAppointments,
      cancellationRate: donor.appointmentMetrics.cancellationRate,
      points: donor.donationPoints.current,
      lifetimePoints: donor.donationPoints.lifetime,
      lastDonation: donor.lastCompletedDonationDate,
      availability: donor.availability.isAvailable,
      status: donor.status,
      milestones: donor.milestones.length
    };
  }

  /**
   * Toggle Donor Availability
   * @param {string} donorId - Donor ID
   * @param {boolean} isAvailable - Availability status
   * @param {Object} options - Additional options {unavailableReason, unavailableUntil}
   * @returns {Promise<Object>}
   */
  static async toggleDonorAvailability(donorId, isAvailable, options = {}) {
    const donor = await Donor.findByIdAndUpdate(
      donorId,
      {
        $set: {
          'availability.isAvailable': isAvailable,
          'availability.lastAvailabilityToggle': new Date(),
          ...(options.unavailableReason && { 'availability.unavailableReason': options.unavailableReason }),
          ...(options.unavailableUntil && { 'availability.unavailableUntil': options.unavailableUntil })
        }
      },
      { new: true }
    );

    if (!donor) {
      throw new Error('Donor not found');
    }

    return {
      success: true,
      message: `Availability updated to ${isAvailable ? 'available' : 'unavailable'}`,
      donor: {
        id: donor._id,
        availability: donor.availability
      }
    };
  }

  /**
   * Record Donation Completion
   * @param {string} donorId - Donor ID
   * @param {string} appointmentId - Appointment ID
   * @param {Object} details - Donation details
   * @returns {Promise<Object>}
   */
  static async recordDonation(donorId, appointmentId, details = {}) {
    const donor = await Donor.findById(donorId);

    if (!donor) {
      throw new Error('Donor not found');
    }

    // Update last donation date
    donor.lastCompletedDonationDate = new Date();

    // Add to donation history
    donor.donationHistory.push({
      type: details.type || 'blood',
      hospital: details.hospitalId,
      date: new Date(),
      quantity: details.quantity || 1,
      status: 'completed',
      notes: details.notes
    });

    // Update points
    const pointsEarned = 100; // Base points
    donor.donationPoints.current += pointsEarned;
    donor.donationPoints.lifetime += pointsEarned;

    // Update appointment metrics
    donor.appointmentMetrics.completedAppointments++;
    donor.appointmentMetrics.totalAppointments++;

    await donor.save();

    return {
      success: true,
      message: 'Donation recorded successfully',
      pointsEarned,
      donor: {
        id: donor._id,
        points: donor.donationPoints.current,
        totalDonations: donor.donationHistory.filter(d => d.status === 'completed').length,
        lastDonation: donor.lastCompletedDonationDate
      }
    };
  }

  /**
   * Get Donors by Blood Type (for matching requests)
   * @param {string} bloodType - Blood type to search for
   * @param {Object} options - Search options {maxDistance, excludeIds, status}
   * @returns {Promise<Array>}
   */
  static async getDonorsByBloodType(bloodType, options = {}) {
    const query = {
      'personalInfo.bloodType': bloodType,
      status: options.status || 'active',
      'availability.isAvailable': true,
      isActive: true
    };

    // Exclude specific donors
    if (options.excludeIds && options.excludeIds.length > 0) {
      query._id = { $nin: options.excludeIds };
    }

    // Apply geolocation filter if needed
    let donors = await Donor.find(query)
      .populate('user', 'name email')
      .sort({ 'appointmentMetrics.completedAppointments': -1 }) // Sort by experience
      .limit(options.limit || 50);

    // Filter by distance if location provided
    if (options.location && options.maxDistance) {
      donors = donors.filter(donor => {
        const distance = this.calculateDistance(
          options.location.coordinates,
          donor.location.coordinates
        );
        return distance <= options.maxDistance;
      });
    }

    return donors;
  }

  /**
   * Calculate Distance Between Two Coordinates
   * Using Haversine formula
   * @param {Array} coords1 - [longitude, latitude]
   * @param {Array} coords2 - [longitude, latitude]
   * @returns {number} Distance in kilometers
   */
  static calculateDistance(coords1, coords2) {
    const [lon1, lat1] = coords1;
    const [lon2, lat2] = coords2;
    const R = 6371; // Earth's radius in km

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }
}

module.exports = DonationService;
