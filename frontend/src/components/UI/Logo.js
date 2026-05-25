import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Logo = ({ size = 'medium', variant = 'full', clickable = true }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const sizeConfig = {
    small: { logoSize: 32, textSize: 'text-base', subtextSize: 'text-xs' },
    medium: { logoSize: 40, textSize: 'text-xl', subtextSize: 'text-sm' },
    large: { logoSize: 56, textSize: 'text-3xl', subtextSize: 'text-base' }
  };

  const config = sizeConfig[size] || sizeConfig.medium;
  const s = config.logoSize;

  const handleLogoClick = () => {
    if (!clickable) return;
    if (user) {
      navigate(`/${user.role}/dashboard`);
    } else {
      navigate('/');
    }
  };

  // The VitalVeins mark — red circle, white blood drop, ECG pulse line
  const LogoMark = ({ size: sz }) => (
    <svg width={sz} height={sz} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      {/* Red background circle */}
      <circle cx="32" cy="32" r="32" fill="#E8192C" />
      {/* Inner white circle */}
      <circle cx="32" cy="32" r="26" fill="white" />
      {/* Blood drop shape */}
      <path
        d="M32 12 C32 12 16 30 16 40 C16 50 23 57 32 57 C41 57 48 50 48 40 C48 30 32 12 32 12Z"
        fill="#E8192C"
      />
      {/* ECG / pulse line inside drop */}
      <path
        d="M20 40 L25 40 L28 30 L32 50 L36 36 L39 40 L44 40"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div
        onClick={handleLogoClick}
        className={clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
      >
        <LogoMark size={s} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={handleLogoClick}
      className={`flex items-center space-x-2.5 ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
    >
      <LogoMark size={s} />

      {variant === 'full' && (
        <div>
          <h1 className={`${config.textSize} font-bold leading-tight`}>
            <span style={{ color: '#E8192C', fontStyle: 'italic' }}>Vital</span>
            <span className="text-gray-900" style={{ fontStyle: 'italic' }}>Veins</span>
          </h1>
          <p className={`${config.subtextSize} text-gray-400 font-medium tracking-wide`}>
            Save Lives · Give Blood
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default Logo;