import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Ticket, 
  BarChart3,
  User,
  Heart,
  Calendar,
  MapPin,
  History,
  X,
  Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const getNavigationItems = () => {
    const baseItems = [
      {
        name: 'Dashboard',
        href: `/${user?.role}/dashboard`,
        icon: LayoutDashboard,
      },
      {
        name: 'Profile',
        href: `/${user?.role}/profile`,
        icon: User,
      },
    ];

    switch (user?.role) {
      case 'admin':
        return [
          ...baseItems,
          {
            name: 'Hospitals',
            href: '/admin/hospitals',
            icon: Building2,
          },
          {
            name: 'Donors',
            href: '/admin/donors',
            icon: Users,
          },
          {
            name: 'Tickets',
            href: '/admin/tickets',
            icon: Ticket,
          },
          {
            name: 'Analytics',
            href: '/admin/analytics',
            icon: BarChart3,
          },
        ];

      case 'hospital':
        return [
          ...baseItems,
          {
            name: 'Inventory',
            href: '/hospital/inventory',
            icon: Heart,
          },
          {
            name: 'Tickets',
            href: '/hospital/tickets',
            icon: Ticket,
          },
          {
            name: 'Appointments',
            href: '/hospital/appointments',
            icon: Calendar,
          },
          {
            name: 'Donors',
            href: '/hospital/donors',
            icon: Users,
          },
        ];

      case 'donor':
        return [
          ...baseItems,
          {
            name: 'Hospitals',
            href: '/donor/hospitals',
            icon: MapPin,
          },
          {
            name: 'Appointments',
            href: '/donor/appointments',
            icon: Calendar,
          },
          {
            name: 'Emergency Tickets',
            href: '/donor/tickets',
            icon: Ticket,
          },
          {
            name: 'Donation History',
            href: '/donor/history',
            icon: History,
          },
        ];

      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  const getRoleColor = () => {
    switch (user?.role) {
      case 'admin':
        return 'from-purple-500 to-purple-600';
      case 'hospital':
        return 'from-blue-500 to-blue-600';
      case 'donor':
        return 'from-green-500 to-green-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getRoleDisplayName = () => {
    switch (user?.role) {
      case 'admin':
        return 'Administrator';
      case 'hospital':
        return 'Hospital';
      case 'donor':
        return 'Donor';
      default:
        return 'User';
    }
  };

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="h-full bg-white/90 backdrop-blur-md border-r border-white/20 shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/20">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 bg-gradient-to-r ${getRoleColor()} rounded-xl flex items-center justify-center`}>
            <span className="text-white font-bold text-lg">Vv</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">VitalVeins</h2>
            <p className="text-xs text-gray-500">{getRoleDisplayName()} Panel</p>
          </div>
        </div>
        
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-lg">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-primary-600'
                }`
              }
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-primary-600'}`} />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/20">
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50">
          <Settings className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-600">Settings</span>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
