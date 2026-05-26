import React from 'react';
import { motion } from 'framer-motion';

const StatsCard = ({
  title,
  value,
  icon: Icon,
  color = 'blue',
  change,
  changeType = 'neutral',
  loading = false,
  className = '',
  onClick
}) => {
  const getColorClasses = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600',
      purple: 'from-purple-500 to-purple-600',
      red: 'from-red-500 to-red-600',
      yellow: 'from-yellow-500 to-yellow-600',
      gray: 'from-gray-500 to-gray-600',
    };
    return colors[color] || 'from-gray-500 to-gray-600';
  };

  if (loading) {
    return (
      <div className={`dashboard-card ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-24"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse mb-2 w-16"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    // FIX: motion.div here so whileHover/whileTap work when parent wraps in motion.div
    // onClick is passed directly so StatsCard works standalone OR wrapped
    <div
      className={`dashboard-card transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-lg' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="dashboard-label">{title}</p>
          <p className="dashboard-stat">
            {typeof value === 'number' ? value.toLocaleString() : value || '0'}
          </p>
          {change && (
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${
                changeType === 'positive' ? 'text-green-600' :
                changeType === 'negative' ? 'text-red-600' :
                'text-gray-500'
              }`}>
                {change}
              </span>
              {changeType !== 'neutral' && (
                <span className="text-sm text-gray-500 ml-1">from last month</span>
              )}
            </div>
          )}
        </div>
        <div className={`w-12 h-12 bg-gradient-to-r ${getColorClasses(color)} rounded-xl flex items-center justify-center flex-shrink-0`}>
          {Icon && <Icon className="w-6 h-6 text-white" />}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;