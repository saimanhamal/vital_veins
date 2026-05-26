import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  AlertTriangle,
  Search,
  Filter,
  Gift,
  BarChart3,
  Package,
  Medal,
  Trophy,
  Zap,
  Coins,
  CheckCircle,
  Clock,
  X,
  Download,
  TrendingUp
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminRewards = () => {
  const [filters, setFilters] = useState({
    search: '',
    type: 'all'
  });
  const [activeTab, setActiveTab] = useState('manage');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [selectedReward, setSelectedReward] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    rewardType: 'points_only',
    pointsCost: 0,
    category: 'other',
    imageUrl: '',
    stock: null,
    usageLimit: null,
    expiryDate: '',
    terms: ''
  });
  const queryClient = useQueryClient();

  // Fetch rewards
  const { data: rewardsData, isLoading } = useQuery(
    ['admin-rewards', filters],
    () => adminAPI.getRewards({
      search: filters.search || undefined,
      type: filters.type !== 'all' ? filters.type : undefined
    }).then(res => res.data),
    { refetchInterval: 30000 }
  );

  // Fetch rewards dashboard
  const { data: dashboardData } = useQuery(
    'admin-rewards-dashboard',
    () => adminAPI.getRewardsDashboard().then(res => res.data),
    { refetchInterval: 60000 }
  );

  // Create/Update reward mutation
  const saveMutation = useMutation(
    (data) => {
      if (editingReward) {
        return adminAPI.updateReward(editingReward._id, data);
      } else {
        return adminAPI.createReward(data);
      }
    },
    {
      onSuccess: () => {
        toast.success(editingReward ? 'Reward updated!' : 'Reward created!');
        setShowCreateModal(false);
        resetForm();
        queryClient.invalidateQueries('admin-rewards');
        queryClient.invalidateQueries('admin-rewards-dashboard');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to save reward');
      }
    }
  );

  // Delete reward mutation
  const deleteMutation = useMutation(
    (id) => adminAPI.deleteReward(id),
    {
      onSuccess: () => {
        toast.success('Reward deleted!');
        setShowDeleteModal(false);
        queryClient.invalidateQueries('admin-rewards');
        queryClient.invalidateQueries('admin-rewards-dashboard');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete reward');
      }
    }
  );

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      rewardType: 'points_only',
      pointsCost: 0,
      category: 'other',
      imageUrl: '',
      stock: null,
      usageLimit: null,
      expiryDate: '',
      terms: ''
    });
    setEditingReward(null);
  };

  const handleOpenCreate = (reward = null) => {
    if (reward) {
      setEditingReward(reward);
      setFormData({
        title: reward.title,
        description: reward.description || '',
        rewardType: reward.rewardType,
        pointsCost: reward.pointsCost,
        category: reward.category || 'other',
        imageUrl: reward.imageUrl || '',
        stock: reward.stock,
        usageLimit: reward.usageLimit,
        expiryDate: reward.expiryDate ? new Date(reward.expiryDate).toISOString().split('T')[0] : '',
        terms: reward.terms || ''
      });
    } else {
      resetForm();
    }
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.pointsCost) {
      toast.error('Please fill in all required fields');
      return;
    }

    const submitData = {
      ...formData,
      pointsCost: parseInt(formData.pointsCost),
      stock: formData.stock ? parseInt(formData.stock) : null,
      usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
    };

    await saveMutation.mutateAsync(submitData);
  };

  const handleDelete = async (rewardId) => {
    await deleteMutation.mutateAsync(rewardId);
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

  const rewards = rewardsData?.rewards || [];
  const dashboard = dashboardData || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading rewards..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Gift className="w-10 h-10 text-red-500" />
              Reward Management
            </h1>
            <p className="text-gray-600">Create and manage rewards for donors</p>
          </div>
          <button
            onClick={() => handleOpenCreate()}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Reward
          </button>
        </div>

        {/* Dashboard Stats */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Rewards</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{dashboard.totalRewards || 0}</p>
              </div>
              <Gift className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Redemptions</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{dashboard.totalRedemptions || 0}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Points Distributed</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {(dashboard.totalPointsDistributed || 0).toLocaleString()}
                </p>
              </div>
              <Coins className="w-12 h-12 text-yellow-500 opacity-20" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending Fulfillment</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{dashboard.pendingRedemptions || 0}</p>
              </div>
              <Clock className="w-12 h-12 text-orange-500 opacity-20" />
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'manage'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Manage Rewards
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="inline-block mr-2 w-5 h-5" />
            Analytics
          </button>
        </div>

        {/* Manage Rewards Tab */}
        {activeTab === 'manage' && (
          <div>
            {/* Search and Filters */}
            <div className="mb-8 flex gap-4">
              <div className="flex-1">
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

              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="points_only">Points</option>
                <option value="badge">Badge</option>
                <option value="certificate">Certificate</option>
                <option value="merchandise">Merchandise</option>
                <option value="discount">Discount</option>
              </select>
            </div>

            {/* Rewards Table */}
            {rewards.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No rewards created yet</h3>
                <p className="text-gray-600 mb-4">Start by creating your first reward</p>
                <button
                  onClick={() => handleOpenCreate()}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold"
                >
                  Create Reward
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Reward
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Points
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Redemptions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {rewards.map((reward) => (
                      <tr key={reward._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {getRewardIcon(reward.rewardType)}
                            <div>
                              <p className="font-medium text-gray-900">{reward.title}</p>
                              <p className="text-xs text-gray-600">{reward.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {reward.rewardType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Coins className="w-4 h-4 text-yellow-500" />
                            <span className="font-semibold">{reward.pointsCost}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {reward.stock ? (
                            <span className="text-sm font-medium text-gray-900">{reward.stock}</span>
                          ) : (
                            <span className="text-sm text-gray-500">Unlimited</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">
                            {reward.redemptions?.length || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedReward(reward);
                                setShowDetailModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="View details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleOpenCreate(reward)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedReward(reward);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Rewards Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Reward Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(dashboard.rewardsByType || {}).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-gray-700">{type}</span>
                      <span className="font-bold text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Top Rewards</h3>
                <div className="space-y-3">
                  {(dashboard.topRewards || []).slice(0, 5).map((reward, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-gray-700 truncate">{reward.title}</span>
                      <span className="font-bold text-gray-900">{reward.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Key Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-gray-600 text-sm mb-1">Avg Points per Redemption</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboard.avgPointsPerRedemption ? Math.round(dashboard.avgPointsPerRedemption) : 0}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-gray-600 text-sm mb-1">Redemption Rate</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboard.redemptionRate ? dashboard.redemptionRate.toFixed(1) : 0}%
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-gray-600 text-sm mb-1">Active Donors</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboard.activeDonors || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingReward ? 'Edit Reward' : 'Create New Reward'}
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Reward title"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type *
                      </label>
                      <select
                        value={formData.rewardType}
                        onChange={(e) => setFormData({ ...formData, rewardType: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="points_only">Points Only</option>
                        <option value="badge">Badge</option>
                        <option value="certificate">Certificate</option>
                        <option value="merchandise">Merchandise</option>
                        <option value="discount">Discount</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the reward"
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Points Cost *
                      </label>
                      <input
                        type="number"
                        value={formData.pointsCost}
                        onChange={(e) => setFormData({ ...formData, pointsCost: e.target.value })}
                        placeholder="0"
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stock (leave empty for unlimited)
                      </label>
                      <input
                        type="number"
                        value={formData.stock || ''}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder="0"
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="other"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image URL
                      </label>
                      <input
                        type="url"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Terms & Conditions
                    </label>
                    <textarea
                      value={formData.terms}
                      onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                      placeholder="Add any terms and conditions"
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    disabled={saveMutation.isLoading}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-semibold disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saveMutation.isLoading}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold disabled:opacity-50"
                  >
                    {saveMutation.isLoading ? 'Saving...' : editingReward ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedReward.title}
                  </h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 text-gray-700">
                  {selectedReward.description && (
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Description</p>
                      <p>{selectedReward.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Type</p>
                    <p>{selectedReward.rewardType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Points Cost</p>
                    <p>{selectedReward.pointsCost}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Stock</p>
                    <p>{selectedReward.stock || 'Unlimited'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Redemptions</p>
                    <p>{selectedReward.redemptions?.length || 0}</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowDetailModal(false)}
                  className="mt-6 w-full px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDeleteModal(false)}
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
                  <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-red-100 mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Delete Reward?</h2>
                  <p className="text-gray-600 mt-2">
                    Are you sure you want to delete "{selectedReward.title}"?
                  </p>
                  <p className="text-sm text-red-600 mt-3">This action cannot be undone.</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleteMutation.isLoading}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-semibold disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(selectedReward._id)}
                    disabled={deleteMutation.isLoading}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold disabled:opacity-50"
                  >
                    {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
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

export default AdminRewards;
