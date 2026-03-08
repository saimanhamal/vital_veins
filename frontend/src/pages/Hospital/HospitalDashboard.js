import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Calendar, 
  Ticket, 
  Users, 
  AlertTriangle,
  TrendingUp,
  Package,
  Clock,
  User
} from 'lucide-react';
import { hospitalAPI } from '../../services/api';
import StatsCard from '../../components/UI/StatsCard';
import DataTable from '../../components/UI/DataTable';
import TicketModal from '../../components/Hospital/TicketModal';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { formatDateTime, getStatusClasses } from '../../utils/helpers';

const HospitalDashboard = () => {
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch dashboard data
  const { data: dashboardData, isLoading, error } = useQuery(
    'hospital-dashboard',
    () => hospitalAPI.getDashboard().then(res => res.data),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Fetch recent appointments
  const { data: appointments } = useQuery(
    'hospital-appointments',
    () => hospitalAPI.getAppointments({ limit: 5 }).then(res => res.data),
    {
      refetchInterval: 30000,
    }
  );

  // Fetch recent tickets
  const { data: tickets } = useQuery(
    'hospital-tickets',
    () => hospitalAPI.getTickets({ limit: 5 }).then(res => res.data),
    {
      refetchInterval: 30000,
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-600">Please try refreshing the page.</p>
      </div>
    );
  }

  const { statistics } = dashboardData || {};

  const handleStatClick = (statTitle) => {
    if (statTitle === 'Total Appointments') {
      navigate('/hospital/appointments');
    }
  };

  const statCards = [
    {
      title: 'Blood Inventory',
      value: statistics?.bloodInventory || 0,
      icon: Heart,
      color: 'red',
      change: '+5%',
      changeType: 'positive'
    },
    {
      title: 'Total Appointments',
      value: statistics?.totalAppointments || 0,
      icon: Calendar,
      color: 'blue',
      change: '+12%',
      changeType: 'positive',
      onClick: () => handleStatClick('Total Appointments')
    },
    {
      title: 'Active Tickets',
      value: statistics?.activeTickets || 0,
      icon: Ticket,
      color: 'orange',
      change: '-3%',
      changeType: 'negative',
      onClick: () => navigate('/hospital/tickets')
    },
    {
      title: 'Total Donors',
      value: statistics?.totalDonors || 0,
      icon: Users,
      color: 'green',
      change: '+8%',
      changeType: 'positive'
    }
  ];

  const appointmentColumns = [
    {
      header: 'Donor',
      accessor: 'donorName',
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{row.donor?.contact?.email || 'N/A'}</p>
        </div>
      )
    },
    {
      header: 'Type',
      accessor: 'type',
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value === 'blood' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {value === 'blood' ? 'Blood' : 'Organ'}
        </span>
      )
    },
    {
      header: 'Date & Time',
      accessor: 'scheduledDate',
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
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(value, 'appointment')}`}>
          {value}
        </span>
      )
    }
  ];

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
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value === 'critical' ? 'bg-red-100 text-red-800' :
          value === 'high' ? 'bg-orange-100 text-orange-800' :
          value === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {value}
        </span>
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hospital Dashboard</h1>
        <p className="text-gray-600">Manage your hospital's donation operations and track real-time data.</p>
      </motion.div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <StatsCard
            key={stat.title}
            {...stat}
            loading={isLoading}
            className="delay-100"
          />
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="card p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => setIsTicketModalOpen(true)}
            className="flex items-center space-x-3 p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200"
          >
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div className="text-left">
              <p className="font-medium text-red-900">Create Emergency Ticket</p>
              <p className="text-sm text-red-700">Request urgent blood or organ</p>
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/hospital/inventory')}
            className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
          >
            <Package className="w-6 h-6 text-blue-600" />
            <div className="text-left">
              <p className="font-medium text-blue-900">Manage Inventory</p>
              <p className="text-sm text-blue-700">Update blood and organ stock</p>
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/hospital/appointments')}
            className="flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200"
          >
            <Calendar className="w-6 h-6 text-green-600" />
            <div className="text-left">
              <p className="font-medium text-green-900">View Appointments</p>
              <p className="text-sm text-green-700">Manage donor appointments</p>
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/hospital/profile')}
            className="flex items-center space-x-3 p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors duration-200"
          >
            <User className="w-6 h-6 text-indigo-600" />
            <div className="text-left">
              <p className="font-medium text-indigo-900">View Profile</p>
              <p className="text-sm text-indigo-700">Manage your account settings</p>
            </div>
          </button>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Appointments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Appointments</h2>
            <Calendar className="w-6 h-6 text-gray-400" />
          </div>
          
          <DataTable
            data={appointments?.appointments || []}
            columns={appointmentColumns}
            loading={!appointments}
            pagination={false}
            className="border-0 shadow-none"
          />
        </motion.div>

        {/* Recent Tickets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Tickets</h2>
            <Ticket className="w-6 h-6 text-gray-400" />
          </div>
          
          <DataTable
            data={tickets?.tickets || []}
            columns={ticketColumns}
            loading={!tickets}
            pagination={false}
            className="border-0 shadow-none"
          />
        </motion.div>
      </div>

      {/* Emergency Ticket Modal */}
      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
      />
    </div>
  );
};

export default HospitalDashboard;
