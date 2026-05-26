import React from 'react';
import Logo from '../UI/Logo';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  Settings,
  LogOut,
  Gift
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getNavigationItems = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
          { name: 'Hospitals', href: '/admin/hospitals', icon: Building2 },
          { name: 'Donors', href: '/admin/donors', icon: Users },
          { name: 'Appointments', href: '/admin/appointments', icon: Calendar },
          { name: 'Tickets', href: '/admin/tickets', icon: Ticket },
          { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
          { name: 'Rewards', href: '/admin/rewards', icon: Gift },
          { name: 'Profile', href: '/admin/profile', icon: User },
        ];
      case 'hospital':
        return [
          { name: 'Dashboard', href: '/hospital/dashboard', icon: LayoutDashboard },
          { name: 'Inventory', href: '/hospital/inventory', icon: Heart },
          { name: 'Tickets', href: '/hospital/tickets', icon: Ticket },
          { name: 'Appointments', href: '/hospital/appointments', icon: Calendar },
          { name: 'Donors', href: '/hospital/donors', icon: Users },
          { name: 'Profile', href: '/hospital/profile', icon: User },
        ];
      case 'donor':
        return [
          { name: 'Dashboard', href: '/donor/dashboard', icon: LayoutDashboard },
          { name: 'Hospitals', href: '/donor/hospitals', icon: MapPin },
          { name: 'Appointments', href: '/donor/appointments', icon: Calendar },
          { name: 'Emergency Tickets', href: '/donor/tickets', icon: Ticket },
          { name: 'Donation History', href: '/donor/history', icon: History },
          { name: 'Rewards', href: '/donor/rewards', icon: Gift },
          { name: 'Profile', href: '/donor/profile', icon: User },
        ];
      default:
        return [
          { name: 'Dashboard', href: `/${user?.role}/dashboard`, icon: LayoutDashboard },
          { name: 'Profile', href: `/${user?.role}/profile`, icon: User },
        ];
    }
  };

  const navigationItems = getNavigationItems();

  const getRoleAccent = () => {
    switch (user?.role) {
      case 'admin': return { gradient: 'from-rose-600 to-rose-700', light: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
      case 'hospital': return { gradient: 'from-blue-500 to-blue-600', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
      case 'donor': return { gradient: 'from-red-500 to-red-600', light: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
      default: return { gradient: 'from-gray-500 to-gray-600', light: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
    }
  };

  const getRoleDisplayName = () => {
    switch (user?.role) {
      case 'admin': return 'Administrator';
      case 'hospital': return 'Hospital';
      case 'donor': return 'Donor';
      default: return 'User';
    }
  };

  const accent = getRoleAccent();

  const handleLogout = async () => {
    if (onClose) onClose();
    await logout();
    navigate('/');
  };

  const handleSettingsClick = () => {
    navigate(`/${user?.role}/profile`);
    if (onClose) onClose();
  };

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="h-full flex flex-col bg-white border-r border-gray-100 shadow-xl"
    >
      {/* Header — Logo + Close button */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <Logo size="small" variant="full" clickable={true} />
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-100">
        <div className={`flex items-center space-x-3 p-3 rounded-xl ${accent.light} border ${accent.border}`}>
          <div className={`w-10 h-10 bg-gradient-to-r ${accent.gradient} rounded-full flex items-center justify-center flex-shrink-0 shadow`}>
            <span className="text-white font-bold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href ||
            (item.href !== `/${user?.role}/dashboard` && location.pathname.startsWith(item.href));

          return (
            <NavLink key={item.name} to={item.href} onClick={onClose}>
              {({ isActive: navActive }) => {
                const active = navActive || isActive;
                return (
                  <motion.div
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-150 group ${
                      active
                        ? `bg-gradient-to-r ${accent.gradient} text-white shadow-md`
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon
                      className={`flex-shrink-0 ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span className="text-sm font-medium">{item.name}</span>
                    {active && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70"
                      />
                    )}
                  </motion.div>
                );
              }}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 space-y-1">
        <motion.button
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSettingsClick}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
        >
          <Settings style={{ width: '18px', height: '18px' }} className="text-gray-400" />
          <span className="text-sm font-medium">Settings</span>
        </motion.button>

        <motion.button
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut style={{ width: '18px', height: '18px' }} />
          <span className="text-sm font-medium">Sign Out</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default Sidebar;