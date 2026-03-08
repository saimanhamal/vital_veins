import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Calendar, 
  Clock, 
  User, 
  Filter, 
  Search, 
  Plus, 
  Check, 
  X, 
  Eye, 
  Edit,
  AlertTriangle,
  CheckCircle,
  CalendarDays,
  Phone,
  Mail
} from 'lucide-react';
import { hospitalAPI } from '../../services/api';
import DataTable from '../../components/UI/DataTable';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Modal from '../../components/UI/Modal';
import { formatDateTime, getStatusClasses } from '../../utils/helpers';
import toast from 'react-hot-toast';

const HospitalAppointments = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    search: '',
    dateRange: 'all'
  });
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const queryClient = useQueryClient();

  // Fetch appointments
  const { data: appointmentsData, isLoading, error } = useQuery(
    ['hospital-appointments', filters, page, limit],
    () => hospitalAPI.getAppointments({ 
      ...filters, 
      page, 
      limit,
      status: filters.status === 'all' ? undefined : filters.status,
      type: filters.type === 'all' ? undefined : filters.type
    }).then(res => res.data),
    {
      keepPreviousData: true,
      refetchInterval: 30000
    }
  );

  // Update appointment status mutation
  const updateStatusMutation = useMutation(
    ({ appointmentId, status, notes }) => 
      hospitalAPI.updateAppointmentStatus(appointmentId, { status, notes }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['hospital-appointments']);
        queryClient.invalidateQueries(['hospital-dashboard']);
        toast.success('Appointment status updated successfully');
        setIsConfirmModalOpen(false);
        setSelectedAppointment(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update appointment');
      }
    }
  );

  const handleStatusUpdate = (appointment, newStatus) => {
    setSelectedAppointment({ ...appointment, newStatus });
    setIsConfirmModalOpen(true);
  };

  const confirmStatusUpdate = () => {
    if (selectedAppointment) {
      updateStatusMutation.mutate({
        appointmentId: selectedAppointment._id,
        status: selectedAppointment.newStatus,
        notes: `Status updated to ${selectedAppointment.newStatus} by hospital`
      });
    }
  };

  const columns = [
    {
      header: 'Donor Information',
      accessor: 'donor',
      render: (value, row) => (
        <div 
          className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate(`/donor-profile/${value?.user?._id}`)}
        >
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {value?.personalInfo?.firstName} {value?.personalInfo?.lastName}
            </p>
            <p className="text-sm text-gray-500">{value?.user?.email}</p>
            <p className="text-sm text-gray-500">
              Blood Type: {value?.personalInfo?.bloodType || 'N/A'}
            </p>
          </div>
        </div>
      )
    },
    {
      header: 'Appointment Details',
      accessor: 'scheduledDate',
      render: (value, row) => {
        const { date, time } = formatDateTime(value);
        return (
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <CalendarDays className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-gray-900">{date}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">{time}</span>
            </div>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
              row.type === 'blood' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {row.displayType || row.type}
            </span>
          </div>
        );
      }
    },
    {
      header: 'Contact',
      accessor: 'donor.contact',
      render: (value, row) => (
        <div className="space-y-1">
          {value?.phone && (
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{value.phone}</span>
            </div>
          )}
          {row.donor?.user?.email && (
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{row.donor.user.email}</span>
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(value, 'appointment')}`}>
          {value.replace('_', ' ').toUpperCase()}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedAppointment(row);
              setIsDetailModalOpen(true);
            }}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          {row.status === 'pending' && (
            <>
              <button
                onClick={() => handleStatusUpdate(row, 'confirmed')}
                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                title="Confirm Appointment"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleStatusUpdate(row, 'cancelled')}
                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                title="Cancel Appointment"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
          
          {row.status === 'confirmed' && (
            <button
              onClick={() => handleStatusUpdate(row, 'completed')}
              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
              title="Mark as Completed"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Appointments</h3>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Appointment Management</h1>
        <p className="text-gray-600">Manage and track all donor appointments for your hospital.</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Appointments', value: appointmentsData?.pagination?.total || 0, color: 'blue' },
          { label: 'Pending', value: appointmentsData?.stats?.pending || 0, color: 'yellow' },
          { label: 'Confirmed', value: appointmentsData?.stats?.confirmed || 0, color: 'green' },
          { label: 'Completed', value: appointmentsData?.stats?.completed || 0, color: 'purple' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <Calendar className={`w-8 h-8 text-${stat.color}-500`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="card p-6"
      >
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by donor name or email..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="input w-64"
            />
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="input"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="input"
          >
            <option value="all">All Types</option>
            <option value="blood">Blood Donation</option>
            <option value="organ">Organ Donation</option>
          </select>
        </div>
      </motion.div>

      {/* Appointments Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Appointments</h2>
        </div>
        
        <DataTable
          data={appointmentsData?.appointments || []}
          columns={columns}
          loading={isLoading}
          pagination={{
            current: page,
            total: appointmentsData?.pagination?.pages || 1,
            onPageChange: setPage
          }}
        />
      </motion.div>

      {/* Appointment Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Appointment Details"
        size="lg"
      >
        {selectedAppointment && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Donor Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <p className="text-gray-900">
                      {selectedAppointment.donor?.personalInfo?.firstName} {selectedAppointment.donor?.personalInfo?.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{selectedAppointment.donor?.user?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-gray-900">{selectedAppointment.donor?.contact?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Blood Type</label>
                    <p className="text-gray-900">{selectedAppointment.donor?.personalInfo?.bloodType || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Date & Time</label>
                    <p className="text-gray-900">{formatDateTime(selectedAppointment.scheduledDate).date} at {formatDateTime(selectedAppointment.scheduledDate).time}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Type</label>
                    <p className="text-gray-900">{selectedAppointment.displayType || selectedAppointment.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(selectedAppointment.status, 'appointment')}`}>
                      {selectedAppointment.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  {selectedAppointment.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Notes</label>
                      <p className="text-gray-900">{selectedAppointment.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Action"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to {selectedAppointment.newStatus} this appointment with{' '}
              {selectedAppointment.donor?.personalInfo?.firstName} {selectedAppointment.donor?.personalInfo?.lastName}?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusUpdate}
                disabled={updateStatusMutation.isLoading}
                className={`btn ${selectedAppointment.newStatus === 'cancelled' ? 'btn-danger' : 'btn-primary'}`}
              >
                {updateStatusMutation.isLoading ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HospitalAppointments;
