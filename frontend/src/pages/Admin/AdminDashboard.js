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
    { refetchInterval: 30000 }
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

  // FIX: navigate with proper query params that AdminDonors/AdminTickets now actually reads
  const statCards = [
    { title: 'Total Hospitals', value: statistics?.totalHospitals || 0, icon: Building2, color: 'blue', change: '+12%', changeType: 'positive', to: '/admin/hospitals' },
    { title: 'Total Donors', value: statistics?.totalDonors || 0, icon: Users, color: 'green', change: '+8%', changeType: 'positive', to: '/admin/donors' },
    { title: 'Active Tickets', value: statistics?.activeTickets || 0, icon: Ticket, color: 'orange', change: '-5%', changeType: 'negative', to: '/admin/tickets?status=open' },
  ];

  const secondaryStats = [
    { title: 'Pending Donor Approvals', value: statistics?.pendingDonorApprovals || 0, icon: Clock, color: 'orange', to: '/admin/donors?status=pending' },
    { title: 'Total Appointments', value: statistics?.totalAppointments || 0, icon: Calendar, color: 'purple', to: '/admin/appointments' },
  ];

  const getColorClasses = (color) => {
    const colors = { blue: 'from-blue-500 to-blue-600', green: 'from-green-500 to-green-600', orange: 'from-orange-500 to-orange-600', purple: 'from-purple-500 to-purple-600' };
    return colors[color] || 'from-gray-500 to-gray-600';
  };

  const cardHover = {
    whileHover: { scale: 1.04, y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.10)' },
    whileTap: { scale: 0.97 },
    transition: { type: 'spring', stiffness: 300, damping: 20 }
  };

  const actionHover = {
    whileHover: { scale: 1.03, y: -2 },
    whileTap: { scale: 0.97 },
    transition: { type: 'spring', stiffness: 300, damping: 20 }
  };

  const rowHover = {
    whileHover: { backgroundColor: '#EFF6FF', x: 2 },
    transition: { duration: 0.15 }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening in your system.</p>
      </motion.div>

      {/* Primary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              {...cardHover}
              className="dashboard-card cursor-pointer"
              onClick={() => stat.to && navigate(stat.to)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="dashboard-label">{stat.title}</p>
                  <p className="dashboard-stat">{stat.value.toLocaleString()}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className={`w-4 h-4 mr-1 ${stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500'}`} />
                    <span className={`text-sm font-medium ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>{stat.change}</span>
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

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {secondaryStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              {...cardHover}
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
          className="card p-6">
          <div className="flex items-center justify-between mb-6">
            {/* FIX: Clickable section header */}
            <h2 onClick={() => navigate('/admin/tickets')}
              className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors">
              Recent Tickets
            </h2>
            <motion.div whileHover={{ rotate: 15, scale: 1.2 }} transition={{ type: 'spring', stiffness: 300 }}
              className="cursor-pointer" onClick={() => navigate('/admin/tickets')}>
              <Ticket className="w-6 h-6 text-gray-400" />
            </motion.div>
          </div>

          <div className="space-y-3">
            {recentActivity?.tickets?.length > 0 ? (
              recentActivity.tickets.map((ticket) => (
                // FIX: Each row is now clickable and has hover animation
                <motion.div key={ticket._id}
                  {...rowHover}
                  onClick={() => navigate('/admin/tickets')}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      ticket.urgency === 'critical' ? 'bg-red-500' :
                      ticket.urgency === 'high' ? 'bg-orange-500' :
                      ticket.urgency === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{ticket.hospital?.hospitalName}</p>
                      <p className="text-xs text-gray-500">{ticket.displayType} — {ticket.quantity} units</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(ticket.status, 'ticket')}`}>
                      {ticket.status}
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Ticket className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No recent tickets</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Appointments */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}
          className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 onClick={() => navigate('/admin/appointments')}
              className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors">
              Recent Appointments
            </h2>
            <motion.div whileHover={{ rotate: 15, scale: 1.2 }} transition={{ type: 'spring', stiffness: 300 }}
              className="cursor-pointer" onClick={() => navigate('/admin/appointments')}>
              <Calendar className="w-6 h-6 text-gray-400" />
            </motion.div>
          </div>

          <div className="space-y-3">
            {recentActivity?.appointments?.length > 0 ? (
              recentActivity.appointments.map((appointment) => (
                // FIX: Each row clickable
                <motion.div key={appointment._id}
                  {...rowHover}
                  onClick={() => navigate('/admin/appointments')}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      appointment.status === 'confirmed' ? 'bg-green-500' :
                      appointment.status === 'pending' ? 'bg-yellow-500' :
                      appointment.status === 'completed' ? 'bg-blue-500' : 'bg-gray-400'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {appointment.donor?.personalInfo?.firstName} {appointment.donor?.personalInfo?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {appointment.hospital?.hospitalName} — {appointment.displayType}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{new Date(appointment.scheduledDate).toLocaleDateString()}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(appointment.status, 'appointment')}`}>
                      {appointment.status}
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No recent appointments</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }}
        className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.button {...actionHover} onClick={() => navigate('/admin/hospitals')}
            className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-left">
            <Building2 className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-blue-900">Manage Hospitals</p>
              <p className="text-sm text-blue-700">Approve or reject registrations</p>
            </div>
          </motion.button>

          <motion.button {...actionHover} onClick={() => navigate('/admin/tickets')}
            className="flex items-center space-x-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors text-left">
            <Ticket className="w-6 h-6 text-orange-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-orange-900">Review Tickets</p>
              <p className="text-sm text-orange-700">Handle emergency requests</p>
            </div>
          </motion.button>

          <motion.button {...actionHover} onClick={() => navigate('/admin/analytics')}
            className="flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors text-left">
            <TrendingUp className="w-6 h-6 text-purple-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-purple-900">View Analytics</p>
              <p className="text-sm text-purple-700">System performance metrics</p>
            </div>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;