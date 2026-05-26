import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Search,
  Filter,
  Heart,
  Droplets,
  RefreshCw
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Modal from '../../components/UI/Modal';
import { formatDateTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

const AdminAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    type: 'all'
  });
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [actionModal, setActionModal] = useState(false);
  const [actionType, setActionType] = useState(null); // 'no_show' or 'cancel'
  const [actionReason, setActionReason] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const queryClient = useQueryClient();

  // Fetch appointments
  const { isLoading, error, refetch } = useQuery(
    ['admin-appointments', filters, page],
    async () => {
      const res = await adminAPI.getAppointments({
        page,
        limit,
        status: filters.status !== 'all' ? filters.status : undefined,
        type: filters.type !== 'all' ? filters.type : undefined
      });
      setAppointments(res.data.appointments);
      setTotal(res.data.pagination.total);
      return res.data;
    },
    { keepPreviousData: true }
  );

  // Mark as no_show mutation
  const markNoShowMutation = useMutation(
    ({ appointmentId, reason }) =>
      adminAPI.markAppointmentNoShow(appointmentId, { reason }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-appointments');
        toast.success('Appointment marked as no-show');
        setActionModal(false);
        setSelectedAppointment(null);
        setActionReason('');
        refetch();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to mark as no-show');
      }
    }
  );

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation(
    ({ appointmentId, reason }) =>
      adminAPI.cancelAppointmentAdmin(appointmentId, { reason }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-appointments');
        toast.success('Appointment cancelled successfully');
        setActionModal(false);
        setSelectedAppointment(null);
        setActionReason('');
        refetch();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to cancel appointment');
      }
    }
  );

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const openDetailsModal = (appointment) => {
    setSelectedAppointment(appointment);
    setDetailsModal(true);
  };

  const openActionModal = (appointment, type) => {
    setSelectedAppointment(appointment);
    setActionType(type);
    setActionReason('');
    setActionModal(true);
  };

  const handleConfirmAction = () => {
    if (!selectedAppointment) {
      toast.error('No appointment selected');
      return;
    }

    // Validate reason field
    const trimmedReason = actionReason.trim();
    if (trimmedReason && (trimmedReason.length < 5 || trimmedReason.length > 500)) {
      toast.error('Reason must be between 5 and 500 characters');
      return;
    }

    if (actionType === 'no_show') {
      // Validate appointment time has passed
      const appointmentDateTime = new Date(`${selectedAppointment.scheduledDate}T${selectedAppointment.scheduledTime}`);
      const now = new Date();
      
      if (appointmentDateTime > now) {
        toast.error('Cannot mark future appointments as no-show');
        return;
      }

      markNoShowMutation.mutate({
        appointmentId: selectedAppointment._id,
        reason: trimmedReason || 'Donor did not show up'
      });
    } else if (actionType === 'cancel') {
      // Validate appointment status
      const cancellableStatuses = ['pending', 'confirmed', 'approved'];
      if (!cancellableStatuses.includes(selectedAppointment.status)) {
        toast.error(`Cannot cancel ${selectedAppointment.status} appointments`);
        return;
      }

      cancelAppointmentMutation.mutate({
        appointmentId: selectedAppointment._id,
        reason: trimmedReason || 'Cancelled by administrator'
      });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      no_show: 'bg-gray-100 text-gray-800 border-gray-200',
      rescheduled: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: AlertTriangle,
      confirmed: CheckCircle,
      completed: CheckCircle,
      cancelled: XCircle,
      no_show: XCircle,
      rescheduled: Clock
    };
    return icons[status] || AlertTriangle;
  };

  const canMarkNoShow = (appointment) => {
    return ['pending', 'confirmed'].includes(appointment.status) &&
      new Date(appointment.scheduledDate) < new Date();
  };

  const canCancel = (appointment) => {
    return ['pending', 'confirmed', 'approved'].includes(appointment.status);
  };

  const formatDateTime = (date, time) => {
    const appointmentDate = new Date(date);
    return {
      date: appointmentDate.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: time || 'N/A'
    };
  };

  if (isLoading && appointments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading appointments..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Appointments</h3>
        <p className="text-gray-600">Please try refreshing the page.</p>
      </div>
    );
  }

  const stats = {
    total: total,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
    noShow: appointments.filter(a => a.status === 'no_show').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Appointment Management</h1>
        <p className="text-gray-600">Manage and monitor all appointments in the system</p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-6 gap-4"
      >
        {[
          { label: 'Total', value: stats.total, color: 'blue', filterStatus: 'all' },
          { label: 'Pending', value: stats.pending, color: 'yellow', filterStatus: 'pending' },
          { label: 'Confirmed', value: stats.confirmed, color: 'green', filterStatus: 'confirmed' },
          { label: 'Completed', value: stats.completed, color: 'purple', filterStatus: 'completed' },
          { label: 'Cancelled', value: stats.cancelled, color: 'red', filterStatus: 'cancelled' },
          { label: 'No Show', value: stats.noShow, color: 'gray', filterStatus: 'no_show' }
        ].map((stat, index) => {
          const colorMap = {
            blue: 'bg-blue-100 text-blue-800',
            yellow: 'bg-yellow-100 text-yellow-800',
            green: 'bg-green-100 text-green-800',
            purple: 'bg-purple-100 text-purple-800',
            red: 'bg-red-100 text-red-800',
            gray: 'bg-gray-100 text-gray-800'
          };
          const handleStatClick = () => {
            setFilters(prev => ({ ...prev, status: stat.filterStatus }));
            setPage(1);
          };
          return (
            <div 
              key={index} 
              onClick={handleStatClick}
              className={`card p-4 ${colorMap[stat.color]} cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200`}
            >
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm">{stat.label}</p>
            </div>
          );
        })}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="card p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by ID, donor, hospital..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
            <option value="rescheduled">Rescheduled</option>
          </select>

          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="blood">Blood</option>
            <option value="organ">Organ</option>
          </select>

          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="btn-secondary flex items-center justify-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* Appointments List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="space-y-4"
      >
        {appointments.length === 0 ? (
          <div className="card p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Appointments Found</h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </div>
        ) : (
          appointments.map((appointment) => {
            const { date, time } = formatDateTime(appointment.scheduledDate, appointment.scheduledTime);
            const StatusIcon = getStatusIcon(appointment.status);

            return (
              <motion.div
                key={appointment._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex-shrink-0">
                        {appointment.type === 'blood' ? (
                          <Droplets className="w-5 h-5 text-red-500" />
                        ) : (
                          <Heart className="w-5 h-5 text-purple-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {appointment.type === 'blood'
                            ? appointment.bloodType
                            : appointment.organType}{' '}
                          Donation
                        </h3>
                        <p className="text-sm text-gray-500">#{appointment.appointmentId}</p>
                      </div>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm border ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {appointment.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    {/* Appointment Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-gray-600">Date</p>
                          <p className="font-medium text-gray-900">{date}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-gray-600">Time</p>
                          <p className="font-medium text-gray-900">{time}</p>
                        </div>
                      </div>
                      <div 
                        className="flex items-center space-x-2 text-sm cursor-pointer hover:opacity-70 transition-opacity"
                        onClick={() => navigate(`/donor-profile/${appointment.donor?.user?._id}`)}
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-gray-600">Donor</p>
                          <p className="font-medium text-gray-900">
                            {appointment.donor?.personalInfo?.firstName}{' '}
                            {appointment.donor?.personalInfo?.lastName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-gray-600">Hospital</p>
                          <p className="font-medium text-gray-900">
                            {appointment.hospital?.hospitalName}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => openDetailsModal(appointment)}
                      className="btn-secondary flex items-center space-x-2 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Details</span>
                    </button>

                    {canMarkNoShow(appointment) && (
                      <button
                        onClick={() => openActionModal(appointment, 'no_show')}
                        className="btn-danger flex items-center space-x-2 text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>No Show</span>
                      </button>
                    )}

                    {canCancel(appointment) && (
                      <button
                        onClick={() => openActionModal(appointment, 'cancel')}
                        className="btn-danger flex items-center space-x-2 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary"
          >
            Previous
          </button>
          <span className="text-gray-600">
            Page {page} of {Math.ceil(total / limit)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / limit)}
            className="btn-secondary"
          >
            Next
          </button>
        </div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={detailsModal}
        onClose={() => {
          setDetailsModal(false);
          setSelectedAppointment(null);
        }}
        title="Appointment Details"
        size="xl"
      >
        {selectedAppointment && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Schedule</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">
                        {formatDateTime(
                          selectedAppointment.scheduledDate,
                          selectedAppointment.scheduledTime
                        ).date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-medium">
                        {formatDateTime(
                          selectedAppointment.scheduledDate,
                          selectedAppointment.scheduledTime
                        ).time}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">People Involved</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Donor</p>
                      <p className="font-medium">
                        {selectedAppointment.donor?.personalInfo?.firstName}{' '}
                        {selectedAppointment.donor?.personalInfo?.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Building2 className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Hospital</p>
                      <p className="font-medium">
                        {selectedAppointment.hospital?.hospitalName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Action Modal */}
      <Modal
        isOpen={actionModal}
        onClose={() => {
          setActionModal(false);
          setActionReason('');
        }}
        title={
          actionType === 'no_show'
            ? 'Mark Appointment as No Show'
            : 'Cancel Appointment'
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {actionType === 'no_show'
                ? 'Reason for No Show'
                : 'Cancellation Reason'}
              {actionReason.trim().length > 0 && (
                <span className="text-xs text-gray-500 ml-2">
                  ({actionReason.trim().length}/500)
                </span>
              )}
            </label>
            <textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder={
                actionType === 'no_show'
                  ? 'e.g., Donor did not arrive for appointment (min 5 characters)'
                  : 'e.g., Hospital closure, equipment malfunction (min 5 characters)'
              }
              rows="4"
              maxLength="500"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              {actionReason.trim().length > 0 && actionReason.trim().length < 5 && (
                <span className="text-red-500">Reason must be at least 5 characters</span>
              )}
              {actionReason.trim().length === 0 && (
                <span>Optional - if left empty, will use default reason</span>
              )}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            {actionType === 'no_show' ? (
              <p><strong>Note:</strong> Only overdue appointments can be marked as no-show. This will track against the donor's record.</p>
            ) : (
              <p><strong>Note:</strong> Only pending, confirmed, or approved appointments can be cancelled. Both parties will be notified.</p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setActionModal(false);
                setActionReason('');
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAction}
              disabled={
                markNoShowMutation.isLoading || 
                cancelAppointmentMutation.isLoading ||
                (actionReason.trim().length > 0 && actionReason.trim().length < 5)
              }
              className="btn-primary"
            >
              {actionType === 'no_show' ? 'Mark No Show' : 'Cancel Appointment'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminAppointments;
