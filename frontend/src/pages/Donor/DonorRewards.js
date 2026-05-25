import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Gift,
  Star,
  Heart,
  Trophy,
  Zap,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle,
  Clock,
  ShoppingBag,
  Medal,
  Coins,
  TrendingUp,
  Package,
  X,
  Download,
  History
} from 'lucide-react';
import { donorAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import StatsCard from '../../components/UI/StatsCard';
import toast from 'react-hot-toast';

const DonorRewards = () => {
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    type: 'all'
  });
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedReward, setSelectedReward] = useState(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch available rewards
  const { data: rewardsData, isLoading, error } = useQuery(
    ['donor-rewards', filters],
    () => donorAPI.getRewards({
      search: filters.search || undefined,
      category: filters.category !== 'all' ? filters.category : undefined,
      type: filters.type !== 'all' ? filters.type : undefined
    }).then(res => res.data),
    { refetchInterval: 30000 }
  );

  // Fetch reward history
  const { data: historyData, isLoading: historyLoading } = useQuery(
    'donor-reward-history',
    () => donorAPI.getRewardHistory({ limit: 50 }).then(res => res.data),
    { refetchInterval: 30000 }
  );

  // Fetch donor profile for points
  const { data: profileData } = useQuery(
    'donor-profile-rewards',
    () => donorAPI.getProfile().then(res => res.data),
    { refetchInterval: 30000 }
  );

  // Redeem reward mutation
  const redeemMutation = useMutation(
    ({ rewardId, data }) => donorAPI.redeemReward(rewardId, data),
    {
      onSuccess: (res) => {
        toast.success('Reward redeemed successfully!');
        setShowRedeemModal(false);
        setShowDetailModal(false);
        setSelectedReward(null);
        queryClient.invalidateQueries('donor-rewards');
        queryClient.invalidateQueries('donor-reward-history');
        queryClient.invalidateQueries('donor-profile-rewards');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to redeem reward');
      }
    }
  );

  const handleRedeem = async (rewardId) => {
    try {
      await redeemMutation.mutateAsync({ rewardId, data: {} });
    } catch (err) {
      console.error('Redemption error:', err);
    }
  };

  const getRewardIcon = (type) => {
    switch (type) {
      case 'badge':
        return <Medal className="w-6 h-6 text-yellow-500" />;
      case 'certificate':
        return <Trophy className="w-6 h-6 text-blue-500" />;
      case 'merchandise':
        return <Package className="w-6 h-6 text-purple-500" />;
      case 'discount':
        return <Zap className="w-6 h-6 text-orange-500" />;
      default:
        return <Coins className="w-6 h-6 text-green-500" />;
    }
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'badge':
        return 'bg-yellow-100 text-yellow-800';
      case 'certificate':
        return 'bg-blue-100 text-blue-800';
      case 'merchandise':
        return 'bg-purple-100 text-purple-800';
      case 'discount':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const rewards = rewardsData?.rewards || [];
  const totalPoints = profileData?.rewardPoints || 0;
  const history = historyData?.history || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading rewards..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Rewards</h3>
        <p className="text-gray-600">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Gift className="w-10 h-10 text-red-500" />
            Rewards & Incentives
          </h1>
          <p className="text-gray-600">
            Earn points with every donation and redeem them for amazing rewards!
          </p>
        </div>

        {/* Points Card */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white col-span-1 md:col-span-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 mb-2">Your Reward Points</p>
                <h2 className="text-5xl font-bold">{totalPoints.toLocaleString()}</h2>
                <p className="text-red-100 mt-2">Keep donating to earn more points!</p>
              </div>
              <Coins className="w-20 h-20 text-red-200 opacity-50" />
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'browse'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Gift className="inline-block mr-2 w-5 h-5" />
            Browse Rewards
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'history'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <History className="inline-block mr-2 w-5 h-5" />
            Redemption History
          </button>
        </div>

        {/* Browse Rewards Tab */}
        {activeTab === 'browse' && (
          <div>
            {/* Search and Filters */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search rewards..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="health">Health</option>
                  <option value="wellness">Wellness</option>
                  <option value="merchandise">Merchandise</option>
                  <option value="experience">Experience</option>
                </select>
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="points_only">Points</option>
                  <option value="badge">Badge</option>
                  <option value="certificate">Certificate</option>
                  <option value="merchandise">Merchandise</option>
                  <option value="discount">Discount</option>
                </select>
              </div>
            </div>

            {/* Rewards Grid */}
            {rewards.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No rewards available</h3>
                <p className="text-gray-600">Check back soon for new rewards!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {rewards.map((reward, idx) => (
                    <motion.div
                      key={reward._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                    >
                      <div className="relative h-40 bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                        {reward.imageUrl && (
                          <img
                            src={reward.imageUrl}
                            alt={reward.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                        {!reward.imageUrl && getRewardIcon(reward.rewardType)}
                        <div className="absolute top-3 right-3">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getTypeBadgeColor(reward.rewardType)}`}>
                            {reward.rewardType}
                          </span>
                        </div>
                      </div>

                      <div className="p-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {reward.title}
                        </h3>
                        {reward.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {reward.description}
                          </p>
                        )}

                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Coins className="w-5 h-5 text-yellow-500" />
                            <span className="font-bold text-lg text-gray-900">
                              {reward.pointsCost}
                            </span>
                            <span className="text-xs text-gray-500">points</span>
                          </div>
                          {reward.stock !== null && (
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              {reward.stock} left
                            </span>
                          )}
                        </div>

                        {reward.expiryDate && (
                          <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-4 h-4" />
                            Expires: {new Date(reward.expiryDate).toLocaleDateString()}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedReward(reward);
                              setShowDetailModal(true);
                            }}
                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => {
                              if (totalPoints < reward.pointsCost) {
                                toast.error('Not enough points to redeem this reward');
                              } else {
                                setSelectedReward(reward);
                                setShowRedeemModal(true);
                              }
                            }}
                            disabled={totalPoints < reward.pointsCost || (reward.stock !== null && reward.stock <= 0) || redeemMutation.isLoading}
                            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold"
                          >
                            {redeemMutation.isLoading ? 'Redeeming...' : 'Redeem'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* Redemption History Tab */}
        {activeTab === 'history' && (
          <div>
            {historyLoading ? (
              <LoadingSpinner size="lg" text="Loading history..." />
            ) : history.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No redemptions yet</h3>
                <p className="text-gray-600">Your redeemed rewards will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white p-4 rounded-lg shadow border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">
                          {getRewardIcon(item.rewardType)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{item.title}</h3>
                          <p className="text-sm text-gray-600">
                            Redeemed {new Date(item.redeemedDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-900">
                          -{item.pointsCost} pts
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          {item.status === 'delivered' && (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-xs font-semibold text-green-600">Delivered</span>
                            </>
                          )}
                          {item.status === 'pending' && (
                            <>
                              <Clock className="w-4 h-4 text-yellow-500" />
                              <span className="text-xs font-semibold text-yellow-600">Pending</span>
                            </>
                          )}
                          {item.status === 'shipped' && (
                            <>
                              <Package className="w-4 h-4 text-blue-500" />
                              <span className="text-xs font-semibold text-blue-600">Shipped</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl max-w-md w-full"
            >
              <div className="relative h-48 bg-gradient-to-br from-red-500 to-red-600">
                {selectedReward.imageUrl && (
                  <img
                    src={selectedReward.imageUrl}
                    alt={selectedReward.title}
                    className="w-full h-full object-cover"
                  />
                )}
                {!selectedReward.imageUrl && (
                  <div className="flex items-center justify-center h-full">
                    {getRewardIcon(selectedReward.rewardType)}
                  </div>
                )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedReward.title}
                </h2>
                <p className="text-gray-600 mb-4">
                  {selectedReward.description}
                </p>

                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-700 font-semibold">Points Cost</span>
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-yellow-500" />
                      <span className="text-2xl font-bold">{selectedReward.pointsCost}</span>
                    </div>
                  </div>
                  {selectedReward.stock && (
                    <p className="text-sm text-gray-600">Stock: {selectedReward.stock} available</p>
                  )}
                </div>

                {selectedReward.terms && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Terms & Conditions</h4>
                    <p className="text-sm text-gray-600">{selectedReward.terms}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-semibold"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      if (totalPoints < selectedReward.pointsCost) {
                        toast.error('Not enough points to redeem this reward');
                      } else {
                        handleRedeem(selectedReward._id);
                      }
                    }}
                    disabled={totalPoints < selectedReward.pointsCost || redeemMutation.isLoading}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {redeemMutation.isLoading ? 'Redeeming...' : 'Redeem Now'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Redeem Confirmation Modal */}
      <AnimatePresence>
        {showRedeemModal && selectedReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowRedeemModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl max-w-md w-full"
            >
              <div className="p-6">
                <div className="text-center mb-6">
                  {getRewardIcon(selectedReward.rewardType)}
                  <h2 className="text-2xl font-bold text-gray-900 mt-4">
                    Confirm Redemption
                  </h2>
                  <p className="text-gray-600 mt-2">
                    Are you sure you want to redeem this reward?
                  </p>
                </div>

                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-gray-900">{selectedReward.title}</span>
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-yellow-500" />
                      <span className="font-bold text-gray-900">
                        {selectedReward.pointsCost}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between mb-1">
                      <span>Points After Redemption:</span>
                      <span className="font-semibold">
                        {(totalPoints - selectedReward.pointsCost).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRedeemModal(false)}
                    disabled={redeemMutation.isLoading}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-semibold disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRedeem(selectedReward._id)}
                    disabled={redeemMutation.isLoading}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 font-semibold"
                  >
                    {redeemMutation.isLoading ? 'Redeeming...' : 'Confirm'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DonorRewards;
