import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Ticket, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  X, 
  Eye, 
  MessageCircle,
  Building2,
  Heart,
  Search,
  Filter,
  Send,
  User
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import DataTable from '../../components/UI/DataTable';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Modal from '../../components/UI/Modal';
import { formatDateTime, getStatusClasses } from '../../utils/helpers';
import toast from 'react-hot-toast';

const AdminTickets = () => {
  const [filters, setFilters] = useState({
    status: 'all',
    urgency: 'all',
    type: 'all',
    search: ''
  });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  // Initialize filters from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const urgency = params.get('urgency');
    const type = params.get('type');
    const search = params.get('search');
    setFilters(prev => ({
      ...prev,
      status: status || prev.status,
      urgency: urgency || prev.urgency,
      type: type || prev.type,
      search: search || prev.search
    }));
  }, []);


  const queryClient = useQueryClient();

  // Fetch tickets
  const { data: ticketsData, isLoading, error } = useQuery(
    ['admin-tickets', filters, page, limit],
    () => adminAPI.getTickets({ 
      ...filters, 
      page, 
      limit,
      status: filters.status === 'all' ? undefined : filters.status,
      urgency: filters.urgency === 'all' ? undefined : filters.urgency,
      type: filters.type === 'all' ? undefined : filters.type
    }).then(res => res.data),
    {
      keepPreviousData: true,
      refetchInterval: 30000
    }
  );

  // Resolve ticket mutation
  const resolveTicketMutation = useMutation(
    ({ ticketId, notes }) => adminAPI.resolveTicket(ticketId, { notes }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-tickets']);
        queryClient.invalidateQueries(['admin-dashboard']);
        toast.success('Ticket resolved successfully');
        setIsResolveModalOpen(false);
        setSelectedTicket(null);
        setResolveNotes('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to resolve ticket');
      }
    }
  );

  // Assign ticket mutation
  const assignTicketMutation = useMutation(
    ({ ticketId, adminId }) => adminAPI.assignTicket(ticketId, { adminId }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-tickets']);
        toast.success('Ticket assigned successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to assign ticket');
      }
    }
  );

  const handleResolveTicket = (ticket) => {
    setSelectedTicket(ticket);
    setIsResolveModalOpen(true);
  };

  const confirmResolveTicket = () => {
    if (selectedTicket) {
      resolveTicketMutation.mutate({
        ticketId: selectedTicket._id,
        notes: resolveNotes
      });
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const columns = [
    {
      header: 'Ticket Info',
      accessor: 'ticketId',
      render: (value, row) => (
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Ticket className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-900 font-mono text-sm">{value}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-600">{row.hospital?.hospitalName}</span>
          </div>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
            row.type === 'blood' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {row.displayType || row.type}
          </span>
        </div>
      )
    },
    {
      header: 'Request Details',
      accessor: 'quantity',
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-900">
            {row.bloodType || row.organType} - {value} units
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {row.description || 'No additional details'}
          </p>
        </div>
      )
    },
    {
      header: 'Urgency',
      accessor: 'urgency',
      render: (value) => (
        <div className="flex items-center space-x-2">
          <AlertTriangle className={`w-4 h-4 ${
            value === 'critical' ? 'text-red-500' :
            value === 'high' ? 'text-orange-500' :
            value === 'medium' ? 'text-yellow-500' : 'text-green-500'
          }`} />
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getUrgencyColor(value)}`}>
            {value}
          </span>
        </div>
      )
    },
    {
      header: 'Created',
      accessor: 'createdAt',
      render: (value) => {
        const { date, time } = formatDateTime(value);
        return (
          <div>
            <p className="text-sm font-medium text-gray-900">{date}</p>
            <p className="text-sm text-gray-500">{time}</p>
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(value, 'ticket')}`}>
          {value.replace('_', ' ').toUpperCase()}
        </span>
      )
    },
    {
      header: 'Assigned To',
      accessor: 'assignedTo',
      render: (value) => (
        <div>
          {value?.admin ? (
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-900">{value.admin.name}</span>
            </div>
          ) : (
            <span className="text-sm text-gray-500 italic">Unassigned</span>
          )}
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedTicket(row);
              setIsDetailModalOpen(true);
            }}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          {row.status !== 'resolved' && (
            <button
              onClick={() => handleResolveTicket(row)}
              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
              title="Resolve Ticket"
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Tickets</h3>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Emergency Ticket Management</h1>
        <p className="text-gray-600">Review, assign, and resolve emergency blood and organ requests from hospitals.</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Tickets', value: ticketsData?.pagination?.total || 0, color: 'blue', icon: Ticket },
          { label: 'Open Tickets', value: ticketsData?.stats?.open || 0, color: 'red', icon: AlertTriangle },
          { label: 'In Progress', value: ticketsData?.stats?.inProgress || 0, color: 'yellow', icon: Clock },
          { label: 'Resolved Today', value: ticketsData?.stats?.resolvedToday || 0, color: 'green', icon: CheckCircle }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
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
                <Icon className={`w-8 h-8 text-${stat.color}-500`} />
              </div>
            </motion.div>
          );
        })}
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
              placeholder="Search by hospital name or ticket ID..."
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
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          
          <select
            value={filters.urgency}
            onChange={(e) => setFilters(prev => ({ ...prev, urgency: e.target.value }))}
            className="input"
          >
            <option value="all">All Urgency Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="input"
          >
            <option value="all">All Types</option>
            <option value="blood">Blood</option>
            <option value="organ">Organ</option>
          </select>
        </div>
      </motion.div>

      {/* Tickets Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Emergency Tickets</h2>
        </div>
        
        <DataTable
          data={ticketsData?.tickets || []}
          columns={columns}
          loading={isLoading}
          pagination={{
            current: page,
            total: ticketsData?.pagination?.pages || 1,
            onPageChange: setPage
          }}
        />
      </motion.div>

      {/* Ticket Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Ticket Details"
        size="lg"
      >
        {selectedTicket && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hospital Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Hospital Name</label>
                    <p className="text-gray-900">{selectedTicket.hospital?.hospitalName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Contact Email</label>
                    <p className="text-gray-900">{selectedTicket.hospital?.contact?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Contact Phone</label>
                    <p className="text-gray-900">{selectedTicket.hospital?.contact?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Address</label>
                    <p className="text-gray-900">
                      {selectedTicket.hospital?.address?.street}, {selectedTicket.hospital?.address?.city}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Ticket ID</label>
                    <p className="text-gray-900 font-mono">{selectedTicket.ticketId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Type</label>
                    <p className="text-gray-900">{selectedTicket.displayType || selectedTicket.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Requirement</label>
                    <p className="text-gray-900">
                      {selectedTicket.bloodType || selectedTicket.organType} - {selectedTicket.quantity} units
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Urgency</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getUrgencyColor(selectedTicket.urgency)}`}>
                      {selectedTicket.urgency}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(selectedTicket.status, 'ticket')}`}>
                      {selectedTicket.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Created</label>
                    <p className="text-gray-900">
                      {formatDateTime(selectedTicket.createdAt).date} at {formatDateTime(selectedTicket.createdAt).time}
                    </p>
                  </div>
                  {selectedTicket.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Description</label>
                      <p className="text-gray-900">{selectedTicket.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Resolve Ticket Modal */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title="Resolve Ticket"
      >
        {selectedTicket && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to resolve ticket <strong>{selectedTicket.ticketId}</strong> from{' '}
              <strong>{selectedTicket.hospital?.hospitalName}</strong>?
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution Notes (Optional)
              </label>
              <textarea
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                rows={3}
                className="input w-full"
                placeholder="Add any resolution notes or actions taken..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsResolveModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmResolveTicket}
                disabled={resolveTicketMutation.isLoading}
                className="btn btn-success"
              >
                {resolveTicketMutation.isLoading ? 'Resolving...' : 'Resolve Ticket'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminTickets;
