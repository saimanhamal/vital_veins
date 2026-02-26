import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from 'react-query';
import { 
  History, 
  Calendar, 
  Heart, 
  Droplets, 
  Award, 
  Target, 
  TrendingUp,
  Clock,
  MapPin,
  Building2,
  Star,
  Filter,
  Search,
  Download,
  Trophy,
  Medal,
  Zap,
  CheckCircle,
  AlertTriangle,
  Activity,
  BarChart3,
  PieChart
} from 'lucide-react';
import { donorAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import StatsCard from '../../components/UI/StatsCard';
import { formatDateTime, getStatusClasses } from '../../utils/helpers';
import toast from 'react-hot-toast';

const DonorHistory = () => {
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'all',
    dateRange: 'all'
  });
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch donation history
  const { data: historyData, isLoading, error } = useQuery(
    ['donor-history', filters],
    () => donorAPI.getDonationHistory({
      search: filters.search || undefined,
      type: filters.type !== 'all' ? filters.type : undefined,
      status: filters.status !== 'all' ? filters.status : undefined,
      dateRange: filters.dateRange !== 'all' ? filters.dateRange : undefined
    }).then(res => res.data),
    {
      refetchInterval: 30000,
    }
  );

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const openDetailModal = (donation) => {
    setSelectedDonation(donation);
    setShowDetailModal(true);
  };

  const getTypeIcon = (type, bloodType, organType) => {
    if (type === 'blood') {
      return <Droplets className="w-5 h-5 text-red-500" />;
    }
    return <Heart className="w-5 h-5 text-purple-500" />;
  };

  const getAchievementIcon = (achievement) => {
    switch (achievement.type) {
      case 'milestone': return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'streak': return <Zap className="w-5 h-5 text-blue-500" />;
      case 'special': return <Medal className="w-5 h-5 text-purple-500" />;
      default: return <Award className="w-5 h-5 text-green-500" />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    return 'Today';
  };

  const filteredDonations = historyData?.donations?.filter(donation => {
    const matchesSearch = !filters.search || 
      donation.appointmentId?.toLowerCase().includes(filters.search.toLowerCase()) ||
      donation.hospital?.hospitalName?.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesSearch;
  }) || [];

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading History</h3>
        <p className="text-gray-600">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Donation History</h1>
        <p className="text-gray-600">Track your donation journey, achievements, and impact on saving lives.</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total Donations"
          value={historyData?.stats?.totalDonations || 0}
          icon={Heart}
          color="red"
        />
        <StatsCard
          title="Blood Donations"
          value={historyData?.stats?.bloodDonations || 0}
          icon={Droplets}
          color="red"
        />
        <StatsCard
          title="Organ Donations"
          value={historyData?.stats?.organDonations || 0}
          icon={Heart}
          color="purple"
        />
        <StatsCard
          title="Lives Impacted"
          value={historyData?.stats?.livesImpacted || 0}
          icon={Target}
          color="green"
        />
      </div>

      {/* Achievements Section */}
      {historyData?.achievements && historyData.achievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-gray-900">Achievements</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {historyData.achievements.map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4"
              >
                <div className="flex items-center space-x-3 mb-2">
                  {getAchievementIcon(achievement)}
                  <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {achievement.earnedAt ? formatDate(achievement.earnedAt) : 'Not earned yet'}
                  </span>
                  {achievement.earned && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="card p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search donations, hospitals..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          {/* Type Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="blood">Blood</option>
            <option value="organ">Organ</option>
          </select>

          {/* Status Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>

          {/* Date Range Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="this_year">This Year</option>
            <option value="last_year">Last Year</option>
            <option value="last_6_months">Last 6 Months</option>
            <option value="last_3_months">Last 3 Months</option>
          </select>
        </div>
      </motion.div>

      {/* Donation History List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="space-y-4"
      >
        {filteredDonations.length === 0 ? (
          <div className="card p-8 text-center">
            <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Donation History</h3>
            <p className="text-gray-600 mb-4">You haven't made any donations yet or none match your filters.</p>
            <button className="btn-primary flex items-center space-x-2 mx-auto">
              <Heart className="w-4 h-4" />
              <span>Start Your Donation Journey</span>
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {filteredDonations.map((donation) => (
              <motion.div
                key={donation._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => openDetailModal(donation)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      {getTypeIcon(donation.type, donation.bloodType, donation.organType)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {donation.type === 'blood' ? donation.bloodType : donation.organType} Donation
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(donation.status, 'appointment')}`}>
                          {donation.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">#{donation.appointmentId}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4" />
                          <span className="truncate">{donation.hospital?.hospitalName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(donation.scheduledDate)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{calculateTimeAgo(donation.scheduledDate)}</span>
                        </div>
                      </div>

                      {donation.feedback?.hospital && (
                        <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                          <div className="flex items-start space-x-2">
                            <Star className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 mb-1">
                                Building2 Rating: {donation.feedback.hospital.rating}/5
                              </p>
                              {donation.feedback.hospital.comment && (
                                <p className="text-xs text-gray-600">{donation.feedback.hospital.comment}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {donation.notes?.hospital && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <Activity className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 mb-1">Building2 Notes</p>
                              <p className="text-xs text-gray-600">{donation.notes.hospital}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <span className="text-sm text-gray-500">
                      {donation.duration || 60} min
                    </span>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Donation Detail Modal */}
      {selectedDonation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDetailModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Donation Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <AlertTriangle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Donation Header */}
                <div className="flex items-start space-x-4">
                  {getTypeIcon(selectedDonation.type, selectedDonation.bloodType, selectedDonation.organType)}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {selectedDonation.type === 'blood' ? selectedDonation.bloodType : selectedDonation.organType} Donation
                    </h3>
                    <p className="text-gray-600">#{selectedDonation.appointmentId}</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${getStatusClasses(selectedDonation.status, 'appointment')}`}>
                      {selectedDonation.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Building2 Information */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Building2 Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <Building2 className="w-5 h-5 text-gray-500" />
                      <span className="font-medium">{selectedDonation.hospital?.hospitalName}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedDonation.hospital?.address?.city}, {selectedDonation.hospital?.address?.state}</span>
                    </div>
                  </div>
                </div>

                {/* Schedule Information */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Schedule</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="font-medium">Date</div>
                        <div className="text-sm text-gray-600">{formatDate(selectedDonation.scheduledDate)}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="font-medium">Duration</div>
                        <div className="text-sm text-gray-600">{selectedDonation.duration || 60} minutes</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feedback */}
                {selectedDonation.feedback?.hospital && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Building2 Feedback</h4>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <span className="font-medium">Rating: {selectedDonation.feedback.hospital.rating}/5</span>
                      </div>
                      {selectedDonation.feedback.hospital.comment && (
                        <p className="text-sm text-gray-700">{selectedDonation.feedback.hospital.comment}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedDonation.notes?.hospital && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Building2 Notes</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700">{selectedDonation.notes.hospital}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default DonorHistory;
