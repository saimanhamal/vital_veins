import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import api from '../services/api';

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOAD_USER_START: 'LOAD_USER_START',
  LOAD_USER_SUCCESS: 'LOAD_USER_SUCCESS',
  LOAD_USER_FAILURE: 'LOAD_USER_FAILURE',
  SET_TOKEN: 'SET_TOKEN',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_TOKEN:
      return {
        ...state,
        token: action.payload,
      };
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
    case AUTH_ACTIONS.LOAD_USER_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOAD_USER_SUCCESS:
      return {
        ...state,
        user: action.payload,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      localStorage.removeItem('token');
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload,
      };

    case AUTH_ACTIONS.LOAD_USER_FAILURE:
      // Don't clear token on load failure - might be network issue
      return {
        ...state,
        user: null,
        loading: false,
        error: action.payload,
      };

    case AUTH_ACTIONS.LOGOUT:
      localStorage.removeItem('token');
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Context
const AuthContext = createContext();

// Provider
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const loadUserTimeoutRef = useRef(null);
  const isLoadingUserRef = useRef(false);

  // Load user on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: token });
      // Debounce loadUser calls to prevent 429 errors
      if (!isLoadingUserRef.current) {
        loadUser();
      }
    } else {
      dispatch({ type: AUTH_ACTIONS.LOAD_USER_FAILURE, payload: null });
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (loadUserTimeoutRef.current) {
        clearTimeout(loadUserTimeoutRef.current);
      }
    };
  }, []);

  // Set up axios interceptor for token
  useEffect(() => {
    if (state.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [state.token]);

  // Load user function with debounce to prevent 429 errors
  const loadUser = async () => {
    // If already loading, don't make another request
    if (isLoadingUserRef.current) {
      return;
    }
    
    // Set loading flag
    isLoadingUserRef.current = true;
    
    // Clear any existing timeout
    if (loadUserTimeoutRef.current) {
      clearTimeout(loadUserTimeoutRef.current);
    }
    
    try {
      dispatch({ type: AUTH_ACTIONS.LOAD_USER_START });
      const response = await api.get('/api/auth/me');
      dispatch({
        type: AUTH_ACTIONS.LOAD_USER_SUCCESS,
        payload: response.data.user,
      });
    } catch (error) {
      // Don't show error toast for failed user load on startup
      // This is expected when user is not logged in
      dispatch({
        type: AUTH_ACTIONS.LOAD_USER_FAILURE,
        payload: null, // Don't set error message for startup load
      });
    } finally {
      // Reset loading flag after a delay to prevent rapid successive calls
      loadUserTimeoutRef.current = setTimeout(() => {
        isLoadingUserRef.current = false;
      }, 2000); // 2 second cooldown before allowing another loadUser call
    }
  };

  // Login function with debounce protection
  const login = async (credentials) => {
    // If already loading user, don't allow login attempt
    if (isLoadingUserRef.current) {
      console.warn('⚠️ Too many login attempts');
      return { success: false, error: 'Too many requests. Please wait before trying again.' };
    }
    
    // Set loading flag
    isLoadingUserRef.current = true;
    
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      const response = await api.post('/api/auth/login', credentials);
      
      console.log('✅ Login successful:', response.data);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: response.data.user,
          token: response.data.token,
        },
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      const errorStatus = error.response?.status;
      
      console.error('❌ Login error:', errorMessage);
      console.error('📊 Error status:', errorStatus);
      console.log('📝 Full error response:', error.response?.data);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage,
      });
      
      return { success: false, error: errorMessage };
    } finally {
      // Reset loading flag after a delay
      loadUserTimeoutRef.current = setTimeout(() => {
        isLoadingUserRef.current = false;
      }, 2000); // 2 second cooldown
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.REGISTER_START });
      const response = await api.post('/api/auth/register', userData);
      
      console.log('✅ Registration successful:', response.data);
      
      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: {
          user: response.data.user,
          token: response.data.token,
        },
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      console.error('❌ Registration error:', errorMessage);
      console.error('Full error:', error);
      
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: errorMessage,
      });
      
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Update user function
  const updateUser = (userData) => {
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: userData,
    });
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return state.user?.role === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.includes(state.user?.role);
  };

  // Check if user is verified
  const isVerified = () => {
    return state.user?.verified === true;
  };

  const value = {
    // State
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    
    // Actions
    login,
    register,
    logout,
    updateUser,
    clearError,
    loadUser,
    
    // Utilities
    hasRole,
    hasAnyRole,
    isVerified,
    isAuthenticated: !!state.user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
