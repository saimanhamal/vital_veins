import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Check, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { notificationsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const NotificationPanel = ({ onClose }) => {
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery(
    'notifications',
    () => notificationsAPI.getNotifications({ limit: 20 }).then(res => res.data.notifications),
    {
      refetchInterval: 30000,
    }
  );

  // Mark as read mutation
  const markAsReadMutation = useMutation(
    (id) => notificationsAPI.markAsRead(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications');
        queryClient.invalidateQueries('unread-notifications');
      },
    }
  );

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation(
    () => notificationsAPI.markAllAsRead(),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications');
        queryClient.invalidateQueries('unread-notifications');
        toast.success('All notifications marked as read');
      },
    }
  );

  // Delete notification mutation
  const deleteNotificationMutation = useMutation(
    (id) => notificationsAPI.deleteNotification(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications');
        queryClient.invalidateQueries('unread-notifications');
        toast.success('Notification deleted');
      },
    }
  );

  const handleMarkAsRead = (id) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (id) => {
    deleteNotificationMutation.mutate(id);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-200 bg-red-50';
      case 'high':
        return 'border-orange-200 bg-orange-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'emergency':
        return '🚨';
      default:
        return '📢';
    }
  };

  const unreadCount = notifications.filter(n => !n.recipients[0]?.read).length;

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="h-full bg-white/95 backdrop-blur-md border-l border-white/20 shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/20">
        <div className="flex items-center space-x-3">
          <Bell className="w-6 h-6 text-primary-600" />
          <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-medium">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Actions */}
      {unreadCount > 0 && (
        <div className="p-4 border-b border-white/20">
          <button
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Mark All Read</span>
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="spinner w-8 h-8 border-primary-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <Bell className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <AnimatePresence>
              {notifications.map((notification) => {
                const isRead = notification.recipients[0]?.read;
                
                return (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`p-4 rounded-xl border transition-all duration-200 ${
                      isRead 
                        ? 'bg-gray-50 border-gray-200' 
                        : `${getPriorityColor(notification.priority)} border-opacity-50`
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-lg">
                        {getCategoryIcon(notification.category)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className={`text-sm font-medium ${isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                            {notification.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {!isRead && (
                              <button
                                onClick={() => handleMarkAsRead(notification._id)}
                                className="p-1 rounded hover:bg-gray-200 transition-colors duration-200"
                              >
                                <Check className="w-4 h-4 text-gray-500" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(notification._id)}
                              className="p-1 rounded hover:bg-red-100 transition-colors duration-200"
                            >
                              <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" />
                            </button>
                          </div>
                        </div>
                        
                        <p className={`text-sm ${isRead ? 'text-gray-500' : 'text-gray-700'} mb-2`}>
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                          {notification.priority && (
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              notification.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              notification.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {notification.priority}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NotificationPanel;
