import React from 'react';
import { motion } from 'framer-motion';
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

  const showBackButton = user && !location.pathname.endsWith('/dashboard');

  const { data: unreadCount = 0 } = useQuery(
    'unread-notifications',
    () => notificationsAPI.getUnreadCount().then(res => res.data.unreadCount),
    { refetchInterval: 30000, enabled: !!user }
  );

  const handleGoBack = () => {
    if (window.history.length > 2) navigate(-1);
    else navigate(`/${user?.role}/dashboard`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'hospital': return 'Hospital';
      case 'donor': return 'Donor';
      default: return role;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'hospital': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'donor': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm"
    >
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        <div className="flex items-center space-x-3">
          {showBackButton && (
            <motion.button whileHover={{ scale: 1.1, x: -2 }} whileTap={{ scale: 0.95 }}
              onClick={handleGoBack} title="Go back"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-red-600">
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
          )}
          <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="hidden sm:block">
            <Logo size="small" variant="full" clickable={true} />
          </div>
          <div className="sm:hidden">
            <Logo size="small" variant="icon" clickable={true} />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-1.5">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-400'}`} />
            <span className="text-xs text-gray-400">{connected ? 'Live' : 'Offline'}</span>
          </div>

          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            onClick={onNotificationClick} className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 text-white text-xs rounded-full flex items-center justify-center font-bold"
                style={{ background: '#E8192C' }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </motion.button>

          <div className="hidden md:flex items-center space-x-2">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.name}</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(user?.role)}`}>
                {getRoleDisplayName(user?.role)}
              </span>
            </div>
          </div>

          <motion.button whileHover={{ scale: 1.05 }}
            onClick={() => navigate(`/${user?.role}/profile`)}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ background: 'linear-gradient(135deg, #E8192C, #C8102E)' }} title="View profile">
            <User className="w-4 h-4 text-white" />
          </motion.button>

          <motion.button whileHover={{ scale: 1.1, rotate: 15 }} whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/${user?.role}/profile`)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Settings">
            <Settings className="w-4 h-4 text-gray-500" />
          </motion.button>

          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            onClick={handleLogout} className="p-2 rounded-lg hover:bg-red-50 transition-colors" title="Sign out">
            <LogOut className="w-4 h-4 text-gray-500" />
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;