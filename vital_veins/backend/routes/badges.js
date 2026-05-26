const express = require('express');
const router = express.Router();
const Badge = require('../models/Badge');
const Donor = require('../models/Donor');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const { authenticate, authorize } = require('../middleware/auth');
const { validatePagination, validateObjectId } = require('../middleware/validation');

/**
 * @route   GET /api/badges/donor
 * @desc    Get badges earned by donor
 * @access  Private (Donor only)
 */
router.get('/donor', authenticate, authorize('donor'), async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user._id }).populate('milestones.badge');
    
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    const badges = donor.milestones.map(m => ({
      _id: m.badge._id,
      badgeId: m.badge.badgeId,
      name: m.badge.name,
      description: m.badge.description,
      icon: m.badge.icon,
      tier: m.badge.tier,
      reward: m.badge.reward,
      awardedAt: m.awardedAt,
      acknowledged: m.acknowledged
    }));

    // Get next milestone
    const totalDonations = donor.donationHistory.filter(d => d.status === 'completed').length;
    const totalVolume = donor.donationHistory.reduce((sum, d) => sum + (d.quantity || 450), 0) * 450; // ~450ml per donation
    
    const unachievedBadges = await Badge.find({
      $or: [
        { 'requirement.type': 'donation_count', 'requirement.value': { $gt: totalDonations } },
        { 'requirement.type': 'donation_volume', 'requirement.value': { $gt: totalVolume } }
      ]
    }).sort({ 'requirement.value': 1 }).limit(1);

    let nextMilestone = null;
    if (unachievedBadges.length > 0) {
      const badge = unachievedBadges[0];
      const progress = badge.requirement.type === 'donation_count' ? totalDonations : totalVolume;
      nextMilestone = {
        badge: badge._id,
        badgeId: badge.badgeId,
        name: badge.name,
        progress: `${Math.floor(progress)}/${badge.requirement.value}`,
        reward: badge.reward,
        daysRemaining: null // Can be calculated if needed
      };
    }

    res.json({
      badges,
      totalBadges: badges.length,
      donationPoints: donor.donationPoints,
      statistics: {
        totalDonations,
        totalVolume: Math.round(totalVolume / 1000), // in liters
        monthlyDonations: donor.donationHistory.filter(d => {
          const now = new Date();
          const donationDate = new Date(d.date);
          return donationDate.getMonth() === now.getMonth() && donationDate.getFullYear() === now.getFullYear();
        }).length
      },
      nextMilestone
    });
  } catch (error) {
    console.error('Error fetching donor badges:', error);
    res.status(500).json({
      message: 'Server error fetching badges',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/badges/milestones
 * @desc    Get milestone progress for donor
 * @access  Private (Donor only)
 */
router.get('/milestones', authenticate, authorize('donor'), async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user._id });
    
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    const allBadges = await Badge.find({ isActive: true }).sort({ 'requirement.value': 1 });
    const completedBadgeIds = donor.milestones.map(m => m.badge);
    
    const totalDonations = donor.donationHistory.filter(d => d.status === 'completed').length;
    const totalVolume = donor.donationHistory.reduce((sum, d) => sum + (d.quantity || 450), 0) * 450;

    const milestones = allBadges.map(badge => {
      const isAchieved = completedBadgeIds.some(id => id.toString() === badge._id.toString());
      
      let progress = 0;
      if (badge.requirement.type === 'donation_count') {
        progress = totalDonations;
      } else if (badge.requirement.type === 'donation_volume') {
        progress = Math.round(totalVolume / 1000); // in liters
      }

      return {
        badgeId: badge.badgeId,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        tier: badge.tier,
        achieved: isAchieved,
        progress: isAchieved ? '100%' : `${Math.floor((progress / badge.requirement.value) * 100)}%`,
        requirement: `${badge.requirement.type === 'donation_count' ? totalDonations : Math.round(totalVolume / 1000)}/${badge.requirement.value}`,
        reward: badge.reward,
        awardedAt: isAchieved ? donor.milestones.find(m => m.badge.toString() === badge._id.toString())?.awardedAt : null
      };
    });

    // Determine current level based on badges achieved
    const achievedCount = milestones.filter(m => m.achieved).length;
    let currentLevel = 'bronze';
    if (achievedCount >= 15) currentLevel = 'platinum';
    else if (achievedCount >= 10) currentLevel = 'gold';
    else if (achievedCount >= 5) currentLevel = 'silver';

    res.json({
      currentLevel,
      totalBadgesEarned: milestones.filter(m => m.achieved).length,
      milestones,
      statistics: {
        totalDonations,
        totalVolume: Math.round(totalVolume / 1000),
        monthlyDonations: donor.donationHistory.filter(d => {
          const now = new Date();
          const donationDate = new Date(d.date);
          return donationDate.getMonth() === now.getMonth() && donationDate.getFullYear() === now.getFullYear();
        }).length,
        lifetimeDonations: totalDonations
      }
    });
  } catch (error) {
    console.error('Error fetching milestones:', error);
    res.status(500).json({
      message: 'Server error fetching milestones',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/admin/badges
 * @desc    Get all badges (Admin)
 * @access  Private (Admin only)
 */
router.get('/admin/badges', authenticate, authorize('admin'), validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20, tier, isActive } = req.query;
    
    const filter = {};
    if (tier) filter.tier = tier;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const badges = await Badge.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Badge.countDocuments(filter);

    res.json({
      badges,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({
      message: 'Server error fetching badges',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/admin/badges
 * @desc    Create new badge
 * @access  Private (Admin only)
 */
router.post('/admin/badges', authenticate, authorize('admin'), async (req, res) => {
  try {
    const {
      name,
      description,
      icon,
      requirement,
      tier,
      reward
    } = req.body;

    // Validation
    if (!name || !description || !requirement) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const badgeId = name.replace(/\s+/g, '_').toUpperCase();
    
    const badge = new Badge({
      badgeId,
      name,
      description,
      icon,
      requirement,
      tier: tier || 'bronze',
      reward: reward || { points: 10, description: 'Badge earned' }
    });

    await badge.save();

    res.status(201).json({
      message: 'Badge created successfully',
      badge
    });
  } catch (error) {
    console.error('Error creating badge:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Badge ID already exists' });
    }

    res.status(500).json({
      message: 'Server error creating badge',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/admin/badges/:badgeId
 * @desc    Update badge
 * @access  Private (Admin only)
 */
router.put('/admin/badges/:badgeId', authenticate, authorize('admin'), validateObjectId('badgeId'), async (req, res) => {
  try {
    const { name, description, isActive, reward, tier } = req.body;

    const badge = await Badge.findByIdAndUpdate(
      req.params.badgeId,
      {
        $set: {
          name: name || undefined,
          description: description || undefined,
          isActive: isActive !== undefined ? isActive : undefined,
          reward: reward || undefined,
          tier: tier || undefined,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    );

    if (!badge) {
      return res.status(404).json({ message: 'Badge not found' });
    }

    res.json({
      message: 'Badge updated successfully',
      badge
    });
  } catch (error) {
    console.error('Error updating badge:', error);
    res.status(500).json({
      message: 'Server error updating badge',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   DELETE /api/admin/badges/:badgeId
 * @desc    Delete badge
 * @access  Private (Admin only)
 */
router.delete('/admin/badges/:badgeId', authenticate, authorize('admin'), validateObjectId('badgeId'), async (req, res) => {
  try {
    const badge = await Badge.findByIdAndDelete(req.params.badgeId);

    if (!badge) {
      return res.status(404).json({ message: 'Badge not found' });
    }

    res.json({ message: 'Badge deleted successfully' });
  } catch (error) {
    console.error('Error deleting badge:', error);
    res.status(500).json({
      message: 'Server error deleting badge',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/badges/check-eligibility
 * @desc    Check and award new badges to all donors (Cron job or admin trigger)
 * @access  Private (Admin only)
 */
router.post('/check-eligibility', authenticate, authorize('admin'), async (req, res) => {
  try {
    const badges = await Badge.find({ isActive: true });
    let totalAwarded = 0;

    for (const badge of badges) {
      // Get all donors
      const donors = await Donor.find({ isActive: true }).populate('milestones.badge');

      for (const donor of donors) {
        const alreadyHas = donor.milestones.some(m => m.badge._id.toString() === badge._id.toString());
        
        if (alreadyHas) continue;

        let isEligible = false;
        const totalDonations = donor.donationHistory.filter(d => d.status === 'completed').length;
        const totalVolume = donor.donationHistory.reduce((sum, d) => sum + (d.quantity || 450), 0) * 450;

        if (badge.requirement.type === 'donation_count' && totalDonations >= badge.requirement.value) {
          isEligible = true;
        } else if (badge.requirement.type === 'donation_volume' && totalVolume >= badge.requirement.value) {
          isEligible = true;
        }

        if (isEligible) {
          // Award badge
          donor.milestones.push({
            badge: badge._id,
            awardedAt: new Date(),
            acknowledged: false
          });

          // Add points
          donor.donationPoints.current += badge.reward.points;
          donor.donationPoints.total += badge.reward.points;
          donor.donationPoints.lifetime += badge.reward.points;

          await donor.save();

          // Create notification
          await Notification.createNotification({
            recipients: [{ user: donor.user, role: 'donor' }],
            type: 'badge_awarded',
            title: `🎉 Badge Earned: ${badge.name}`,
            content: `Congratulations! You've earned the "${badge.name}" badge!`,
            data: {
              badgeId: badge._id,
              points: badge.reward.points
            }
          });

          totalAwarded++;
        }
      }
    }

    res.json({
      message: `Badge eligibility check completed. ${totalAwarded} badges awarded.`,
      totalAwarded
    });
  } catch (error) {
    console.error('Error checking badge eligibility:', error);
    res.status(500).json({
      message: 'Server error checking badge eligibility',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
