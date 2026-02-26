import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const PageSidebar = ({ isOpen, onClose, title, children }) => {
  return (
    <>
      {/* Sidebar */}
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: isOpen ? 0 : '100%', opacity: isOpen ? 1 : 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed inset-y-0 right-0 z-50 w-80 bg-white shadow-xl border-l border-gray-200 overflow-y-auto`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </motion.div>

      {/* Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
    </>
  );
};

export default PageSidebar;