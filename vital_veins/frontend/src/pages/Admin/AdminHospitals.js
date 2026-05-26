import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Building2,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  MapPin,
  Phone,
  Mail,
  Clock,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import DataTable from '../../components/UI/DataTable';
import Modal from '../../components/UI/Modal';
import StatsCard from '../../components/UI/StatsCard';
import { formatDateTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

const AdminHospitals = () => {
  // persisted state
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();
  const [cityFilter, setCityFilter] = useState(() => localStorage.getItem('adminHospitals.city') || '');
  const [specializationFilter, setSpecializationFilter] = useState(() => localStorage.getItem('adminHospitals.specialization') || 'all');
  const [statusFilter, setStatusFilter] = useState(() => localStorage.getItem('adminHospitals.status') || 'all');
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('adminHospitals.search') || '');

  // Initialize filters from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    if (status) setStatusFilter(status);
    const search = params.get('search');
    if (search) setSearchTerm(search);
    const city = params.get('city');
    if (city) setCityFilter(city);
    const specialization = params.get('specialization');
    if (specialization) setSpecializationFilter(specialization);
  }, []);

  // Persist city filter
  useEffect(() => {
    localStorage.setItem('adminHospitals.city', cityFilter);
    localStorage.setItem('adminHospitals.specialization', specializationFilter);
    localStorage.setItem('adminHospitals.status', statusFilter);
    localStorage.setItem('adminHospitals.search', searchTerm);
  }, [cityFilter, specializationFilter, statusFilter, searchTerm]);

  // Fetch hospitals data
  const { data: hospitalsData, isLoading, error } = useQuery(
    ['admin-hospitals', currentPage, searchTerm, statusFilter, cityFilter, specializationFilter],
    () => adminAPI.getHospitals({ 
      page: currentPage,
      limit: 10,
      search: searchTerm || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      city: cityFilter || undefined,
      specialization: specializationFilter !== 'all' ? specializationFilter : undefined
    }).then(res => res.data),
    {
      keepPreviousData: true,
      refetchInterval: 30000,
    }
  );

  // Hospital approval/rejection mutation
  const updateHospitalMutation = useMutation(
    ({ id, status, notes }) => adminAPI.approveHospital(id, { status, notes }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-hospitals');
        queryClient.invalidateQueries('admin-dashboard');
        toast.success('Hospital status updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update hospital status');
      }
    }
  );

  const handleApproval = (hospital, status) => {
    const actionLabels = { approved: 'approve', rejected: 'reject', suspended: 'suspend' };
    const label = actionLabels[status] || 'update';

    toast((t) => (
      <div className="flex flex-col space-y-3">
        <p className="font-semibold text-gray-900">
          {label.charAt(0).toUpperCase() + label.slice(1)} {hospital.hospitalName}?
        </p>
        <p className="text-sm text-gray-600">This will change the hospital status to <strong>{status}</strong>.</p>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              updateHospitalMutation.mutate({
                id: hospital._id,
                status,
                notes: label
              });
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

  const handleViewDetails = (hospital) => {
    setSelectedHospital(hospital);
    setShowDetailModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    {
      header: 'Hospital',
      accessor: 'hospitalName',
      render: (value, row) => (
        <div>
          <p className="font-semibold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{row.license}</p>
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
            {contact?.email}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="w-3 h-3 mr-1" />
            {contact?.phone}
          </div>
        </div>
      )
    },
    {
      header: 'Location',
      accessor: 'address',
      render: (address) => (
        <div className="flex items-start">
          <MapPin className="w-4 h-4 mr-1 mt-0.5 text-gray-400" />
          <div className="text-sm text-gray-600">
            <p>{address?.city}, {address?.state}</p>
            <p>{address?.zipCode}</p>
          </div>
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

  const actions = (hospital) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => handleViewDetails(hospital)}
        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
        title="View Details"
      >
        <Eye className="w-4 h-4" />
      </button>
      {hospital.status === 'pending' && (
        <>
          <button
            onClick={() => handleApproval(hospital, 'approved')}
            disabled={updateHospitalMutation.isLoading}
            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded disabled:opacity-50"
            title="Approve"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleApproval(hospital, 'rejected')}
            disabled={updateHospitalMutation.isLoading}
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
  const hospitals = hospitalsData?.hospitals || [];
  const totalHospitals = hospitalsData?.pagination?.total || 0;
  const pendingCount = hospitals.filter(h => h.status === 'pending').length;
  const approvedCount = hospitals.filter(h => h.status === 'approved').length;
  const rejectedCount = hospitals.filter(h => h.status === 'rejected').length;

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Hospitals</h3>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hospital Management</h1>
        <p className="text-gray-600">Manage hospital registrations and approvals.</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total Hospitals"
          value={totalHospitals}
          icon={Building2}
          color="blue"
          onClick={() => {
            setStatusFilter('all');
            setCurrentPage(1);
            const url = new URL(window.location.href);
            url.searchParams.set('status', 'all');
            url.searchParams.delete('search');
            url.searchParams.delete('city');
            url.searchParams.delete('specialization');
            window.history.replaceState({}, '', url.toString());
          }}
        />
        <StatsCard
          title="Pending Approval"
          value={pendingCount}
          icon={Clock}
          color="yellow"
          onClick={() => {
            setStatusFilter('pending');
            setCurrentPage(1);
            const url = new URL(window.location.href);
            url.searchParams.set('status', 'pending');
            window.history.replaceState({}, '', url.toString());
          }}
        />
        <StatsCard
          title="Approved"
          value={approvedCount}
          icon={CheckCircle}
          color="green"
          onClick={() => {
            setStatusFilter('approved');
            setCurrentPage(1);
            const url = new URL(window.location.href);
            url.searchParams.set('status', 'approved');
            window.history.replaceState({}, '', url.toString());
          }}
        />
        <StatsCard
          title="Rejected"
          value={rejectedCount}
          icon={XCircle}
          color="red"
          onClick={() => {
            setStatusFilter('rejected');
            setCurrentPage(1);
            const url = new URL(window.location.href);
            url.searchParams.set('status', 'rejected');
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
            View All Hospitals
          </button>
          <button
            onClick={() => {
              setStatusFilter('approved');
              const url = new URL(window.location.href);
              url.searchParams.set('status', 'approved');
              window.history.replaceState({}, '', url.toString());
            }}
            className="px-3 py-2 text-sm rounded-md border border-green-300 text-green-700 hover:bg-green-50"
          >
            Approved Hospitals
          </button>
          <button
            onClick={() => {
              setStatusFilter('pending');
              const url = new URL(window.location.href);
              url.searchParams.set('status', 'pending');
              window.history.replaceState({}, '', url.toString());
            }}
            className="px-3 py-2 text-sm rounded-md border border-yellow-300 text-yellow-700 hover:bg-yellow-50"
          >
            Pending Requests
          </button>
          <button
            onClick={() => {
              setStatusFilter('rejected');
              const url = new URL(window.location.href);
              url.searchParams.set('status', 'rejected');
              window.history.replaceState({}, '', url.toString());
            }}
            className="px-3 py-2 text-sm rounded-md border border-red-300 text-red-700 hover:bg-red-50"
          >
            Rejected Hospitals
          </button>
        </div>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        {/* Quick Actions */}
        <div className="flex items-center justify-between mb-4">
          <div />
          <button
            onClick={() => {
              // clear URL params
              const url = new URL(window.location.href);
              ['status','search','city','specialization'].forEach(p => url.searchParams.delete(p));
              window.history.replaceState({}, '', url.toString());
              // clear localStorage
              localStorage.removeItem('adminHospitals.city');
              localStorage.removeItem('adminHospitals.specialization');
              localStorage.removeItem('adminHospitals.status');
              localStorage.removeItem('adminHospitals.search');
              // reset state
              setStatusFilter('all');
              setSearchTerm('');
              setCityFilter('');
              setSpecializationFilter('all');
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Reset Filters
          </button>
        </div>

        {/* Quick City Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
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

        {/* Specialization Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-sm text-gray-600 mr-2">Specialization:</span>
          {['General','Cardiology','Neurology','Oncology','Pediatrics','Emergency','Transplant'].map(spec => (
            <button
              key={spec}
              onClick={() => {
                setSpecializationFilter(spec);
                setCurrentPage(1);
                const url = new URL(window.location.href);
                url.searchParams.set('specialization', spec);
                window.history.replaceState({}, '', url.toString());
              }}
              className={`px-3 py-1 rounded-full text-sm border ${specializationFilter === spec ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
            >
              {spec}
            </button>
          ))}
          <button
            onClick={() => {
              setSpecializationFilter('all');
              const url = new URL(window.location.href);
              url.searchParams.delete('specialization');
              window.history.replaceState({}, '', url.toString());
            }}
            className={`px-3 py-1 rounded-full text-sm border ${specializationFilter === 'all' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
            All
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search hospitals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                const url = new URL(window.location.href);
                if (e.target.value === 'all') url.searchParams.delete('status');
                else url.searchParams.set('status', e.target.value);
                window.history.replaceState({}, '', url.toString());
              }}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Hospitals Table */}
        <DataTable
          data={hospitals}
          columns={columns}
          loading={isLoading}
          actions={actions}
          pagination={hospitalsData?.pagination}
          onPageChange={setCurrentPage}
        />
      </motion.div>

      {/* Hospital Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Hospital Details"
        size="lg"
      >
        {selectedHospital && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Hospital Name</label>
                    <p className="text-gray-900">{selectedHospital.hospitalName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">License Number</label>
                    <p className="text-gray-900">{selectedHospital.license}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(selectedHospital.status)}`}>
                      {selectedHospital.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{selectedHospital.contact?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-gray-900">{selectedHospital.contact?.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Website</label>
                    <p className="text-gray-900">{selectedHospital.contact?.website || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900">
                  {selectedHospital.address?.street}, {selectedHospital.address?.city}, {selectedHospital.address?.state} {selectedHospital.address?.zipCode}, {selectedHospital.address?.country}
                </p>
              </div>
            </div>

            {/* Specializations */}
            {selectedHospital.specialization && selectedHospital.specialization.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Specializations</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedHospital.specialization.map((spec, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Capacity */}
            {selectedHospital.capacity && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Capacity</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{selectedHospital.capacity.beds || 0}</p>
                    <p className="text-sm text-gray-600">Beds</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{selectedHospital.capacity.icuBeds || 0}</p>
                    <p className="text-sm text-gray-600">ICU Beds</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{selectedHospital.capacity.operationRooms || 0}</p>
                    <p className="text-sm text-gray-600">Operation Rooms</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {selectedHospital.status === 'pending' && (
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    handleApproval(selectedHospital, 'rejected');
                    setShowDetailModal(false);
                  }}
                  disabled={updateHospitalMutation.isLoading}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  <XCircle className="w-4 h-4 inline mr-2" />
                  Reject
                </button>
                <button
                  onClick={() => {
                    handleApproval(selectedHospital, 'approved');
                    setShowDetailModal(false);
                  }}
                  disabled={updateHospitalMutation.isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {updateHospitalMutation.isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 inline mr-2" />
                      Approve
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminHospitals;
