import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  Hospital,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  Edit,
  Ban,
  Eye,
  Heart,
  Droplets,
  Phone,
  Mail,
  Search,
  CalendarDays,
  TimerIcon,
  MessageSquare,
  Star,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { donorAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Modal from '../../components/UI/Modal';
import toast from 'react-hot-toast';

const DonorAppointments = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleData, setRescheduleData] = useState({ newDate: '', newTime: '', reason: '' });
  const [feedbackData, setFeedbackData] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    fetchAppointments();
    fetchDonorProfile();
  }, [filters]);

  const fetchDonorProfile = async () => {
    try {
      const res = await donorAPI.getProfile();
      setDonorStatus(res.data.donor?.status || null);
    } catch (err) {
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
          default:
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

  // FIX: Upfront account status check with clear message
  const handleBookAppointment = () => {
    if (donorStatus && donorStatus !== 'active') {
      toast.error(
        <div>
          <p className="font-semibold">Account Not Yet Activated</p>
          <p className="text-sm mt-1">Your account is pending admin approval. You'll receive an email once approved.</p>
        </div>,
        { duration: 5000 }
      );
      return;
    }
    navigate('/donor/hospitals');
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const openDetailsModal = (appointment) => { setSelectedAppointment(appointment); setDetailsModal(true); };
  const openCancelModal = (appointment) => { setSelectedAppointment(appointment); setCancelModal(true); };
  const openRescheduleModal = (appointment) => { setSelectedAppointment(appointment); setRescheduleModal(true); };
  const openFeedbackModal = (appointment) => { setSelectedAppointment(appointment); setFeedbackModal(true); };

  const handleCancelAppointment = async () => {
    if (!cancelReason.trim()) { toast.error('Please provide a cancellation reason'); return; }
    try {
      await donorAPI.cancelAppointment(selectedAppointment._id, { reason: cancelReason });
      toast.success('Appointment cancelled successfully');
      setCancelModal(false);
      setCancelReason('');
      setSelectedAppointment(null);
      await fetchAppointments();
    } catch (error) {
      toast.error('Failed to cancel appointment');
    }
  };

  const handleRescheduleAppointment = async () => {
    if (!rescheduleData.newDate || !rescheduleData.newTime) { toast.error('Please select a new date and time'); return; }
    try {
      await donorAPI.rescheduleAppointment(selectedAppointment._id, rescheduleData);
      toast.success('Appointment rescheduled successfully');
      setRescheduleModal(false);
      setRescheduleData({ newDate: '', newTime: '', reason: '' });
      setSelectedAppointment(null);
      await fetchAppointments();
    } catch (error) {
      toast.error('Failed to reschedule appointment');
    }
  };

  const handleSubmitFeedback = async () => {
    try {
      await donorAPI.submitFeedback(selectedAppointment._id, feedbackData);
      toast.success('Feedback submitted successfully');
      setFeedbackModal(false);
      setFeedbackData({ rating: 5, comment: '' });
      setSelectedAppointment(null);
      await fetchAppointments();
    } catch (error) {
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
    const icons = { pending: AlertCircle, confirmed: CheckCircle, completed: CheckCircle, cancelled: XCircle, rescheduled: Clock, no_show: XCircle };
    const Icon = icons[status] || AlertCircle;
    return <Icon className="w-4 h-4" />;
  };

  const getTypeIcon = (type) => {
    if (type === 'blood') return <Droplets className="w-5 h-5 text-red-500" />;
    return <Heart className="w-5 h-5 text-purple-500" />;
  };

  const formatDateTime = (date, time) => {
    const appointmentDate = new Date(date);
    return {
      date: appointmentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      time: time || 'Time not set'
    };
  };

  const isUpcoming = (date, time, status) => {
    if (!['pending', 'confirmed'].includes(status)) return false;
    return new Date(`${date}T${time}`) > new Date();
  };

  const canCancel = (appointment) => ['pending', 'confirmed', 'approved'].includes(appointment.status);
  const canReschedule = (appointment) => ['pending', 'confirmed'].includes(appointment.status) && isUpcoming(appointment.scheduledDate, appointment.scheduledTime, appointment.status);
  const canProvideFeedback = (appointment) => appointment.status === 'completed' && !appointment.feedback?.donor;

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = !filters.search ||
      appointment.appointmentId?.toLowerCase().includes(filters.search.toLowerCase()) ||
      appointment.hospital?.hospitalName?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.status === 'all' || appointment.status === filters.status;
    const matchesType = filters.type === 'all' || appointment.type === filters.type;
    return matchesSearch && matchesStatus && matchesType;
  });

  // FIX: Upfront account activation banner
  const isAccountPending = donorStatus && donorStatus !== 'active';

  const actionHover = {
    whileHover: { scale: 1.04 },
    whileTap: { scale: 0.96 },
    transition: { type: 'spring', stiffness: 400 }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-6">

      {/* FIX: Upfront pending account banner — shown at top before any actions */}
      {isAccountPending && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start space-x-3 p-4 rounded-xl border"
          style={{ background: '#FFF7ED', borderColor: '#FED7AA' }}
        >
          <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 text-sm">Account Pending Activation</p>
            <p className="text-amber-700 text-xs mt-0.5">
              Your account is currently under admin review. Booking appointments will be available once your account is approved. You'll receive an email notification.
            </p>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Appointments</h1>
          <p className="text-gray-600">Manage and track your donation appointments</p>
        </div>
        <div className="flex space-x-3">
          <motion.button {...actionHover} onClick={handleRefresh} disabled={refreshing}
            className="btn-secondary flex items-center space-x-2">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </motion.button>
          <motion.button {...actionHover} onClick={handleBookAppointment}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              isAccountPending
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'btn-primary'
            }`}>
            {isAccountPending ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>Book New</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: 'Total Appointments', count: appointments.length, icon: Calendar, color: 'text-blue-600', bgColor: 'bg-blue-100', filterStatus: 'all' },
          { title: 'Upcoming', count: appointments.filter(a => ['pending', 'confirmed', 'approved'].includes(a.status)).length, icon: Clock, color: 'text-green-600', bgColor: 'bg-green-100', filterStatus: 'pending' },
          { title: 'Completed', count: appointments.filter(a => a.status === 'completed').length, icon: CheckCircle, color: 'text-purple-600', bgColor: 'bg-purple-100', filterStatus: 'completed' },
          { title: 'Cancelled', count: appointments.filter(a => a.status === 'cancelled').length, icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100', filterStatus: 'cancelled' }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div key={index}
              whileHover={{ scale: 1.05, y: -4, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300 }}
              onClick={() => handleFilterChange('status', stat.filterStatus)}
              className="card p-6 cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
        className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Search appointments, hospitals..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} />
          </div>
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
            value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="no_show">No Show</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
            value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)}>
            <option value="all">All Types</option>
            <option value="blood">Blood</option>
            <option value="organ">Organ</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
            value={filters.dateRange} onChange={(e) => handleFilterChange('dateRange', e.target.value)}>
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="upcoming">Upcoming</option>
          </select>
        </div>
      </motion.div>

      {/* Appointments List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
        className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="card p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Appointments Found</h3>
            <p className="text-gray-600 mb-4">You haven't scheduled any appointments yet or none match your filters.</p>
            <motion.button {...actionHover} onClick={handleBookAppointment}
              className="btn-primary flex items-center space-x-2 mx-auto">
              <Plus className="w-4 h-4" /><span>Book Your First Appointment</span>
            </motion.button>
          </div>
        ) : (
          <AnimatePresence>
            {filteredAppointments.map((appointment) => {
              const { date, time } = formatDateTime(appointment.scheduledDate, appointment.scheduledTime);
              const upcoming = isUpcoming(appointment.scheduledDate, appointment.scheduledTime, appointment.status);
              return (
                <motion.div key={appointment._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className={`card p-6 transition-all ${upcoming ? 'border-l-4 border-l-blue-500' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0">{getTypeIcon(appointment.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2 flex-wrap gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {appointment.type === 'blood' ? appointment.bloodType : appointment.organType} Donation
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                            {getStatusIcon(appointment.status)}
                            <span className="ml-1">{appointment.status.replace('_', ' ').toUpperCase()}</span>
                          </span>
                          <span className="text-xs text-gray-400">#{appointment.appointmentId}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600 mb-4">
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-4 h-4 flex-shrink-0" />
                            {/* FIX: "Hospital" instead of "Building2" */}
                            <span className="truncate">{appointment.hospital?.hospitalName || 'Hospital not set'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CalendarDays className="w-4 h-4 flex-shrink-0" />
                            <span>{date}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <TimerIcon className="w-4 h-4 flex-shrink-0" />
                            <span>{time}</span>
                          </div>
                        </div>

                        {appointment.notes?.donor && (
                          <div className="bg-gray-50 p-3 rounded-lg mb-3">
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
                          <div className="bg-yellow-50 p-3 rounded-lg">
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
                      <motion.button {...actionHover} onClick={() => openDetailsModal(appointment)}
                        className="btn-secondary flex items-center space-x-1.5 text-sm">
                        <Eye className="w-4 h-4" /><span>Details</span>
                      </motion.button>

                      {canReschedule(appointment) && (
                        <motion.button {...actionHover} onClick={() => openRescheduleModal(appointment)}
                          className="btn-secondary flex items-center space-x-1.5 text-sm">
                          <Edit className="w-4 h-4" /><span>Reschedule</span>
                        </motion.button>
                      )}

                      {/* FIX: Cancel button uses Ban icon (not Trash2) to avoid confusion with delete */}
                      {canCancel(appointment) && (
                        <motion.button {...actionHover} onClick={() => openCancelModal(appointment)}
                          className="btn-danger flex items-center space-x-1.5 text-sm">
                          <Ban className="w-4 h-4" /><span>Cancel</span>
                        </motion.button>
                      )}

                      {canProvideFeedback(appointment) && (
                        <motion.button {...actionHover} onClick={() => openFeedbackModal(appointment)}
                          className="btn-primary flex items-center space-x-1.5 text-sm">
                          <Star className="w-4 h-4" /><span>Feedback</span>
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Details Modal */}
      <Modal isOpen={detailsModal} onClose={() => { setDetailsModal(false); setSelectedAppointment(null); }}
        title="Appointment Details" size="xl">
        {selectedAppointment && (
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">{getTypeIcon(selectedAppointment.type)}</div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Schedule</h3>
                <div className="space-y-3">
                  {[
                    { icon: CalendarDays, label: 'Date', value: formatDateTime(selectedAppointment.scheduledDate, selectedAppointment.scheduledTime).date },
                    { icon: TimerIcon, label: 'Time', value: formatDateTime(selectedAppointment.scheduledDate, selectedAppointment.scheduledTime).time },
                    { icon: Clock, label: 'Duration', value: `${selectedAppointment.duration || 60} minutes` },
                  ].map(item => (
                    <div key={item.label} className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{item.label}</div>
                        <div className="text-sm text-gray-900">{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                {/* FIX: "Hospital Details" instead of "Building2 Details" */}
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Hospital Details</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hospital</div>
                      <div className="text-sm text-gray-900">{selectedAppointment.hospital?.hospitalName}</div>
                      <div className="text-xs text-gray-500">
                        {selectedAppointment.hospital?.address?.street}, {selectedAppointment.hospital?.address?.city}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</div>
                      <div className="text-sm text-gray-900">{selectedAppointment.hospital?.contact?.phone || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</div>
                      <div className="text-sm text-gray-900">{selectedAppointment.hospital?.contact?.email || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {(selectedAppointment.notes?.donor || selectedAppointment.notes?.hospital) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
                <div className="space-y-3">
                  {selectedAppointment.notes?.donor && (
                    <div className="bg-blue-50 p-4 rounded-xl">
                      <div className="font-medium text-blue-900 mb-1 text-sm">Your Notes</div>
                      <div className="text-sm text-blue-800">{selectedAppointment.notes.donor}</div>
                    </div>
                  )}
                  {/* FIX: "Hospital Notes" instead of "Building2 Notes" */}
                  {selectedAppointment.notes?.hospital && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="font-medium text-gray-900 mb-1 text-sm">Hospital Notes</div>
                      <div className="text-sm text-gray-700">{selectedAppointment.notes.hospital}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedAppointment.rescheduleHistory?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Reschedule History</h3>
                <div className="space-y-2">
                  {selectedAppointment.rescheduleHistory.map((r, i) => (
                    <div key={i} className="bg-gray-50 p-3 rounded-lg text-sm">
                      <div className="font-medium">Rescheduled on {new Date(r.requestedAt).toLocaleDateString()}</div>
                      <div className="text-gray-600">From: {new Date(r.fromDate).toLocaleDateString()}</div>
                      <div className="text-gray-600">To: {new Date(r.toDate).toLocaleDateString()}</div>
                      {r.reason && <div className="text-gray-600 mt-1">Reason: {r.reason}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <motion.button {...actionHover}
                onClick={() => { setDetailsModal(false); setSelectedAppointment(null); }}
                className="btn-secondary">Close</motion.button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Modal */}
      <Modal isOpen={cancelModal}
        onClose={() => { setCancelModal(false); setSelectedAppointment(null); setCancelReason(''); }}
        title="Cancel Appointment" size="md">
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start space-x-2">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900 mb-1">Confirm Cancellation</p>
                  <p className="text-xs text-red-800">
                    You are about to cancel your {selectedAppointment.type === 'blood' ? selectedAppointment.bloodType : selectedAppointment.organType} donation
                    appointment scheduled for {formatDateTime(selectedAppointment.scheduledDate, selectedAppointment.scheduledTime).date}.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Cancellation *</label>
              <textarea className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                rows={3} placeholder="Please provide a reason..." value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)} />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <motion.button {...actionHover}
                onClick={() => { setCancelModal(false); setSelectedAppointment(null); setCancelReason(''); }}
                className="btn-secondary">Keep Appointment</motion.button>
              <motion.button {...actionHover} onClick={handleCancelAppointment}
                disabled={!cancelReason.trim()}
                className="btn-danger flex items-center space-x-2 disabled:opacity-50">
                <Ban className="w-4 h-4" /><span>Cancel Appointment</span>
              </motion.button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reschedule Modal */}
      <Modal isOpen={rescheduleModal}
        onClose={() => { setRescheduleModal(false); setSelectedAppointment(null); setRescheduleData({ newDate: '', newTime: '', reason: '' }); }}
        title="Reschedule Appointment" size="md">
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <strong>Current:</strong> {formatDateTime(selectedAppointment.scheduledDate, selectedAppointment.scheduledTime).date} at {formatDateTime(selectedAppointment.scheduledDate, selectedAppointment.scheduledTime).time}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Date *</label>
                <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                  value={rescheduleData.newDate} min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, newDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Time *</label>
                <input type="time" className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                  value={rescheduleData.newTime}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, newTime: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason (Optional)</label>
              <textarea className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                rows={3} placeholder="Reason for rescheduling..." value={rescheduleData.reason}
                onChange={(e) => setRescheduleData({ ...rescheduleData, reason: e.target.value })} />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <motion.button {...actionHover}
                onClick={() => { setRescheduleModal(false); setSelectedAppointment(null); setRescheduleData({ newDate: '', newTime: '', reason: '' }); }}
                className="btn-secondary">Cancel</motion.button>
              <motion.button {...actionHover} onClick={handleRescheduleAppointment}
                disabled={!rescheduleData.newDate || !rescheduleData.newTime}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50">
                <Edit className="w-4 h-4" /><span>Reschedule</span>
              </motion.button>
            </div>
          </div>
        )}
      </Modal>

      {/* Feedback Modal */}
      <Modal isOpen={feedbackModal}
        onClose={() => { setFeedbackModal(false); setSelectedAppointment(null); setFeedbackData({ rating: 5, comment: '' }); }}
        title="Provide Feedback" size="md">
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-800">
              <strong>Appointment:</strong> {selectedAppointment.type === 'blood' ? selectedAppointment.bloodType : selectedAppointment.organType} donation
              at {selectedAppointment.hospital?.hospitalName}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Rate your experience</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button key={star}
                    whileHover={{ scale: 1.3, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                    onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                    className={`w-9 h-9 ${star <= feedbackData.rating ? 'text-yellow-500' : 'text-gray-300'}`}>
                    <Star className="w-full h-full fill-current" />
                  </motion.button>
                ))}
                <span className="ml-2 text-sm text-gray-500 self-center">{feedbackData.rating}/5</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Comments (Optional)</label>
              <textarea className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                rows={4} placeholder="Share your experience..."
                value={feedbackData.comment} onChange={(e) => setFeedbackData({ ...feedbackData, comment: e.target.value })} />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <motion.button {...actionHover}
                onClick={() => { setFeedbackModal(false); setSelectedAppointment(null); setFeedbackData({ rating: 5, comment: '' }); }}
                className="btn-secondary">Cancel</motion.button>
              <motion.button {...actionHover} onClick={handleSubmitFeedback}
                className="btn-primary flex items-center space-x-2">
                <Star className="w-4 h-4" /><span>Submit Feedback</span>
              </motion.button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DonorAppointments;