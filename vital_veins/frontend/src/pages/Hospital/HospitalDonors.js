import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  Mail, 
  Phone, 
  Calendar,
  Heart,
  Droplets,
  AlertTriangle,
  CheckCircle,
  User,
  Clock,
  Star,
  TrendingUp,
  Activity,
  MapPin,
  Award,
  Target
} from 'lucide-react';
import { hospitalAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import DataTable from '../../components/UI/DataTable';
import Modal from '../../components/UI/Modal';
import StatsCard from '../../components/UI/StatsCard';
import { formatDateTime, getStatusClasses } from '../../utils/helpers';

const HospitalDonors = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch hospital donors data
  const { data: donorsData, isLoading, error } = useQuery(
    ['hospital-donors', currentPage, searchTerm, statusFilter],
    () => hospitalAPI.getDonors({ 
      page: currentPage,
      limit: 10,
      search: searchTerm || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined
    }).then(res => res.data),
    {
      keepPreviousData: true,
      refetchInterval: 30000,
    }
  );

  const handleViewDetails = (donor) => {
    setSelectedDonor(donor);
    setShowDetailModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    {
      header: 'Donor',
      accessor: 'personalInfo',
      render: (value, row) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {value?.firstName} {value?.lastName}
            </p>
            <p className="text-sm text-gray-500">{row.user?.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Contact',
      accessor: 'contact',
      render: (contact) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="w-3 h-3 mr-1" />
            {contact?.email || 'N/A'}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="w-3 h-3 mr-1" />
            {contact?.phone || 'N/A'}
          </div>
        </div>
      )
    },
    {
      header: 'Blood Type',
      accessor: 'personalInfo.bloodType',
      render: (bloodType) => (
        <div className="flex items-center space-x-2">
          <Droplets className="w-4 h-4 text-red-500" />
          <span className="font-medium text-gray-900">{bloodType || 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Donations to Hospital',
      accessor: 'hospitalDonations',
      render: (donations) => (
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{donations?.count || 0}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
      )
    },
    {
      header: 'Last Donation',
      accessor: 'lastDonation',
      render: (value) => {
        if (!value) return <span className="text-gray-500">Never</span>;
        const { date } = formatDateTime(value);
        return <span className="text-sm text-gray-600">{date}</span>;
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (status) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(status)}`}>
          {status}
        </span>
      )
    },
    {
      header: 'Relationship',
      accessor: 'relationshipType',
      render: (type) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          type === 'regular' ? 'bg-blue-100 text-blue-800' :
          type === 'frequent' ? 'bg-green-100 text-green-800' :
          type === 'new' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {type || 'New'}
        </span>
      )
    }
  ];

  const actions = (donor) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => handleViewDetails(donor)}
        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
        title="View Details"
      >
        <Eye className="w-4 h-4" />
      </button>
    </div>
  );

  // Calculate stats
  const donors = donorsData?.donors || [];
  const totalDonors = donorsData?.pagination?.total || 0;
  const activeCount = donors.filter(d => d.status === 'active').length;
  const regularDonors = donors.filter(d => d.relationshipType === 'regular').length;
  const totalDonations = donors.reduce((sum, donor) => sum + (donor.hospitalDonations?.count || 0), 0);

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Donors</h3>
        <p className="text-gray-600">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hospital Donors</h1>
        <p className="text-gray-600">Manage and track donors who have donated to your hospital.</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total Donors"
          value={totalDonors}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Active Donors"
          value={activeCount}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="Regular Donors"
          value={regularDonors}
          icon={Award}
          color="purple"
        />
        <StatsCard
          title="Total Donations"
          value={totalDonations}
          icon={Heart}
          color="red"
        />
      </div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search donors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Donors Table */}
        <DataTable
          data={donors}
          columns={columns}
          loading={isLoading}
          actions={actions}
          pagination={donorsData?.pagination}
          onPageChange={setCurrentPage}
        />
      </motion.div>

      {/* Donor Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Donor Details"
        size="lg"
      >
        {selectedDonor && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Name</label>
                    <p className="text-gray-900">
                      {selectedDonor.personalInfo?.firstName} {selectedDonor.personalInfo?.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{selectedDonor.user?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Blood Type</label>
                    <p className="text-gray-900">{selectedDonor.personalInfo?.bloodType || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Date of Birth</label>
                    <p className="text-gray-900">
                      {selectedDonor.personalInfo?.dateOfBirth ? 
                        new Date(selectedDonor.personalInfo.dateOfBirth).toLocaleDateString() : 'Not specified'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(selectedDonor.status)}`}>
                      {selectedDonor.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-gray-900">{selectedDonor.contact?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Address</label>
                    <p className="text-gray-900">
                      {selectedDonor.address ? 
                        `${selectedDonor.address.street}, ${selectedDonor.address.city}, ${selectedDonor.address.state} ${selectedDonor.address.zipCode}` :
                        'Not provided'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Emergency Contact</label>
                    <p className="text-gray-900">
                      {selectedDonor.emergencyContact?.name || 'Not provided'}
                    </p>
                    {selectedDonor.emergencyContact?.phone && (
                      <p className="text-sm text-gray-600">{selectedDonor.emergencyContact.phone}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Hospital-Specific Statistics */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Donation History at This Hospital</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{selectedDonor.hospitalDonations?.count || 0}</p>
                  <p className="text-sm text-gray-600">Total Donations</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{selectedDonor.hospitalDonations?.bloodCount || 0}</p>
                  <p className="text-sm text-gray-600">Blood Donations</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{selectedDonor.hospitalDonations?.organCount || 0}</p>
                  <p className="text-sm text-gray-600">Organ Donations</p>
                </div>
              </div>
            </div>

            {/* Recent Donations to This Hospital */}
            {selectedDonor.hospitalDonations?.recent && selectedDonor.hospitalDonations.recent.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Donations to This Hospital</h3>
                <div className="space-y-2">
                  {selectedDonor.hospitalDonations.recent.slice(0, 5).map((donation, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {donation.type === 'blood' ? (
                          <Droplets className="w-4 h-4 text-red-500" />
                        ) : (
                          <Heart className="w-4 h-4 text-purple-500" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {donation.type === 'blood' ? donation.bloodType : donation.organType} Donation
                          </p>
                          <p className="text-sm text-gray-600">Appointment #{donation.appointmentId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {new Date(donation.date).toLocaleDateString()}
                        </p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses(donation.status, 'appointment')}`}>
                          {donation.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Donor Relationship Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Relationship Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Relationship Type</span>
                  </div>
                  <p className="text-blue-800 capitalize">{selectedDonor.relationshipType || 'New'}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-900">First Donation</span>
                  </div>
                  <p className="text-green-800">
                    {selectedDonor.hospitalDonations?.firstDonation ? 
                      new Date(selectedDonor.hospitalDonations.firstDonation).toLocaleDateString() : 
                      'No donations yet'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HospitalDonors;
