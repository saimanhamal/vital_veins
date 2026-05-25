import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Eye,
  Mail,
  Phone,
  Droplets,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Clock
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import DataTable from '../../components/UI/DataTable';
import Modal from '../../components/UI/Modal';
import StatsCard from '../../components/UI/StatsCard';
import { formatDateTime, getStatusClasses } from '../../utils/helpers';
import toast from 'react-hot-toast';

const AdminDonors = () => {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const queryClient = useQueryClient();

  // FIX: Read initial filter state from URL query params
  const getInitialFilter = (key, fallback) => {
    const params = new URLSearchParams(routerLocation.search);
    return params.get(key) || localStorage.getItem(`adminDonors.${key}`) || fallback;
  };

  const [searchTerm, setSearchTerm] = useState(() => getInitialFilter('search', ''));
  const [statusFilter, setStatusFilter] = useState(() => getInitialFilter('status', 'all'));
  const [bloodTypeFilter, setBloodTypeFilter] = useState(() => getInitialFilter('bloodType', 'all'));
  const [cityFilter, setCityFilter] = useState(() => getInitialFilter('city', ''));
  const [organTypeFilter, setOrganTypeFilter] = useState(() => getInitialFilter('organType', 'all'));
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // FIX: Re-read URL params when location changes (e.g. from admin dashboard link)
  useEffect(() => {
    const params = new URLSearchParams(routerLocation.search);
    if (params.get('status')) setStatusFilter(params.get('status'));
    if (params.get('search')) setSearchTerm(params.get('search'));
    if (params.get('bloodType')) setBloodTypeFilter(params.get('bloodType'));
    if (params.get('city')) setCityFilter(params.get('city'));
    if (params.get('organType')) setOrganTypeFilter(params.get('organType'));
  }, [routerLocation.search]);

  // Persist filters to localStorage
  useEffect(() => {
    localStorage.setItem('adminDonors.search', searchTerm);
    localStorage.setItem('adminDonors.status', statusFilter);
    localStorage.setItem('adminDonors.bloodType', bloodTypeFilter);
    localStorage.setItem('adminDonors.city', cityFilter);
    localStorage.setItem('adminDonors.organType', organTypeFilter);
  }, [searchTerm, statusFilter, bloodTypeFilter, cityFilter, organTypeFilter]);

  // FIX: Update URL when filters change so links are shareable
  const updateURL = (updates) => {
    const params = new URLSearchParams(routerLocation.search);
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    navigate(`${routerLocation.pathname}?${params.toString()}`, { replace: true });
  };

  const setFilter = (key, value, setter) => {
    setter(value);
    setCurrentPage(1);
    updateURL({ [key]: value });
  };

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
    }).then(res => res.data),
    {
      keepPreviousData: true,
      refetchInterval: 30000,
    }
  );

  const updateDonorMutation = useMutation(
    ({ id, status, notes }) => {
      if (status === 'active') return adminAPI.approveDonor(id);
      if (status === 'inactive') return adminAPI.rejectDonor(id, { reason: notes });
      return adminAPI.updateDonorStatus(id, { status, notes });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-donors');
        queryClient.invalidateQueries('admin-dashboard');
        toast.success('Donor status updated successfully');
        setShowDetailModal(false);
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

  // FIX: Replaced window.prompt (bad UX) with toast confirmation
  const handleStatusUpdate = (donor, status) => {
    const actionLabels = { active: 'approve', suspended: 'suspend', inactive: 'reject' };
    const label = actionLabels[status] || 'update';
    const name = `${donor.personalInfo?.firstName || ''} ${donor.personalInfo?.lastName || ''}`.trim();

    toast((t) => (
      <div className="flex flex-col space-y-3">
        <p className="font-semibold text-gray-900">
          {label.charAt(0).toUpperCase() + label.slice(1)} {name}?
        </p>
        <p className="text-sm text-gray-600">This will change their account status to <strong>{status}</strong>.</p>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              updateDonorMutation.mutate({ id: donor._id, status, notes: label });
            }}
            className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
          >
            Confirm
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 8000 });
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
          <div className="w-10 h-10 bg-gradient-to-r from-red-400 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">
              {value?.firstName?.charAt(0) || '?'}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{value?.firstName} {value?.lastName}</p>
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
            <Mail className="w-3 h-3 mr-1.5 flex-shrink-0" />{contact?.email || 'N/A'}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="w-3 h-3 mr-1.5 flex-shrink-0" />{contact?.phone || 'N/A'}
          </div>
        </div>
      )
    },
    {
      header: 'Blood Type',
      accessor: 'personalInfo',
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Droplets className="w-4 h-4 text-red-500" />
          <span className="font-bold text-gray-900">{value?.bloodType || 'N/A'}</span>
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
    <div className="flex items-center space-x-1">
      <button onClick={() => handleViewDetails(donor)}
        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
        <Eye className="w-4 h-4" />
      </button>
      {donor.status === 'suspended' && (
        <button onClick={() => handleStatusUpdate(donor, 'active')}
          disabled={updateDonorMutation.isLoading}
          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50" title="Activate">
          <CheckCircle className="w-4 h-4" />
        </button>
      )}
      {donor.status === 'active' && (
        <button onClick={() => handleStatusUpdate(donor, 'suspended')}
          disabled={updateDonorMutation.isLoading}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Suspend">
          <XCircle className="w-4 h-4" />
        </button>
      )}
      {donor.status === 'pending' && (
        <>
          <button onClick={() => handleStatusUpdate(donor, 'active')}
            disabled={updateDonorMutation.isLoading}
            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50" title="Approve">
            <CheckCircle className="w-4 h-4" />
          </button>
          <button onClick={() => handleStatusUpdate(donor, 'inactive')}
            disabled={updateDonorMutation.isLoading}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Reject">
            <XCircle className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );

  const donors = donorsData?.donors || [];
  const totalDonors = donorsData?.pagination?.total || 0;
  const activeCount = donors.filter(d => d.status === 'active').length;
  const pendingCount = donors.filter(d => d.status === 'pending').length;
  const suspendedCount = donors.filter(d => d.status === 'suspended').length;

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setBloodTypeFilter('all');
    setCityFilter('');
    setOrganTypeFilter('all');
    setCurrentPage(1);
    navigate(routerLocation.pathname, { replace: true });
    ['search', 'status', 'bloodType', 'city', 'organType'].forEach(k =>
      localStorage.removeItem(`adminDonors.${k}`)
    );
  };

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
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Donor Management</h1>
        <p className="text-gray-600">View and manage all registered donors in the system.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: 'Total Donors', value: totalDonors, icon: Users, color: 'blue', status: 'all' },
          { title: 'Active', value: activeCount, icon: CheckCircle, color: 'green', status: 'active' },
          { title: 'Pending', value: pendingCount, icon: Clock, color: 'orange', status: 'pending' },
          { title: 'Suspended', value: suspendedCount, icon: XCircle, color: 'red', status: 'suspended' },
        ].map((s, i) => (
          <motion.div key={s.title}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }}>
            <StatsCard {...s} loading={isLoading}
              onClick={() => setFilter('status', s.status, setStatusFilter)} />
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search donors..."
                value={searchTerm}
                onChange={(e) => setFilter('search', e.target.value, setSearchTerm)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent w-56" />
            </div>
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select value={statusFilter}
                onChange={(e) => setFilter('status', e.target.value, setStatusFilter)}
                className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 appearance-none bg-white">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <button onClick={resetFilters}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-600">
            Reset Filters
          </button>
        </div>

        {/* Blood type filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">Blood:</span>
          {['All', 'O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'].map(bt => (
            <button key={bt}
              onClick={() => setFilter('bloodType', bt === 'All' ? 'all' : bt, setBloodTypeFilter)}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                (bt === 'All' ? bloodTypeFilter === 'all' : bloodTypeFilter === bt)
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'
              }`}>
              {bt}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <DataTable
          data={donors}
          columns={columns}
          loading={isLoading}
          actions={actions}
          pagination={donorsData?.pagination}
          onPageChange={setCurrentPage}
        />
      </motion.div>

      {/* Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Donor Details" size="lg">
        {selectedDonor && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Name', value: `${selectedDonor.personalInfo?.firstName} ${selectedDonor.personalInfo?.lastName}` },
                    { label: 'Email', value: selectedDonor.user?.email },
                    { label: 'Blood Type', value: selectedDonor.personalInfo?.bloodType || 'Not specified' },
                    { label: 'Date of Birth', value: selectedDonor.personalInfo?.dateOfBirth ? new Date(selectedDonor.personalInfo.dateOfBirth).toLocaleDateString() : 'Not specified' },
                  ].map(item => (
                    <div key={item.label}>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{item.label}</label>
                      <p className="text-gray-900 text-sm">{item.value}</p>
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(selectedDonor.status)}`}>
                      {selectedDonor.status}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Phone', value: selectedDonor.contact?.phone || 'Not provided' },
                    { label: 'Address', value: selectedDonor.address ? `${selectedDonor.address.street}, ${selectedDonor.address.city}, ${selectedDonor.address.state} ${selectedDonor.address.zipCode}` : 'Not provided' },
                    { label: 'Emergency Contact', value: selectedDonor.emergencyContact?.name || 'Not provided' },
                    { label: 'Emergency Phone', value: selectedDonor.emergencyContact?.phone || '' },
                  ].map(item => item.value && (
                    <div key={item.label}>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{item.label}</label>
                      <p className="text-gray-900 text-sm">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                Close
              </button>
              {selectedDonor.status === 'suspended' && (
                <button onClick={() => handleStatusUpdate(selectedDonor, 'active')}
                  disabled={updateDonorMutation.isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" /><span>Activate</span>
                </button>
              )}
              {selectedDonor.status === 'pending' && (
                <>
                  <button onClick={() => handleStatusUpdate(selectedDonor, 'active')}
                    disabled={updateDonorMutation.isLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4" /><span>Approve</span>
                  </button>
                  <button onClick={() => handleStatusUpdate(selectedDonor, 'inactive')}
                    disabled={updateDonorMutation.isLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm flex items-center space-x-2">
                    <XCircle className="w-4 h-4" /><span>Reject</span>
                  </button>
                </>
              )}
              {selectedDonor.status === 'active' && (
                <button onClick={() => handleStatusUpdate(selectedDonor, 'suspended')}
                  disabled={updateDonorMutation.isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm flex items-center space-x-2">
                  <XCircle className="w-4 h-4" /><span>Suspend</span>
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