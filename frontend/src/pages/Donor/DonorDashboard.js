import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Calendar, 
  MapPin, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Bell,
  CheckCircle
} from 'lucide-react';
import { donorAPI } from '../../services/api';
import StatsCard from '../../components/UI/StatsCard';
import DataTable from '../../components/UI/DataTable';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { formatAddress, formatDateTime, getStatusClasses } from '../../utils/helpers';

const DonorDashboard = () => {
  const navigate = useNavigate();
  // Fetch dashboard data
  const { data: dashboardData, isLoading, error } = useQuery(
    'donor-dashboard',
    () => donorAPI.getDashboard().then(res => res.data),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Fetch upcoming appointments
  const { data: appointments } = useQuery(
    'donor-appointments',
    () => donorAPI.getAppointments({ status: 'upcoming', limit: 5 }).then(res => res.data),
    {
      refetchInterval: 30000,
    }
  );

  // Fetch nearby tickets/alerts
  const { data: nearbyTickets } = useQuery(
    'donor-nearby-tickets',
    () => donorAPI.getTickets({ nearby: true, limit: 5 }).then(res => res.data),
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

  const { statistics, nextEligibleDate } = dashboardData || {};

  // Calculate days until next eligible
  const getDaysUntilEligible = () => {
    if (!nextEligibleDate) return 'N/A';
    const today = new Date();
    const eligibleDate = new Date(nextEligibleDate);
    const diffTime = eligibleDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} days` : 'Eligible now!';
  };

  const statCards = [
    {
      title: 'Total Donations',
      value: statistics?.totalDonations || 0,
      icon: Heart,
      color: 'red',
      change: '+2',
      changeType: 'positive'
    },
    {
      title: 'Upcoming Appointments',
      value: statistics?.upcomingAppointments || 0,
      icon: Calendar,
      color: 'blue',
      change: '+1',
      changeType: 'positive'
    },
    {
      title: 'Nearby Hospitals',
      value: statistics?.nearbyHospitals || 0,
      icon: MapPin,
      color: 'green',
      change: '5',
      changeType: 'neutral'
    },
    {
      title: 'Next Eligible',
      value: getDaysUntilEligible(),
      icon: Clock,
      color: 'purple',
      change: null
    }
  ];

  const appointmentColumns = [
    {
      header: 'Hospital',
      accessor: 'hospitalName',
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">
{formatAddress(row.hospital?.address)}
          </p>
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
      header: 'Hospital',
      accessor: 'hospitalName',
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">
{formatAddress(row.hospital?.address)}
          </p>
        </div>
      )
    },
    {
      header: 'Request',
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
      header: 'Distance',
      accessor: 'distance',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value ? `${value} km` : 'N/A'}
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Donor Dashboard</h1>
        <p className="text-gray-600">Track your donations and find opportunities to help save lives.</p>
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
            onClick={() => navigate('/donor/appointments')}
            className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
          >
            <Calendar className="w-6 h-6 text-blue-600" />
            <div className="text-left">
              <p className="font-medium text-blue-900">Book Appointment</p>
              <p className="text-sm text-blue-700">Schedule your next donation</p>
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/donor/hospitals')}
            className="flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200"
          >
            <MapPin className="w-6 h-6 text-green-600" />
            <div className="text-left">
              <p className="font-medium text-green-900">Find Hospitals</p>
              <p className="text-sm text-green-700">Locate nearby donation centers</p>
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/donor/tickets')}
            className="flex items-center space-x-3 p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200"
          >
            <Bell className="w-6 h-6 text-red-600" />
            <div className="text-left">
              <p className="font-medium text-red-900">Emergency Alerts</p>
              <p className="text-sm text-red-700">View urgent requests</p>
            </div>
          </button>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upcoming Appointments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Upcoming Appointments</h2>
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

        {/* Nearby Emergency Requests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Nearby Emergency Requests</h2>
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          
          <DataTable
            data={nearbyTickets?.tickets || []}
            columns={ticketColumns}
            loading={!nearbyTickets}
            pagination={false}
            className="border-0 shadow-none"
          />
        </motion.div>
      </div>

      {/* Eligibility Status */}
      {nextEligibleDate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="card p-6"
        >
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">Donation Eligibility</h3>
              <p className="text-gray-600">
                {getDaysUntilEligible() === 'Eligible now!' 
                  ? "You're eligible to donate now! Book an appointment to help save lives."
                  : `You'll be eligible to donate in ${getDaysUntilEligible()}.`
                }
              </p>
            </div>
            {getDaysUntilEligible() === 'Eligible now!' && (
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200">
                Book Now
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DonorDashboard;
