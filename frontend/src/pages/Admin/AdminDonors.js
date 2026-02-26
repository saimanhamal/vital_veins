import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  Mail, 
  Phone, 
  Heart,
  Droplets,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import DataTable from '../../components/UI/DataTable';
import Modal from '../../components/UI/Modal';
import StatsCard from '../../components/UI/StatsCard';
import { formatDateTime, getStatusClasses } from '../../utils/helpers';
import toast from 'react-hot-toast';

const AdminDonors = () => {
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('adminDonors.search') || '');
  const [statusFilter, setStatusFilter] = useState(() => localStorage.getItem('adminDonors.status') || 'all');
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [bloodTypeFilter, setBloodTypeFilter] = useState(() => localStorage.getItem('adminDonors.bloodType') || 'all');
  const [cityFilter, setCityFilter] = useState(() => localStorage.getItem('adminDonors.city') || '');
  const [organTypeFilter, setOrganTypeFilter] = useState(() => localStorage.getItem('adminDonors.organType') || 'all');
  const queryClient = useQueryClient();

  // Initialize filters from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    if (status) {
      setStatusFilter(status);
    }
    const search = params.get('search');
    if (search) setSearchTerm(search);
    const bloodType = params.get('bloodType');
    if (bloodType) setBloodTypeFilter(bloodType);
    const city = params.get('city');
    if (city) setCityFilter(city);
    const organType = params.get('organType');
    if (organType) setOrganTypeFilter(organType);
  }, []);

  // Persist status/search
  useEffect(() => {
    localStorage.setItem('adminDonors.search', searchTerm);
    localStorage.setItem('adminDonors.status', statusFilter);
  }, [searchTerm, statusFilter]);

  // Persist filters
  useEffect(() => {
    localStorage.setItem('adminDonors.bloodType', bloodTypeFilter);
    localStorage.setItem('adminDonors.city', cityFilter);
    localStorage.setItem('adminDonors.organType', organTypeFilter);
  }, [bloodTypeFilter, cityFilter, organTypeFilter]);

  // Fetch donors data
  const { data: donorsData, isLoading, error } = useQuery(
    ['admin-donors', currentPage, searchTerm, statusFilter, bloodTypeFilter, cityFilter, organTypeFilter],
    () => adminAPI.getDonors({ 
      page: currentPage,
      limit: 10,
      search: searchTerm || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      bloodType: bloodTypeFilter !== 'all' ? bloodTypeFilter : undefined,
      city: cityFilter || undefined,
      organType: organTypeFilter !== 'all' ? organTypeFilter : undefined
    }).then(res => {
      console.log('✅ Donors fetched:', res.data);
      return res.data;
    }),
    {
      keepPreviousData: true,
      refetchInterval: 30000,
      onError: (err) => {
        console.error('❌ Error fetching donors:', err);
      }
    }
  );

  // Update donor status mutation
  const updateDonorMutation = useMutation(
    ({ id, status, notes }) => {
      // If donor is pending and being accepted, call approve endpoint
      if (status === 'active') {
        return adminAPI.approveDonor(id);
      }
      // If donor is pending and being rejected, call reject endpoint
      if (status === 'inactive') {
        return adminAPI.rejectDonor(id, { reason: notes });
      }
      // Otherwise use the regular status update endpoint
      return adminAPI.updateDonorStatus(id, { status, notes });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-donors');
        queryClient.invalidateQueries('admin-dashboard');
        toast.success('Donor status updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update donor status');
      }
    }
  );

  const handleViewDetails = (donor) => {
    setSelectedDonor(donor);
    setShowDetailModal(true);
  };

  const handleStatusUpdate = (donor, status) => {
    // Determine friendly action label
    let action = 'update';
    if (status === 'active') action = 'accept';
    else if (status === 'suspended') action = 'suspend';
    else if (status === 'inactive') action = 'reject';

    const defaultPrompt = `Please provide a reason for ${action}ing ${donor.personalInfo?.firstName || ''} ${donor.personalInfo?.lastName || ''}:`;
    const notes = prompt(defaultPrompt);

    if (notes !== null) { // User didn't cancel
      updateDonorMutation.mutate({
        id: donor._id,
        status,
        notes
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
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
      header: 'Status',
      accessor: 'status',
      render: (status) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(status)}`}>
          {status}
        </span>
      )
    },
    {
      header: 'Registered',
      accessor: 'createdAt',
      render: (value) => {
        const { date } = formatDateTime(value);
        return <span className="text-sm text-gray-600">{date}</span>;
      }
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
      {donor.status === 'suspended' && (
        <button
          onClick={() => handleStatusUpdate(donor, 'active')}
          disabled={updateDonorMutation.isLoading}
          className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded disabled:opacity-50"
          title="Activate"
        >
          <CheckCircle className="w-4 h-4" />
        </button>
      )}
      {donor.status === 'active' && (
        <button
          onClick={() => handleStatusUpdate(donor, 'suspended')}
          disabled={updateDonorMutation.isLoading}
          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded disabled:opacity-50"
          title="Suspend"
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
      {donor.status === 'pending' && (
        <>
          <button
            onClick={() => {
              if (window.confirm(`Accept ${donor.personalInfo?.firstName || ''} ${donor.personalInfo?.lastName || ''}?`)) {
                handleStatusUpdate(donor, 'active');
              }
            }}
            disabled={updateDonorMutation.isLoading}
            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded disabled:opacity-50"
            title="Accept"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const reason = window.prompt(`Provide a reason to reject ${donor.personalInfo?.firstName || ''} ${donor.personalInfo?.lastName || ''}:`);
              if (reason !== null) {
                handleStatusUpdate(donor, 'inactive');
              }
            }}
            disabled={updateDonorMutation.isLoading}
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded disabled:opacity-50"
            title="Reject"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );

  // Calculate stats
  const donors = donorsData?.donors || [];
  const totalDonors = donorsData?.pagination?.total || 0;
  const activeCount = donors.filter(d => d.status === 'active').length;
  const suspendedCount = donors.filter(d => d.status === 'suspended').length;

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Donor Management</h1>
        <p className="text-gray-600">View and manage all registered donors in the system.</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total Donors"
          value={totalDonors}
          icon={Users}
          color="blue"
          onClick={() => {
            setStatusFilter('all');
            setCurrentPage(1);
            const url = new URL(window.location.href);
            url.searchParams.set('status', 'all');
            url.searchParams.delete('search');
            url.searchParams.delete('bloodType');
            url.searchParams.delete('city');
            window.history.replaceState({}, '', url.toString());
          }}
        />
        <StatsCard
          title="Active Donors"
          value={activeCount}
          icon={CheckCircle}
          color="green"
          onClick={() => {
            setStatusFilter('active');
            setCurrentPage(1);
            const url = new URL(window.location.href);
            url.searchParams.set('status', 'active');
            window.history.replaceState({}, '', url.toString());
          }}
        />
        <StatsCard
          title="Suspended"
          value={suspendedCount}
          icon={XCircle}
          color="red"
          onClick={() => {
            setStatusFilter('suspended');
            setCurrentPage(1);
            const url = new URL(window.location.href);
            url.searchParams.set('status', 'suspended');
            window.history.replaceState({}, '', url.toString());
          }}
        />
      </div>

      {/* Quick View Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
      >
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              setStatusFilter('all');
              const url = new URL(window.location.href);
              url.searchParams.set('status', 'all');
              window.history.replaceState({}, '', url.toString());
            }}
            className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
          >
            View All Donors
          </button>
          <button
            onClick={() => {
              setStatusFilter('active');
              const url = new URL(window.location.href);
              url.searchParams.set('status', 'active');
              window.history.replaceState({}, '', url.toString());
            }}
            className="px-3 py-2 text-sm rounded-md border border-green-300 text-green-700 hover:bg-green-50"
          >
            Active Donors
          </button>
          <button
            onClick={() => {
              setStatusFilter('suspended');
              const url = new URL(window.location.href);
              url.searchParams.set('status', 'suspended');
              window.history.replaceState({}, '', url.toString());
            }}
            className="px-3 py-2 text-sm rounded-md border border-red-300 text-red-700 hover:bg-red-50"
          >
            Suspended Donors
          </button>
        </div>
      </motion.div>

      {/* Quick Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div />
          <button
            onClick={() => {
              const url = new URL(window.location.href);
              ['status','search','bloodType','city','organType'].forEach(p => url.searchParams.delete(p));
              window.history.replaceState({}, '', url.toString());
              localStorage.removeItem('adminDonors.search');
              localStorage.removeItem('adminDonors.status');
              localStorage.removeItem('adminDonors.bloodType');
              localStorage.removeItem('adminDonors.city');
              localStorage.removeItem('adminDonors.organType');
              setStatusFilter('all');
              setSearchTerm('');
              setBloodTypeFilter('all');
              setCityFilter('');
              setOrganTypeFilter('all');
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Reset Filters
          </button>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600 mr-2">Blood group:</span>
            {['O+','A+','B+','AB+','O-','A-','B-','AB-'].map(bt => (
              <button
                key={bt}
                onClick={() => {
                  setBloodTypeFilter(bt);
                  setCurrentPage(1);
                  const url = new URL(window.location.href);
                  url.searchParams.set('bloodType', bt);
                  window.history.replaceState({}, '', url.toString());
                }}
                className={`px-3 py-1 rounded-full text-sm border ${bloodTypeFilter === bt ? 'bg-red-100 text-red-700 border-red-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              >
                {bt}
              </button>
            ))}
            <button
              onClick={() => {
                setBloodTypeFilter('all');
                const url = new URL(window.location.href);
                url.searchParams.delete('bloodType');
                window.history.replaceState({}, '', url.toString());
              }}
              className={`px-3 py-1 rounded-full text-sm border ${bloodTypeFilter === 'all' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
            >
              All
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600 mr-2">City:</span>
            {['Mumbai','Delhi','Bengaluru','Chennai','Kolkata'].map(city => (
              <button
                key={city}
                onClick={() => {
                  setCityFilter(city);
                  setCurrentPage(1);
                  const url = new URL(window.location.href);
                  url.searchParams.set('city', city);
                  window.history.replaceState({}, '', url.toString());
                }}
                className={`px-3 py-1 rounded-full text-sm border ${cityFilter === city ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              >
                {city}
              </button>
            ))}
            <button
              onClick={() => {
                setCityFilter('');
                const url = new URL(window.location.href);
                url.searchParams.delete('city');
                window.history.replaceState({}, '', url.toString());
              }}
              className={`px-3 py-1 rounded-full text-sm border ${!cityFilter ? 'bg-gray-100 text-gray-700 border-gray-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
            >
              All
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600 mr-2">Organ:</span>
            {['Kidney','Heart','Liver','Lung','Cornea','Skin','Bone','Pancreas','Intestine'].map(org => (
              <button
                key={org}
                onClick={() => {
                  setOrganTypeFilter(org);
                  setCurrentPage(1);
                  const url = new URL(window.location.href);
                  url.searchParams.set('organType', org);
                  window.history.replaceState({}, '', url.toString());
                }}
                className={`px-3 py-1 rounded-full text-sm border ${organTypeFilter === org ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              >
                {org}
              </button>
            ))}
            <button
              onClick={() => {
                setOrganTypeFilter('all');
                const url = new URL(window.location.href);
                url.searchParams.delete('organType');
                window.history.replaceState({}, '', url.toString());
              }}
              className={`px-3 py-1 rounded-full text-sm border ${organTypeFilter === 'all' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
            >
              All
            </button>
          </div>
        </div>
      </motion.div>

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
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
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

            {/* Action Buttons */}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {selectedDonor.status === 'suspended' && (
                <button
                  onClick={() => {
                    handleStatusUpdate(selectedDonor, 'active');
                    setShowDetailModal(false);
                  }}
                  disabled={updateDonorMutation.isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {updateDonorMutation.isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 inline mr-2" />
                      Activate
                    </>
                  )}
                </button>
              )}
              {selectedDonor.status === 'active' && (
                <button
                  onClick={() => {
                    handleStatusUpdate(selectedDonor, 'suspended');
                    setShowDetailModal(false);
                  }}
                  disabled={updateDonorMutation.isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {updateDonorMutation.isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 inline mr-2" />
                      Suspend
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminDonors;
