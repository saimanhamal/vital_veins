import React from 'react';
import { motion } from 'framer-motion';

const Logo = ({ size = 'medium', variant = 'full' }) => {
  // Size configurations
  const sizeConfig = {
    small: {
      iconSize: 'w-6 h-6',
      logoSize: 'w-8 h-8',
      textSize: 'text-lg',
      subtextSize: 'text-xs'
    },
    medium: {
      iconSize: 'w-8 h-8',
      logoSize: 'w-10 h-10',
      textSize: 'text-xl',
      subtextSize: 'text-sm'
    },
    large: {
      iconSize: 'w-12 h-12',
      logoSize: 'w-16 h-16',
      textSize: 'text-3xl',
      subtextSize: 'text-base'
    }
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  // Logo icon - stylized heart with droplets
  const LogoIcon = () => (
    <svg
      viewBox="0 0 100 100"
      className={`${config.logoSize}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Heart with pulse effect */}
      <g>
        {/* Main heart shape */}
        <path
          d="M50 85C50 85 20 65 20 45C20 35 28 28 36 28C42 28 48 32 50 38C52 32 58 28 64 28C72 28 80 35 80 45C80 65 50 85 50 85Z"
          fill="url(#heartGradient)"
          strokeWidth="2"
          stroke="white"
        />
        
        {/* Blood drop on the side */}
        <ellipse cx="70" cy="35" rx="6" ry="8" fill="url(#dropletGradient)" />
        
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#ef4444', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#dc2626', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="dropletGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#fbbf24', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#f59e0b', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
      </g>
    </svg>
  );

  if (variant === 'icon') {
    return <LogoIcon />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center space-x-3"
    >
      <div className={`${config.logoSize} bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
        <LogoIcon />
      </div>
      {variant === 'full' && (
        <div>
          <h1 className={`${config.textSize} font-bold text-gray-900`}>
            <span className="text-red-600">Vital</span>
            <span className="text-blue-600">Veins</span>
          </h1>
          <p className={`${config.subtextSize} text-gray-500 font-medium`}>
            Smart Donation System
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default Logo;
