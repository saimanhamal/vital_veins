import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: {
          token: token,
        },
        transports: ['websocket', 'polling'],
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setConnected(true);
        
        // Join user-specific room
        newSocket.emit('join-room', `${user.role}_${user.id}`);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
      });

      // Notification event handlers
      newSocket.on('emergency_alert', (data) => {
        toast.error(`🚨 Emergency Alert: ${data.message}`, {
          duration: 8000,
          style: {
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
          },
        });
      });

      newSocket.on('new_ticket', (data) => {
        toast.info(`🎫 New Ticket: ${data.hospitalName} needs ${data.displayType}`, {
          duration: 6000,
        });
      });

      newSocket.on('new_appointment', (data) => {
        toast.success(`📅 New Appointment: ${data.donorName} booked for ${data.scheduledDate}`, {
          duration: 5000,
        });
      });

      newSocket.on('ticket_response', (data) => {
        toast.info(`💬 Response: ${data.donorName} responded to your ticket`, {
          duration: 5000,
        });
      });

      newSocket.on('hospital_status_update', (data) => {
        toast.success(`🏥 Status Update: ${data.message}`, {
          duration: 5000,
        });
      });

      newSocket.on('broadcast_notification', (data) => {
        toast.info(`📢 Broadcast: ${data.title}`, {
          duration: 6000,
        });
      });

      newSocket.on('appointment_confirmed', (data) => {
        toast.success(`✅ Appointment Confirmed: ${data.message}`, {
          duration: 5000,
        });
      });

      newSocket.on('appointment_cancelled', (data) => {
        toast.warning(`❌ Appointment Cancelled: ${data.message}`, {
          duration: 5000,
        });
      });

      newSocket.on('ticket_updated', (data) => {
        toast.info(`🔄 Ticket Updated: ${data.message}`, {
          duration: 5000,
        });
      });

      newSocket.on('ticket_resolved', (data) => {
        toast.success(`✅ Ticket Resolved: ${data.message}`, {
          duration: 5000,
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      // Clean up socket when user logs out
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [user, token]);

  // Socket utility functions
  const emitEvent = (event, data) => {
    if (socket && connected) {
      socket.emit(event, data);
    }
  };

  const joinRoom = (room) => {
    if (socket && connected) {
      socket.emit('join-room', room);
    }
  };

  const leaveRoom = (room) => {
    if (socket && connected) {
      socket.emit('leave-room', room);
    }
  };

  const value = {
    socket,
    connected,
    emitEvent,
    joinRoom,
    leaveRoom,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
