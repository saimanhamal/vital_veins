import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Menu, User, LogOut, Settings, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { notificationsAPI } from '../../services/api';
import { useQuery } from 'react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '../UI/Logo';

const Header = ({ onMenuClick, onNotificationClick }) => {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [isHovering, setIsHovering] = useState(false);

  // Determine if back button should be shown (not on dashboard)
  const showBackButton = user && !location.pathname.endsWith('/dashboard');

  // Fetch unread notification count
  const { data: unreadCount = 0 } = useQuery(
    'unread-notifications',
    () => notificationsAPI.getUnreadCount().then(res => res.data.unreadCount),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      enabled: !!user,
    }
  );

  const handleLogout = async () => {
    await logout();
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'hospital':
        return 'Hospital';
      case 'donor':
        return 'Donor';
      default:
        return role;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'hospital':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'donor':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg"
    >
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Back Button */}
          {showBackButton && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 button-hover text-gray-600 hover:text-primary-600"
              title="Go back to previous page"
            >
              <ArrowLeft className="w-6 h-6" />
            </motion.button>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 button-hover"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>

          {/* Logo/Brand */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden sm:block"
          >
            <Logo size="small" variant="full" />
          </motion.div>
          
          {/* Mobile Logo Icon Only */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="sm:hidden"
          >
            <Logo size="small" variant="icon" />
          </motion.div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="hidden sm:flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNotificationClick}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 button-hover"
          >
            <Bell className="w-6 h-6 text-gray-600" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium pulse-on-hover"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </motion.button>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            {/* User Info */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(user?.role)}`}>
                  {getRoleDisplayName(user?.role)}
                </span>
              </div>
            </div>

            {/* User Avatar */}
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>

            {/* Settings & Logout */}
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => {
                  const role = user?.role || 'admin';
                  navigate(`/${role}/profile`);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
