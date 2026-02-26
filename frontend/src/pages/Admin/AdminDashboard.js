import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Ticket, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { formatDateTime, getStatusClasses } from '../../utils/helpers';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { data: dashboardData, isLoading, error } = useQuery(
    'admin-dashboard',
    () => adminAPI.getDashboard().then(res => res.data),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
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

  const { statistics, recentActivity } = dashboardData || {};

  const statCards = [
    {
      title: 'Total Hospitals',
      value: statistics?.totalHospitals || 0,
      icon: Building2,
      color: 'blue',
      change: '+12%',
      changeType: 'positive',
      to: '/admin/hospitals'
    },
    {
      title: 'Total Donors',
      value: statistics?.totalDonors || 0,
      icon: Users,
      color: 'green',
      change: '+8%',
      changeType: 'positive',
      to: '/admin/donors'
    },
    {
      title: 'Active Tickets',
      value: statistics?.activeTickets || 0,
      icon: Ticket,
      color: 'orange',
      change: '-5%',
      changeType: 'negative',
      to: '/admin/tickets?status=open'
    }
  ];

  // Additional small stats row
  const secondaryStats = [
    {
      title: 'Pending Donor Approvals',
      value: statistics?.pendingDonorApprovals || 0,
      icon: Clock,
      color: 'orange',
      change: '+0%',
      changeType: 'positive',
      to: '/admin/donors?status=pending'
    },
    {
      title: 'Total Appointments',
      value: statistics?.totalAppointments || 0,
      icon: Calendar,
      color: 'purple',
      change: '+0%',
      changeType: 'positive',
      to: '/admin/analytics'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600',
      purple: 'from-purple-500 to-purple-600',
    };
    return colors[color] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening in your system.</p>
      </motion.div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="dashboard-card cursor-pointer"
              onClick={() => stat.to && navigate(stat.to)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="dashboard-label">{stat.title}</p>
                  <p className="dashboard-stat">{stat.value.toLocaleString()}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className={`w-4 h-4 mr-1 ${
                      stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500'
                    }`} />
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">from last month</span>
                  </div>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-r ${getColorClasses(stat.color)} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Secondary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {secondaryStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="dashboard-card cursor-pointer"
              onClick={() => stat.to && navigate(stat.to)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="dashboard-label">{stat.title}</p>
                  <p className="dashboard-stat">{stat.value.toLocaleString()}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-r ${getColorClasses(stat.color)} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Tickets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Tickets</h2>
            <Ticket className="w-6 h-6 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {recentActivity?.tickets?.length > 0 ? (
              recentActivity.tickets.map((ticket, index) => (
                <div key={ticket._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      ticket.urgency === 'critical' ? 'bg-red-500' :
                      ticket.urgency === 'high' ? 'bg-orange-500' :
                      ticket.urgency === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">{ticket.hospital?.hospitalName}</p>
                      <p className="text-sm text-gray-600">{ticket.displayType} - {ticket.quantity} units</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses(ticket.status, 'ticket')}`}>
                      {ticket.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Ticket className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No recent tickets</p>
              </div>
            )}
          </div>
        </motion.div>

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
          
          <div className="space-y-4">
            {recentActivity?.appointments?.length > 0 ? (
              recentActivity.appointments.map((appointment, index) => (
                <div key={appointment._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      appointment.status === 'confirmed' ? 'bg-green-500' :
                      appointment.status === 'pending' ? 'bg-yellow-500' :
                      appointment.status === 'completed' ? 'bg-blue-500' : 'bg-gray-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">
                        {appointment.donor?.personalInfo?.firstName} {appointment.donor?.personalInfo?.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {appointment.hospital?.hospitalName} - {appointment.displayType}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(appointment.scheduledDate).toLocaleDateString()}
                    </p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses(appointment.status, 'appointment')}`}>
                      {appointment.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No recent appointments</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="card p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => navigate('/admin/hospitals')}
            className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
          >
            <Building2 className="w-6 h-6 text-blue-600" />
            <div className="text-left">
              <p className="font-medium text-blue-900">Manage Hospitals</p>
              <p className="text-sm text-blue-700">Approve or reject registrations</p>
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/admin/tickets')}
            className="flex items-center space-x-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors duration-200"
          >
            <Ticket className="w-6 h-6 text-orange-600" />
            <div className="text-left">
              <p className="font-medium text-orange-900">Review Tickets</p>
              <p className="text-sm text-orange-700">Handle emergency requests</p>
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/admin/analytics')}
            className="flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200"
          >
            <TrendingUp className="w-6 h-6 text-purple-600" />
            <div className="text-left">
              <p className="font-medium text-purple-900">View Analytics</p>
              <p className="text-sm text-purple-700">System performance metrics</p>
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
