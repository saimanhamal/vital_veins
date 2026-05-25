import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket,
  Clock,
  MapPin,
  AlertTriangle,
  Heart,
  Droplets,
  Search,
  Calendar,
  User,
  Building2,
  RefreshCw,
  Send,
  Lock,
  CheckCircle
} from 'lucide-react';
import { donorAPI, ticketsAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Modal from '../../components/UI/Modal';
import toast from 'react-hot-toast';

const DonorTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    urgency: 'all',
    status: 'open',
    sortBy: 'createdAt'
  });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [responseModal, setResponseModal] = useState(false);
  const [responseData, setResponseData] = useState({
    message: '',
    availability: 'immediately',
    contactMethod: 'phone',
    additionalNotes: ''
  });
  const [userLocation, setUserLocation] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [donorStatus, setDonorStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
    getUserLocation();
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

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        () => {}
      );
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      let response;
      if (userLocation && filters.sortBy === 'distance') {
        response = await ticketsAPI.getNearbyTickets(userLocation.lat, userLocation.lng, {
          type: filters.type !== 'all' ? filters.type : undefined,
          urgency: filters.urgency !== 'all' ? filters.urgency : undefined,
          status: filters.status,
          search: filters.search || undefined
        });
      } else {
        response = await donorAPI.getTickets({
          type: filters.type !== 'all' ? filters.type : undefined,
          urgency: filters.urgency !== 'all' ? filters.urgency : undefined,
          status: filters.status,
          search: filters.search || undefined,
          sortBy: filters.sortBy
        });
      }
      setTickets(response.data.tickets || []);
    } catch (error) {
      toast.error('Failed to fetch emergency tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
    toast.success('Tickets refreshed');
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // FIX: Block respond if account not active — check BEFORE opening modal
  const openResponseModal = (ticket) => {
    if (donorStatus && donorStatus !== 'active') {
      toast.error(
        <div>
          <p className="font-semibold">Account Not Activated</p>
          <p className="text-sm mt-1">Your account is pending admin approval. You'll be notified by email once approved.</p>
        </div>,
        { duration: 5000 }
      );
      return;
    }
    setSelectedTicket(ticket);
    setResponseModal(true);
  };

  const handleTicketResponse = async () => {
    if (!responseData.message.trim()) {
      toast.error('Please enter a response message');
      return;
    }
    setSubmitting(true);
    try {
      await donorAPI.respondToTicket(selectedTicket._id, {
        message: responseData.message,
        status: 'offer',
        metadata: {
          availability: responseData.availability,
          contactMethod: responseData.contactMethod,
          additionalNotes: responseData.additionalNotes
        }
      });
      toast.success('Response sent successfully!');
      setResponseModal(false);
      setResponseData({ message: '', availability: 'immediately', contactMethod: 'phone', additionalNotes: '' });
      await fetchTickets();
    } catch (error) {
      toast.error('Failed to send response');
    } finally {
      setSubmitting(false);
    }
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[urgency] || colors.medium;
  };

  const getTypeIcon = (type) => {
    if (type === 'blood') return <Droplets className="w-5 h-5 text-red-500" />;
    return <Heart className="w-5 h-5 text-purple-500" />;
  };

  const formatTimeAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = !filters.search ||
      ticket.ticketId?.toLowerCase().includes(filters.search.toLowerCase()) ||
      ticket.hospital?.hospitalName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      ticket.message?.toLowerCase().includes(filters.search.toLowerCase());
    return matchesSearch;
  });

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

      {/* FIX: Upfront account status banner — shown prominently at top */}
      {isAccountPending && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start space-x-3 p-4 rounded-xl border"
          style={{ background: '#FFF7ED', borderColor: '#FED7AA' }}>
          <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 text-sm">Account Pending Activation</p>
            <p className="text-amber-700 text-xs mt-0.5">
              You can browse emergency requests but cannot respond until your account is approved by admin. Check your email for approval notification.
            </p>
          </div>
        </motion.div>
      )}

      {/* Active account confirmation banner */}
      {donorStatus === 'active' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-3 p-3 rounded-xl border"
          style={{ background: '#F0FDF4', borderColor: '#BBF7D0' }}>
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-800 text-sm font-medium">Your account is active — you can respond to emergency requests.</p>
        </motion.div>
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Emergency Requests</h1>
          <p className="text-gray-600">Respond to urgent blood and organ needs in your area</p>
        </div>
        <motion.button {...actionHover} onClick={handleRefresh} disabled={refreshing}
          className="btn-primary flex items-center space-x-2">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </motion.button>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Search tickets, hospitals..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
              value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} />
          </div>
          {[
            { key: 'type', options: [['all', 'All Types'], ['blood', 'Blood'], ['organ', 'Organ']] },
            { key: 'urgency', options: [['all', 'All Urgency'], ['critical', 'Critical'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']] },
            { key: 'status', options: [['open', 'Open'], ['in_progress', 'In Progress'], ['all', 'All Status']] },
            { key: 'sortBy', options: [['createdAt', 'Latest'], ['urgency', 'Urgency'], ['expiresAt', 'Expiring Soon'], ...(userLocation ? [['distance', 'Distance']] : [])] },
          ].map(({ key, options }) => (
            <select key={key}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
              value={filters[key]} onChange={(e) => handleFilterChange(key, e.target.value)}>
              {options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          ))}
        </div>
      </motion.div>

      {/* Tickets List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-4">
        {filteredTickets.length === 0 ? (
          <div className="card p-8 text-center">
            <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Emergency Tickets</h3>
            <p className="text-gray-600">There are no emergency tickets matching your criteria at the moment.</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredTickets.map((ticket) => (
              <motion.div key={ticket._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="card p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0">{getTypeIcon(ticket.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2 flex-wrap gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {ticket.type === 'blood' ? ticket.bloodType : ticket.organType}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUrgencyColor(ticket.urgency)}`}>
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {ticket.urgency.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-400">#{ticket.ticketId}</span>
                      </div>

                      <p className="text-gray-700 mb-3 text-sm line-clamp-2">{ticket.message}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{ticket.hospital?.hospitalName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{ticket.hospital?.address?.city}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span>{formatTimeAgo(ticket.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>Expires: {new Date(ticket.expiresAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {ticket.patientInfo && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-900">Patient Information</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                            {ticket.patientInfo.name && <div><strong>Name:</strong> {ticket.patientInfo.name}</div>}
                            {ticket.patientInfo.age && <div><strong>Age:</strong> {ticket.patientInfo.age}</div>}
                            {ticket.patientInfo.condition && <div><strong>Condition:</strong> {ticket.patientInfo.condition}</div>}
                            {ticket.patientInfo.roomNumber && <div><strong>Room:</strong> {ticket.patientInfo.roomNumber}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-center space-y-2 ml-4">
                    {/* FIX: Respond button shows lock icon when account is pending */}
                    <motion.button
                      {...actionHover}
                      onClick={() => openResponseModal(ticket)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                        isAccountPending
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'btn-primary'
                      }`}
                      title={isAccountPending ? 'Account not yet activated' : 'Respond to this request'}
                    >
                      {isAccountPending ? <Lock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                      <span>{isAccountPending ? 'Locked' : 'Respond'}</span>
                    </motion.button>
                    <div className="text-xs text-gray-400 text-center">
                      {ticket.responses?.length || 0} responses
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Response Modal */}
      <Modal isOpen={responseModal}
        onClose={() => { setResponseModal(false); setSelectedTicket(null); setResponseData({ message: '', availability: 'immediately', contactMethod: 'phone', additionalNotes: '' }); }}
        title="Respond to Emergency Request" size="lg">
        {selectedTicket && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center space-x-2 mb-2">
                {getTypeIcon(selectedTicket.type)}
                <h3 className="font-semibold text-gray-900">
                  {selectedTicket.type === 'blood' ? selectedTicket.bloodType : selectedTicket.organType} Request
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getUrgencyColor(selectedTicket.urgency)}`}>
                  {selectedTicket.urgency.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{selectedTicket.message}</p>
              <div className="text-xs text-gray-500">
                <strong>{selectedTicket.hospital?.hospitalName}</strong> • {selectedTicket.hospital?.address?.city}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Response Message *</label>
              <textarea className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                rows={4} placeholder="I can help with this donation. I am available..."
                value={responseData.message} onChange={(e) => setResponseData({ ...responseData, message: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 text-sm"
                  value={responseData.availability} onChange={(e) => setResponseData({ ...responseData, availability: e.target.value })}>
                  <option value="immediately">Immediately</option>
                  <option value="within_1_hour">Within 1 hour</option>
                  <option value="within_2_hours">Within 2 hours</option>
                  <option value="within_6_hours">Within 6 hours</option>
                  <option value="tomorrow">Tomorrow</option>
                  <option value="this_week">This week</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Contact</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 text-sm"
                  value={responseData.contactMethod} onChange={(e) => setResponseData({ ...responseData, contactMethod: e.target.value })}>
                  <option value="phone">Phone Call</option>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                  <option value="app">App Notification</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes (Optional)</label>
              <textarea className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 text-sm"
                rows={2} placeholder="Any additional information..."
                value={responseData.additionalNotes} onChange={(e) => setResponseData({ ...responseData, additionalNotes: e.target.value })} />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <motion.button {...actionHover}
                onClick={() => { setResponseModal(false); setSelectedTicket(null); setResponseData({ message: '', availability: 'immediately', contactMethod: 'phone', additionalNotes: '' }); }}
                className="btn-secondary">Cancel</motion.button>
              <motion.button {...actionHover} onClick={handleTicketResponse}
                disabled={!responseData.message.trim() || submitting}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50">
                {submitting ? <LoadingSpinner size="sm" /> : <><Send className="w-4 h-4" /><span>Send Response</span></>}
              </motion.button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DonorTickets;