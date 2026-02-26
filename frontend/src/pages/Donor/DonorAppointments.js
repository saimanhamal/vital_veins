import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Building2,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  Heart,
  Droplets,
  Phone,
  Mail,
  Filter,
  Search,
  CalendarDays,
  TimerIcon,
  MessageSquare,
  Star,
  FileText
} from 'lucide-react';
import { donorAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Modal from '../../components/UI/Modal';
import toast from 'react-hot-toast';

const DonorAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    type: 'all',
    dateRange: 'all'
  });
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [donorStatus, setDonorStatus] = useState(null);
  const { user } = useAuth();
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleData, setRescheduleData] = useState({
    newDate: '',
    newTime: '',
    reason: ''
  });
  const [feedbackData, setFeedbackData] = useState({
    rating: 5,
    comment: ''
  });

  useEffect(() => {
    fetchAppointments();
    fetchDonorProfile();
  }, [filters]);

  const fetchDonorProfile = async () => {
    try {
      const res = await donorAPI.getProfile();
      setDonorStatus(res.data.donor?.status || null);
    } catch (err) {
      console.warn('Failed to fetch donor profile status', err);
      setDonorStatus(null);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = {
        search: filters.search || undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        type: filters.type !== 'all' ? filters.type : undefined
      };

      if (filters.dateRange !== 'all') {
        const now = new Date();
        let startDate, endDate;

        switch (filters.dateRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            break;
          case 'week':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
            endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            break;
          case 'upcoming':
            startDate = now;
            endDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
            break;
        }

        if (startDate && endDate) {
          params.startDate = startDate.toISOString();
          params.endDate = endDate.toISOString();
        }
      }

      const response = await donorAPI.getAppointments(params);
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
    toast.success('Appointments refreshed');
  };

  const handleBookAppointment = () => {
    if (donorStatus && donorStatus !== 'active') {
      toast.error('Your account is not yet activated by admin. You cannot book appointments.');
      return;
    }
    navigate('/donor/hospitals');
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const openDetailsModal = (appointment) => {
    setSelectedAppointment(appointment);
    setDetailsModal(true);
  };

  const openCancelModal = (appointment) => {
    setSelectedAppointment(appointment);
    setCancelModal(true);
  };

  const openRescheduleModal = (appointment) => {
    setSelectedAppointment(appointment);
    setRescheduleModal(true);
  };

  const openFeedbackModal = (appointment) => {
    setSelectedAppointment(appointment);
    setFeedbackModal(true);
  };

  const handleCancelAppointment = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    try {
      await donorAPI.cancelAppointment(selectedAppointment._id, {
        reason: cancelReason
      });
      
      toast.success('Appointment cancelled successfully');
      setCancelModal(false);
      setCancelReason('');
      setSelectedAppointment(null);
      await fetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
    }
  };

  const handleRescheduleAppointment = async () => {
    if (!rescheduleData.newDate || !rescheduleData.newTime) {
      toast.error('Please select a new date and time');
      return;
    }

    try {
      await donorAPI.rescheduleAppointment(selectedAppointment._id, {
        newDate: rescheduleData.newDate,
        newTime: rescheduleData.newTime,
        reason: rescheduleData.reason
      });
      
      toast.success('Appointment rescheduled successfully');
      setRescheduleModal(false);
      setRescheduleData({ newDate: '', newTime: '', reason: '' });
      setSelectedAppointment(null);
      await fetchAppointments();
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      toast.error('Failed to reschedule appointment');
    }
  };

  const handleSubmitFeedback = async () => {
    try {
      await donorAPI.submitFeedback(selectedAppointment._id, {
        rating: feedbackData.rating,
        comment: feedbackData.comment
      });
      
      toast.success('Feedback submitted successfully');
      setFeedbackModal(false);
      setFeedbackData({ rating: 5, comment: '' });
      setSelectedAppointment(null);
      await fetchAppointments();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      rescheduled: 'bg-purple-100 text-purple-800 border-purple-200',
      no_show: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: AlertCircle,
      confirmed: CheckCircle,
      completed: CheckCircle,
      cancelled: XCircle,
      rescheduled: Clock,
      no_show: XCircle
    };
    const Icon = icons[status] || AlertCircle;
    return <Icon className="w-4 h-4" />;
  };

  const getTypeIcon = (type, bloodType, organType) => {
    if (type === 'blood') {
      return <Droplets className="w-5 h-5 text-red-500" />;
    }
    return <Heart className="w-5 h-5 text-purple-500" />;
  };

  const formatDateTime = (date, time) => {
    const appointmentDate = new Date(date);
    return {
      date: appointmentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: time || 'Time not set'
    };
  };

  const isUpcoming = (date, time, status) => {
    if (!['pending', 'confirmed'].includes(status)) return false;
    const appointmentDateTime = new Date(`${date}T${time}`);
    return appointmentDateTime > new Date();
  };

  const canCancel = (appointment) => {
    return ['pending', 'confirmed'].includes(appointment.status) && 
           isUpcoming(appointment.scheduledDate, appointment.scheduledTime, appointment.status);
  };

  const canReschedule = (appointment) => {
    return ['pending', 'confirmed'].includes(appointment.status) && 
           isUpcoming(appointment.scheduledDate, appointment.scheduledTime, appointment.status);
  };

  const canProvideFeedback = (appointment) => {
    return appointment.status === 'completed' && !appointment.feedback?.donor;
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = !filters.search || 
      appointment.appointmentId?.toLowerCase().includes(filters.search.toLowerCase()) ||
      appointment.hospital?.hospitalName?.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Appointments</h1>
          <p className="text-gray-600">Manage and track your donation appointments</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button 
            onClick={handleBookAppointment}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Book New</span>
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        {[
          {
            title: 'Total Appointments',
            count: appointments.length,
            icon: Calendar,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
          },
          {
            title: 'Upcoming',
            count: appointments.filter(a => ['pending', 'confirmed'].includes(a.status)).length,
            icon: Clock,
            color: 'text-green-600',
            bgColor: 'bg-green-100'
          },
          {
            title: 'Completed',
            count: appointments.filter(a => a.status === 'completed').length,
            icon: CheckCircle,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
          },
          {
            title: 'Cancelled',
            count: appointments.filter(a => a.status === 'cancelled').length,
            icon: XCircle,
            color: 'text-red-600',
            bgColor: 'bg-red-100'
          }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card p-6">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                </div>
              </div>
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
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search appointments, hospitals..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          {/* Status Filter */}
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
            <option value="rescheduled">Rescheduled</option>
          </select>

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

          {/* Date Range Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="upcoming">Upcoming</option>
          </select>
        </div>
      </motion.div>

      {/* Appointments List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="space-y-4"
      >
        {filteredAppointments.length === 0 ? (
          <div className="card p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Appointments Found</h3>
            <p className="text-gray-600 mb-4">You haven't scheduled any appointments yet or none match your filters.</p>
            <button 
              onClick={handleBookAppointment}
              className="btn-primary flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Book Your First Appointment</span>
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {filteredAppointments.map((appointment) => {
              const { date, time } = formatDateTime(appointment.scheduledDate, appointment.scheduledTime);
              const upcoming = isUpcoming(appointment.scheduledDate, appointment.scheduledTime, appointment.status);
              
              return (
                <motion.div
                  key={appointment._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`card p-6 hover:shadow-lg transition-shadow ${
                    upcoming ? 'border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        {getTypeIcon(appointment.type, appointment.bloodType, appointment.organType)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {appointment.type === 'blood' ? appointment.bloodType : appointment.organType} Donation
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                            {getStatusIcon(appointment.status)}
                            <span className="ml-1">{appointment.status.replace('_', ' ').toUpperCase()}</span>
                          </span>
                          <span className="text-xs text-gray-500">#{appointment.appointmentId}</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-4 h-4" />
                            <span className="truncate">{appointment.hospital?.hospitalName}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CalendarDays className="w-4 h-4" />
                            <span>{date}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <TimerIcon className="w-4 h-4" />
                            <span>{time}</span>
                          </div>
                        </div>

                        {appointment.notes?.donor && (
                          <div className="bg-gray-50 p-3 rounded-lg mb-4">
                            <div className="flex items-start space-x-2">
                              <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-gray-900 mb-1">Your Notes</p>
                                <p className="text-xs text-gray-600">{appointment.notes.donor}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {appointment.feedback?.donor && (
                          <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                            <div className="flex items-start space-x-2">
                              <Star className="w-4 h-4 text-yellow-500 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-gray-900 mb-1">
                                  Your Rating: {appointment.feedback.donor.rating}/5
                                </p>
                                {appointment.feedback.donor.comment && (
                                  <p className="text-xs text-gray-600">{appointment.feedback.donor.comment}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => openDetailsModal(appointment)}
                        className="btn-secondary flex items-center space-x-2 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Details</span>
                      </button>
                      
                      {canReschedule(appointment) && (
                        <button
                          onClick={() => openRescheduleModal(appointment)}
                          className="btn-secondary flex items-center space-x-2 text-sm"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Reschedule</span>
                        </button>
                      )}
                      
                      {canCancel(appointment) && (
                        <button
                          onClick={() => openCancelModal(appointment)}
                          className="btn-danger flex items-center space-x-2 text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                      )}
                      
                      {canProvideFeedback(appointment) && (
                        <button
                          onClick={() => openFeedbackModal(appointment)}
                          className="btn-primary flex items-center space-x-2 text-sm"
                        >
                          <Star className="w-4 h-4" />
                          <span>Feedback</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Appointment Details Modal */}
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
            {/* Appointment Header */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {getTypeIcon(selectedAppointment.type, selectedAppointment.bloodType, selectedAppointment.organType)}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedAppointment.type === 'blood' ? selectedAppointment.bloodType : selectedAppointment.organType} Donation
                </h2>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm border ${getStatusColor(selectedAppointment.status)}`}>
                    {getStatusIcon(selectedAppointment.status)}
                    <span className="ml-1">{selectedAppointment.status.replace('_', ' ').toUpperCase()}</span>
                  </span>
                  <span className="text-sm text-gray-500">#{selectedAppointment.appointmentId}</span>
                </div>
              </div>
            </div>

            {/* Appointment Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Schedule</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CalendarDays className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="font-medium">Date</div>
                      <div className="text-sm text-gray-600">
                        {formatDateTime(selectedAppointment.scheduledDate, selectedAppointment.scheduledTime).date}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <TimerIcon className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="font-medium">Time</div>
                      <div className="text-sm text-gray-600">
                        {formatDateTime(selectedAppointment.scheduledDate, selectedAppointment.scheduledTime).time}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="font-medium">Duration</div>
                      <div className="text-sm text-gray-600">{selectedAppointment.duration || 60} minutes</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Building2 Details</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Building2 className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <div className="font-medium">{selectedAppointment.hospital?.hospitalName}</div>
                      <div className="text-sm text-gray-600">
                        {selectedAppointment.hospital?.address?.street}, {selectedAppointment.hospital?.address?.city}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="font-medium">Phone</div>
                      <div className="text-sm text-gray-600">{selectedAppointment.hospital?.contact?.phone}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="font-medium">Email</div>
                      <div className="text-sm text-gray-600">{selectedAppointment.hospital?.contact?.email}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {(selectedAppointment.notes?.donor || selectedAppointment.notes?.hospital) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
                <div className="space-y-3">
                  {selectedAppointment.notes?.donor && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="font-medium text-blue-900 mb-1">Your Notes</div>
                      <div className="text-sm text-blue-800">{selectedAppointment.notes.donor}</div>
                    </div>
                  )}
                  {selectedAppointment.notes?.hospital && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="font-medium text-gray-900 mb-1">Building2 Notes</div>
                      <div className="text-sm text-gray-700">{selectedAppointment.notes.hospital}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reschedule History */}
            {selectedAppointment.rescheduleHistory && selectedAppointment.rescheduleHistory.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Reschedule History</h3>
                <div className="space-y-2">
                  {selectedAppointment.rescheduleHistory.map((reschedule, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg text-sm">
                      <div className="font-medium">Rescheduled on {new Date(reschedule.requestedAt).toLocaleDateString()}</div>
                      <div className="text-gray-600">
                        From: {new Date(reschedule.fromDate).toLocaleDateString()}
                      </div>
                      <div className="text-gray-600">
                        To: {new Date(reschedule.toDate).toLocaleDateString()}
                      </div>
                      {reschedule.reason && (
                        <div className="text-gray-600 mt-1">Reason: {reschedule.reason}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  setDetailsModal(false);
                  setSelectedAppointment(null);
                }}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Appointment Modal */}
      <Modal
        isOpen={cancelModal}
        onClose={() => {
          setCancelModal(false);
          setSelectedAppointment(null);
          setCancelReason('');
        }}
        title="Cancel Appointment"
        size="md"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900 mb-1">Cancel Appointment</p>
                  <p className="text-xs text-red-800">
                    You are about to cancel your {selectedAppointment.type === 'blood' ? selectedAppointment.bloodType : selectedAppointment.organType} donation appointment
                    scheduled for {formatDateTime(selectedAppointment.scheduledDate, selectedAppointment.scheduledTime).date}.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Cancellation *
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
                placeholder="Please provide a reason for cancellation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  setCancelModal(false);
                  setSelectedAppointment(null);
                  setCancelReason('');
                }}
                className="btn-secondary"
              >
                Keep Appointment
              </button>
              <button
                onClick={handleCancelAppointment}
                className="btn-danger flex items-center space-x-2"
                disabled={!cancelReason.trim()}
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel Appointment</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reschedule Appointment Modal */}
      <Modal
        isOpen={rescheduleModal}
        onClose={() => {
          setRescheduleModal(false);
          setSelectedAppointment(null);
          setRescheduleData({ newDate: '', newTime: '', reason: '' });
        }}
        title="Reschedule Appointment"
        size="md"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-800">
                <strong>Current Appointment:</strong> {formatDateTime(selectedAppointment.scheduledDate, selectedAppointment.scheduledTime).date} at {formatDateTime(selectedAppointment.scheduledDate, selectedAppointment.scheduledTime).time}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Date *
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={rescheduleData.newDate}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, newDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Time *
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={rescheduleData.newTime}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, newTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rescheduling (Optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Please provide a reason for rescheduling..."
                value={rescheduleData.reason}
                onChange={(e) => setRescheduleData({ ...rescheduleData, reason: e.target.value })}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  setRescheduleModal(false);
                  setSelectedAppointment(null);
                  setRescheduleData({ newDate: '', newTime: '', reason: '' });
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleRescheduleAppointment}
                className="btn-primary flex items-center space-x-2"
                disabled={!rescheduleData.newDate || !rescheduleData.newTime}
              >
                <Edit className="w-4 h-4" />
                <span>Reschedule</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Feedback Modal */}
      <Modal
        isOpen={feedbackModal}
        onClose={() => {
          setFeedbackModal(false);
          setSelectedAppointment(null);
          setFeedbackData({ rating: 5, comment: '' });
        }}
        title="Provide Feedback"
        size="md"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-800">
                <strong>Appointment:</strong> {selectedAppointment.type === 'blood' ? selectedAppointment.bloodType : selectedAppointment.organType} donation
                at {selectedAppointment.hospital?.hospitalName}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rate your experience (1-5 stars)
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                    className={`w-8 h-8 ${star <= feedbackData.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                  >
                    <Star className="w-full h-full fill-current" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Comments (Optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Share your experience..."
                value={feedbackData.comment}
                onChange={(e) => setFeedbackData({ ...feedbackData, comment: e.target.value })}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  setFeedbackModal(false);
                  setSelectedAppointment(null);
                  setFeedbackData({ rating: 5, comment: '' });
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitFeedback}
                className="btn-primary flex items-center space-x-2"
              >
                <Star className="w-4 h-4" />
                <span>Submit Feedback</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DonorAppointments;
