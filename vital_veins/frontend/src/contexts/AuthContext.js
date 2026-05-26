import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import api from '../services/api';

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null,
};

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

const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_TOKEN:
      return { ...state, token: action.payload };

    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
    case AUTH_ACTIONS.LOAD_USER_START:
      return { ...state, loading: true, error: null };

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
      return { ...state, user: action.payload, loading: false, error: null };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      localStorage.removeItem('token');
      return { ...state, user: null, token: null, loading: false, error: action.payload };

    case AUTH_ACTIONS.LOAD_USER_FAILURE:
      return { ...state, user: null, loading: false, error: action.payload };

    case AUTH_ACTIONS.LOGOUT:
      // FIX: Clear ALL storage keys on logout
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      return { ...state, user: null, token: null, loading: false, error: null };

    case AUTH_ACTIONS.UPDATE_USER:
      return { ...state, user: { ...state.user, ...action.payload } };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const loadUserTimeoutRef = useRef(null);
  const isLoadingUserRef = useRef(false);
  // FIX: Track if 401 interceptor has already triggered logout to prevent loops
  const isLoggingOutRef = useRef(false);

  // Load user on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: token });
      if (!isLoadingUserRef.current) {
        loadUser();
      }
    } else {
      dispatch({ type: AUTH_ACTIONS.LOAD_USER_FAILURE, payload: null });
    }
    return () => {
      if (loadUserTimeoutRef.current) clearTimeout(loadUserTimeoutRef.current);
    };
  }, []);

  // FIX: Axios interceptor to handle 401 token expiry automatically
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (
          error.response?.status === 401 &&
          !isLoggingOutRef.current &&
          // Don't intercept login/register endpoints
          !error.config?.url?.includes('/auth/login') &&
          !error.config?.url?.includes('/auth/register')
        ) {
          isLoggingOutRef.current = true;
          // Token expired — clear everything and redirect to login
          localStorage.removeItem('token');
          sessionStorage.clear();
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
          // Reset flag after redirect
          setTimeout(() => { isLoggingOutRef.current = false; }, 3000);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  // Set auth header whenever token changes
  useEffect(() => {
    if (state.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [state.token]);

  const loadUser = async () => {
    if (isLoadingUserRef.current) return;
    
    // Only load user if we have a token
    if (!state.token) {
      dispatch({ type: AUTH_ACTIONS.LOAD_USER_FAILURE, payload: null });
      return;
    }

    isLoadingUserRef.current = true;
    if (loadUserTimeoutRef.current) clearTimeout(loadUserTimeoutRef.current);

    try {
      dispatch({ type: AUTH_ACTIONS.LOAD_USER_START });
      const response = await api.get('/api/auth/me');
      dispatch({ type: AUTH_ACTIONS.LOAD_USER_SUCCESS, payload: response.data.user });
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.LOAD_USER_FAILURE, payload: null });
    } finally {
      loadUserTimeoutRef.current = setTimeout(() => {
        isLoadingUserRef.current = false;
      }, 2000);
    }
  };

  const login = async (credentials) => {
    if (isLoadingUserRef.current) {
      return { success: false, error: 'Too many requests. Please wait before trying again.' };
    }
    isLoadingUserRef.current = true;

    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      const response = await api.post('/api/auth/login', credentials);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user: response.data.user, token: response.data.token },
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      loadUserTimeoutRef.current = setTimeout(() => {
        isLoadingUserRef.current = false;
      }, 2000);
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.REGISTER_START });
      const response = await api.post('/api/auth/register', userData);

      // Only dispatch success if we got a token (not pending donors)
      if (response.data.token) {
        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS,
          payload: { user: response.data.user, token: response.data.token },
        });
      } else {
        // Donor pending approval - don't set token, just return success
        dispatch({ type: AUTH_ACTIONS.REGISTER_FAILURE, payload: null });
      }

      return { success: true, pendingApproval: response.data.pendingApproval };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({ type: AUTH_ACTIONS.REGISTER_FAILURE, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // FIX: Proper logout — clears token, headers, all storage
  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      // Logout silently even if API call fails
    } finally {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  const updateUser = (userData) => {
    dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: userData });
  };

  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const hasRole = (role) => state.user?.role === role;
  const hasAnyRole = (roles) => roles.includes(state.user?.role);
  const isVerified = () => state.user?.verified === true;

  // FIX: Helper to check if donor account is active (approved by admin)
  const isAccountActive = () => {
    if (!state.user) return false;
    if (state.user.role === 'admin') return true;
    if (state.user.role === 'hospital') return state.user.status !== 'pending';
    if (state.user.role === 'donor') return state.user.status === 'active';
    return false;
  };

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    updateUser,
    clearError,
    loadUser,
    hasRole,
    hasAnyRole,
    isVerified,
    isAccountActive,
    isAuthenticated: !!state.user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default AuthContext;