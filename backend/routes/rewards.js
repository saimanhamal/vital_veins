const express = require('express');
const router = express.Router();
const Reward = require('../models/Reward');
const Donor = require('../models/Donor');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticate, authorize } = require('../middleware/auth');
const { validatePagination, validateObjectId } = require('../middleware/validation');

/**
 * @route   POST /api/admin/rewards
 * @desc    Create a new reward
 * @access  Private (Admin only)
 */
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const {
      title,
      description,
      rewardType,
      pointsCost,
      category,
      imageUrl,
      stock,
      usageLimit,
      expiryDate,
      terms
    } = req.body;

    // Validation
    if (!title || !rewardType || !pointsCost) {
      return res.status(400).json({
        message: 'Missing required fields: title, rewardType, pointsCost'
      });
    }

    if (!['points_only', 'badge', 'certificate', 'merchandise', 'discount'].includes(rewardType)) {
      return res.status(400).json({
        message: 'Invalid rewardType. Must be: points_only, badge, certificate, merchandise, or discount'
      });
    }

    const reward = new Reward({
      title,
      description,
      rewardType,
      pointsCost,
      category: category || 'other',
      imageUrl,
      stock: stock || null, // null = unlimited
      usageLimit: usageLimit || 1,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      terms,
      createdBy: req.user._id,
      isActive: true
    });

    await reward.save();

    res.status(201).json({
      message: 'Reward created successfully',
      reward: {
        _id: reward._id,
        title: reward.title,
        rewardType: reward.rewardType,
        pointsCost: reward.pointsCost,
        stock: reward.stock
      }
    });
  } catch (error) {
    console.error('Error creating reward:', error);
    res.status(500).json({
      message: 'Server error creating reward',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/donor/rewards  OR  GET /api/admin/rewards
 * @desc    Get available rewards for donor OR all rewards for admin
 * @access  Private (Donor or Admin)
 */
router.get('/', authenticate, authorize('donor', 'admin'), validatePagination, async (req, res) => {
  try {
    // Admin gets all rewards with stats
    if (req.user.role === 'admin') {
      const { page = 1, limit = 20, category, rewardType, isActive } = req.query;

      const filter = {};
      if (category) filter.category = category;
      if (rewardType) filter.rewardType = rewardType;
      if (isActive !== undefined) filter.isActive = isActive === 'true';

      const rewards = await Reward.find(filter)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 })
        .select('_id title rewardType pointsCost stock isActive redemptionHistory createdAt');

      const total = await Reward.countDocuments(filter);

      const enrichedRewards = rewards.map(reward => ({
        _id: reward._id,
        title: reward.title,
        rewardType: reward.rewardType,
        pointsCost: reward.pointsCost,
        stock: reward.stock,
        isActive: reward.isActive,
        redemptions: reward.redemptionHistory.length,
        createdAt: reward.createdAt
      }));

      return res.json({
        rewards: enrichedRewards,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      });
    }

    // Donor gets available rewards personalized for them
    const { page = 1, limit = 20, category, minPoints, maxPoints, sortBy = '-pointsCost' } = req.query;

    const donor = await Donor.findOne({ user: req.user._id });
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    const filter = {
      isActive: true,
      $or: [
        { expiryDate: null },
        { expiryDate: { $gt: new Date() } }
      ]
    };

    if (category) filter.category = category;
    if (minPoints || maxPoints) {
      filter.pointsCost = {};
      if (minPoints) filter.pointsCost.$gte = parseInt(minPoints);
      if (maxPoints) filter.pointsCost.$lte = parseInt(maxPoints);
    }

    const rewards = await Reward.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortBy)
      .select('_id title description rewardType pointsCost category imageUrl stock expiryDate');

    const total = await Reward.countDocuments(filter);

    // Enhance with affordability
    const enrichedRewards = rewards.map(reward => ({
      _id: reward._id,
      title: reward.title,
      description: reward.description,
      rewardType: reward.rewardType,
      pointsCost: reward.pointsCost,
      category: reward.category,
      imageUrl: reward.imageUrl,
      availability: {
        inStock: reward.stock === null || reward.stock > 0,
        stockRemaining: reward.stock,
        expiryDate: reward.expiryDate
      },
      canAfford: donor.donationPoints.current >= reward.pointsCost,
      donorCurrentPoints: donor.donationPoints.current
    }));

    res.json({
      rewards: enrichedRewards,
      donorPoints: {
        current: donor.donationPoints.current,
        total: donor.donationPoints.total,
        lifetime: donor.donationPoints.lifetime
      },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    res.status(500).json({
      message: 'Server error fetching rewards',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/donor/rewards/:rewardId/redeem
 * @desc    Redeem a reward
 * @access  Private (Donor only)
 */
router.post('/:rewardId/redeem', authenticate, authorize('donor'), validateObjectId('rewardId'), async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.rewardId);
    
    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }

    if (!reward.isActive) {
      return res.status(400).json({ message: 'This reward is no longer available' });
    }

    const donor = await Donor.findOne({ user: req.user._id });
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    // Check if reward is available
    if (!reward.isAvailable()) {
      return res.status(400).json({ message: 'This reward is not available (expired or out of stock)' });
    }

    // Check points
    if (donor.donationPoints.current < reward.pointsCost) {
      return res.status(400).json({
        message: 'Insufficient points',
        required: reward.pointsCost,
        current: donor.donationPoints.current,
        shortfall: reward.pointsCost - donor.donationPoints.current
      });
    }

    // Check usage limit
    const usageCount = reward.redemptionHistory.filter(
      r => r.donorId.toString() === donor._id.toString()
    ).length;

    if (usageCount >= reward.usageLimit) {
      return res.status(400).json({
        message: `You have reached the usage limit for this reward (${reward.usageLimit} time${reward.usageLimit > 1 ? 's' : ''})`
      });
    }

    // Deduct points
    donor.donationPoints.current -= reward.pointsCost;
    await donor.save();

    // Record redemption
    reward.redemptionHistory.push({
      donorId: donor._id,
      donorEmail: req.user.email,
      redemptionDate: new Date(),
      status: 'pending',
      expiryDate: reward.expiryDate
    });

    // Update stock
    if (reward.stock !== null) {
      reward.stock -= 1;
    }

    await reward.save();

    // Create notification
    await Notification.createNotification({
      recipients: [{ user: req.user._id, role: 'donor' }],
      type: 'reward_redeemed',
      title: 'Reward Redeemed!',
      content: `You have successfully redeemed "${reward.title}". Your points have been deducted.`,
      data: { rewardId: reward._id, pointsDeducted: reward.pointsCost }
    });

    res.json({
      message: 'Reward redeemed successfully',
      redemption: {
        rewardId: reward._id,
        rewardTitle: reward.title,
        pointsDeducted: reward.pointsCost,
        remainingPoints: donor.donationPoints.current,
        redemptionDate: new Date(),
        status: 'pending',
        deliveryExpectation: 'You will receive your reward within 5-7 business days'
      }
    });
  } catch (error) {
    console.error('Error redeeming reward:', error);
    res.status(500).json({
      message: 'Server error redeeming reward',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/donor/rewards/history
 * @desc    Get donor's reward redemption history
 * @access  Private (Donor only)
 */
router.get('/history', authenticate, authorize('donor'), async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user._id });
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    // Find all rewards where this donor has redemptions
    const rewards = await Reward.find(
      { 'redemptionHistory.donorId': donor._id }
    ).select('_id title rewardType pointsCost redemptionHistory imageUrl');

    // Extract and format redemptions
    const redemptions = [];
    
    rewards.forEach(reward => {
      reward.redemptionHistory
        .filter(r => r.donorId.toString() === donor._id.toString())
        .forEach(redemption => {
          redemptions.push({
            rewardId: reward._id,
            rewardTitle: reward.title,
            rewardType: reward.rewardType,
            pointsUsed: reward.pointsCost,
            imageUrl: reward.imageUrl,
            redemptionDate: redemption.redemptionDate,
            status: redemption.status,
            expiryDate: redemption.expiryDate,
            notes: redemption.notes
          });
        });
    });

    // Sort by date descending
    redemptions.sort((a, b) => new Date(b.redemptionDate) - new Date(a.redemptionDate));

    // Count by status
    const statusCounts = {
      pending: redemptions.filter(r => r.status === 'pending').length,
      processed: redemptions.filter(r => r.status === 'processed').length,
      shipped: redemptions.filter(r => r.status === 'shipped').length,
      delivered: redemptions.filter(r => r.status === 'delivered').length
    };

    res.json({
      redemptions,
      statistics: {
        totalRedemptions: redemptions.length,
        statusCounts,
        totalPointsUsed: redemptions.reduce((sum, r) => sum + r.pointsUsed, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching reward history:', error);
    res.status(500).json({
      message: 'Server error fetching reward history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/admin/rewards (handled by consolidated route above)
 * @desc    REMOVED - Consolidated with main GET / route
 * @access  Private (Admin only)
 */

/**
 * @route   PUT /api/admin/rewards/:rewardId
 * @desc    Update reward
 * @access  Private (Admin only)
 */
router.put('/:rewardId', authenticate, authorize('admin'), validateObjectId('rewardId'), async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.rewardId);
    
    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }

    const { title, description, pointsCost, stock, isActive, expiryDate } = req.body;

    if (title) reward.title = title;
    if (description) reward.description = description;
    if (pointsCost) reward.pointsCost = pointsCost;
    if (stock !== undefined) reward.stock = stock;
    if (isActive !== undefined) reward.isActive = isActive;
    if (expiryDate) reward.expiryDate = new Date(expiryDate);

    await reward.save();

    res.json({
      message: 'Reward updated successfully',
      reward: {
        _id: reward._id,
        title: reward.title,
        pointsCost: reward.pointsCost,
        stock: reward.stock,
        isActive: reward.isActive
      }
    });
  } catch (error) {
    console.error('Error updating reward:', error);
    res.status(500).json({
      message: 'Server error updating reward',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   DELETE /api/admin/rewards/:rewardId
 * @desc    Delete reward
 * @access  Private (Admin only)
 */
router.delete('/:rewardId', authenticate, authorize('admin'), validateObjectId('rewardId'), async (req, res) => {
  try {
    const reward = await Reward.findByIdAndDelete(req.params.rewardId);
    
    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }

    res.json({
      message: 'Reward deleted successfully',
      rewardId: reward._id
    });
  } catch (error) {
    console.error('Error deleting reward:', error);
    res.status(500).json({
      message: 'Server error deleting reward',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/admin/rewards/:rewardId/redemption/:redemptionIndex
 * @desc    Update redemption status (admin fulfillment)
 * @access  Private (Admin only)
 */
router.put('/:rewardId/redemption/:redemptionIndex', authenticate, authorize('admin'), validateObjectId('rewardId'), async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!['pending', 'processed', 'shipped', 'delivered'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Must be: pending, processed, shipped, or delivered'
      });
    }

    const reward = await Reward.findById(req.params.rewardId);
    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }

    const redemptionIndex = parseInt(req.params.redemptionIndex);
    if (redemptionIndex < 0 || redemptionIndex >= reward.redemptionHistory.length) {
      return res.status(400).json({ message: 'Invalid redemption index' });
    }

    const redemption = reward.redemptionHistory[redemptionIndex];
    redemption.status = status;
    if (notes) redemption.notes = notes;
    if (status === 'delivered') redemption.deliveredAt = new Date();

    await reward.save();

    // Notify donor
    const donor = await Donor.findById(redemption.donorId).populate('user', '_id');
    if (donor) {
      const statusMessages = {
        processed: 'Your reward has been processed and will be shipped soon',
        shipped: 'Your reward is on its way!',
        delivered: 'Your reward has been delivered'
      };

      if (statusMessages[status]) {
        await Notification.createNotification({
          recipients: [{ user: donor.user._id, role: 'donor' }],
          type: 'reward_status_update',
          title: `Reward ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          content: statusMessages[status],
          data: { rewardId: reward._id, status }
        });
      }
    }

    res.json({
      message: 'Redemption status updated',
      redemption: {
        status: redemption.status,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error updating redemption:', error);
    res.status(500).json({
      message: 'Server error updating redemption',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/admin/rewards/dashboard
 * @desc    Get rewards dashboard stats
 * @access  Private (Admin only)
 */
router.get('/dashboard', authenticate, authorize('admin'), async (req, res) => {
  try {
    const lastThirtyDays = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const stats = await Reward.aggregate([
      {
        $facet: {
          totalRewards: [{ $count: 'count' }],
          activeRewards: [{ $match: { isActive: true } }, { $count: 'count' }],
          totalRedemptions: [
            { $project: { count: { $size: '$redemptionHistory' } } },
            { $group: { _id: null, total: { $sum: '$count' } } }
          ],
          recentRedemptions: [
            { $unwind: '$redemptionHistory' },
            { $match: { 'redemptionHistory.redemptionDate': { $gte: lastThirtyDays } } },
            { $count: 'count' }
          ],
          byType: [
            { $group: { _id: '$rewardType', count: { $sum: 1 } } }
          ]
        }
      }
    ]);

    const totalPoints = await Reward.aggregate([
      { $unwind: '$redemptionHistory' },
      {
        $lookup: {
          from: 'donors',
          let: { donorId: '$redemptionHistory.donorId' },
          pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$donorId'] } } }],
          as: 'donor'
        }
      },
      {
        $group: {
          _id: null,
          totalPointsRedeemed: { $sum: '$pointsCost' }
        }
      }
    ]);

    res.json({
      summary: {
        totalRewards: stats[0].totalRewards[0]?.count || 0,
        activeRewards: stats[0].activeRewards[0]?.count || 0,
        totalRedemptions: stats[0].totalRedemptions[0]?.total || 0,
        recentRedemptions30Days: stats[0].recentRedemptions[0]?.count || 0,
        totalPointsRedeemed: totalPoints[0]?.totalPointsRedeemed || 0
      },
      byType: stats[0].byType
    });
  } catch (error) {
    console.error('Error fetching rewards dashboard:', error);
    res.status(500).json({
      message: 'Server error fetching dashboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
