import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { Ticket, Plus, AlertTriangle } from 'lucide-react';
import { hospitalAPI } from '../../services/api';
import DataTable from '../../components/UI/DataTable';
import TicketModal from '../../components/Hospital/TicketModal';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { formatDateTime, getStatusClasses } from '../../utils/helpers';

const HospitalTickets = () => {
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // Fetch tickets data
  const { data: ticketsData, isLoading, error } = useQuery(
    'hospital-tickets',
    () => hospitalAPI.getTickets().then(res => res.data),
    {
      refetchInterval: 30000,
    }
  );

  const ticketColumns = [
    {
      header: 'Type',
      accessor: 'type',
      render: (value, row) => (
        <div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            value === 'blood' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {value === 'blood' ? 'Blood' : 'Organ'}
          </span>
          <p className="text-sm text-gray-500 mt-1">
            {row.bloodType || row.organType} - {row.quantity} units
          </p>
        </div>
      )
    },
    {
      header: 'Urgency',
      accessor: 'urgency',
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(value, 'urgency')}`}>
          {value}
        </span>
      )
    },
    {
      header: 'Message',
      accessor: 'message',
      render: (value) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-900 truncate">{value || 'No message'}</p>
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
          {value}
        </span>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Emergency Tickets</h1>
          <p className="text-gray-600">Create and manage emergency blood and organ requests.</p>
        </div>
        <button
          onClick={() => setIsTicketModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Create Emergency Ticket</span>
        </button>
      </div>

      <DataTable
        data={ticketsData?.tickets || []}
        columns={ticketColumns}
        loading={isLoading}
        searchable
        filterable
      />

      {/* Emergency Ticket Modal */}
      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
      />
    </div>
  );
};

export default HospitalTickets;
