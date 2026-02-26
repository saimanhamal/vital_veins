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
  Filter,
  Calendar,
  User,
  Building2,
  MessageSquare,
  Phone,
  RefreshCw,
  Eye,
  Send
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
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      let response;
      
      if (userLocation && filters.sortBy === 'distance') {
        response = await ticketsAPI.getNearbyTickets(
          userLocation.lat,
          userLocation.lng,
          {
            type: filters.type !== 'all' ? filters.type : undefined,
            urgency: filters.urgency !== 'all' ? filters.urgency : undefined,
            status: filters.status,
            search: filters.search || undefined
          }
        );
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
      console.error('Error fetching tickets:', error);
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
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTicketResponse = async () => {
    if (donorStatus && donorStatus !== 'active') {
      toast.error('Your account is not yet activated by admin. You cannot respond to tickets.');
      return;
    }
    if (!responseData.message.trim()) {
      toast.error('Please enter a response message');
      return;
    }

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
      console.error('Error sending response:', error);
      toast.error('Failed to send response');
    }
  };

  const openResponseModal = (ticket) => {
    setSelectedTicket(ticket);
    setResponseModal(true);
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

  const getTypeIcon = (type, bloodType, organType) => {
    if (type === 'blood') {
      return <Droplets className="w-5 h-5 text-red-500" />;
    }
    return <Heart className="w-5 h-5 text-purple-500" />;
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
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
      ticket.ticketId.toLowerCase().includes(filters.search.toLowerCase()) ||
      ticket.hospital?.hospitalName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      ticket.message?.toLowerCase().includes(filters.search.toLowerCase());
    
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Emergency Requests</h1>
          <p className="text-gray-600">Respond to urgent blood and organ needs in your area</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-primary flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="card p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tickets, hospitals..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
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

          {/* Urgency Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.urgency}
            onChange={(e) => handleFilterChange('urgency', e.target.value)}
          >
            <option value="all">All Urgency</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Status Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="all">All Status</option>
          </select>

          {/* Sort By */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <option value="createdAt">Latest</option>
            <option value="urgency">Urgency</option>
            <option value="expiresAt">Expiring Soon</option>
            {userLocation && <option value="distance">Distance</option>}
          </select>
        </div>
      </motion.div>

      {/* Tickets List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-4"
      >
        {filteredTickets.length === 0 ? (
          <div className="card p-8 text-center">
            <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Emergency Tickets</h3>
            <p className="text-gray-600">There are no emergency tickets matching your criteria at the moment.</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredTickets.map((ticket) => (
              <motion.div
                key={ticket._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="card p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      {getTypeIcon(ticket.type, ticket.bloodType, ticket.organType)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {ticket.type === 'blood' ? ticket.bloodType : ticket.organType}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUrgencyColor(ticket.urgency)}`}>
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {ticket.urgency.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">#{ticket.ticketId}</span>
                      </div>
                      
                      <p className="text-gray-700 mb-3 line-clamp-2">{ticket.message}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4" />
                          <span className="truncate">{ticket.hospital?.hospitalName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{ticket.hospital?.address?.city}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatTimeAgo(ticket.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Expires: {new Date(ticket.expiresAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {ticket.patientInfo && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-900">Patient Information</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                            {ticket.patientInfo.name && (
                              <div><strong>Name:</strong> {ticket.patientInfo.name}</div>
                            )}
                            {ticket.patientInfo.age && (
                              <div><strong>Age:</strong> {ticket.patientInfo.age}</div>
                            )}
                            {ticket.patientInfo.condition && (
                              <div><strong>Condition:</strong> {ticket.patientInfo.condition}</div>
                            )}
                            {ticket.patientInfo.roomNumber && (
                              <div><strong>Room:</strong> {ticket.patientInfo.roomNumber}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => openResponseModal(ticket)}
                      className="btn-primary flex items-center space-x-2 text-sm"
                    >
                      <Send className="w-4 h-4" />
                      <span>Respond</span>
                    </button>
                    <div className="text-xs text-gray-500 text-center">
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
      <Modal
        isOpen={responseModal}
        onClose={() => {
          setResponseModal(false);
          setSelectedTicket(null);
          setResponseData({ message: '', availability: 'immediately', contactMethod: 'phone', additionalNotes: '' });
        }}
        title="Respond to Emergency Request"
        size="lg"
      >
        {selectedTicket && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                {getTypeIcon(selectedTicket.type, selectedTicket.bloodType, selectedTicket.organType)}
                <h3 className="font-semibold">
                  {selectedTicket.type === 'blood' ? selectedTicket.bloodType : selectedTicket.organType} Request
                </h3>
                <span className={`px-2 py-1 rounded text-xs ${getUrgencyColor(selectedTicket.urgency)}`}>
                  {selectedTicket.urgency.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{selectedTicket.message}</p>
              <div className="text-xs text-gray-500">
                <strong>{selectedTicket.hospital?.hospitalName}</strong> • {selectedTicket.hospital?.address?.city}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Response Message *
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="I can help with this donation. I am available..."
                value={responseData.message}
                onChange={(e) => setResponseData({ ...responseData, message: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={responseData.availability}
                  onChange={(e) => setResponseData({ ...responseData, availability: e.target.value })}
                >
                  <option value="immediately">Immediately</option>
                  <option value="within_1_hour">Within 1 hour</option>
                  <option value="within_2_hours">Within 2 hours</option>
                  <option value="within_6_hours">Within 6 hours</option>
                  <option value="tomorrow">Tomorrow</option>
                  <option value="this_week">This week</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Contact Method
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={responseData.contactMethod}
                  onChange={(e) => setResponseData({ ...responseData, contactMethod: e.target.value })}
                >
                  <option value="phone">Phone Call</option>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                  <option value="app">App Notification</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Any additional information or requirements..."
                value={responseData.additionalNotes}
                onChange={(e) => setResponseData({ ...responseData, additionalNotes: e.target.value })}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  setResponseModal(false);
                  setSelectedTicket(null);
                  setResponseData({ message: '', availability: 'immediately', contactMethod: 'phone', additionalNotes: '' });
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleTicketResponse}
                className="btn-primary flex items-center space-x-2"
                disabled={!responseData.message.trim()}
              >
                <Send className="w-4 h-4" />
                <span>Send Response</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DonorTickets;
