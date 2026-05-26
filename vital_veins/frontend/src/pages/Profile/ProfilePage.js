import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  User, 
  Save, 
  Edit, 
  Eye, 
  EyeOff,
  Bell, 
  Lock, 
  Settings,
  Key,
  Trash2,
  Ticket,
  Plus,
  AlertTriangle,
  Building2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Modal from '../../components/UI/Modal';
import toast from 'react-hot-toast';
import { adminAPI, hospitalAPI, donorAPI, authAPI, ticketsAPI } from '../../services/api';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    bloodType: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    preferences: {
      notifications: {
        email: true,
        sms: true,
        push: true
      },
      privacy: {
        profileVisibility: 'public',
        showDonationHistory: true,
        showLocation: false
      }
    }
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [ticketData, setTicketData] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    category: 'general'
  });

  const queryClient = useQueryClient();

  // Role-based dashboard stats
  const {
    data: roleStats,
    isLoading: statsLoading
  } = useQuery(
    ['profile-role-stats', user?.role],
    async () => {
      if (user?.role === 'admin') {
        const res = await adminAPI.getDashboard();
        return { role: 'admin', ...res.data };
      }
      if (user?.role === 'hospital') {
        const res = await hospitalAPI.getDashboard();
        return { role: 'hospital', ...res.data };
      }
      if (user?.role === 'donor') {
        const res = await donorAPI.getDashboard();
        return { role: 'donor', ...res.data };
      }
      return null;
    },
    { enabled: !!user?.role }
  );

  const theme = (() => {
    switch (user?.role) {
      case 'admin':
        return {
          gradient: 'from-rose-700 to-rose-900',
          chip: 'bg-rose-100 text-rose-800',
          accent: 'text-rose-200'
        };
      case 'hospital':
        return {
          gradient: 'from-blue-600 to-indigo-700',
          chip: 'bg-blue-100 text-blue-800',
          accent: 'text-blue-200'
        };
      case 'donor':
        return {
          gradient: 'from-red-600 to-rose-700',
          chip: 'bg-red-100 text-red-800',
          accent: 'text-red-200'
        };
      default:
        return {
          gradient: 'from-gray-600 to-gray-800',
          chip: 'bg-gray-100 text-gray-800',
          accent: 'text-gray-200'
        };
    }
  })();

  // Fetch user profile data
  const { data: profileData, isLoading, error } = useQuery(
    'user-profile',
    async () => {
      if (user?.role === 'admin') {
        const res = await adminAPI.getProfile();
        return res.data;
      }
      if (user?.role === 'hospital') {
        const res = await hospitalAPI.getProfile();
        return res.data;
      }
      if (user?.role === 'donor') {
        const res = await donorAPI.getProfile();
        return res.data;
      }
      // Fallback to auth profile if no role-specific endpoint
      const res = await authAPI.getProfile();
      return res.data;
    },
    {
      enabled: !!user,
      onSuccess: (data) => {
        // Handle the data based on role
        let profileData = data;
        if (data.donor) {
          // Donor profile data structure
          profileData = {
            ...data.donor.user,
            ...data.donor,
            personalInfo: data.donor.personalInfo,
            contact: data.donor.contact,
            address: data.donor.address,
            preferences: data.donor.preferences
          };
        } else if (data.hospital) {
          // Hospital profile data structure
          profileData = {
            ...data.hospital.user,
            ...data.hospital,
            contact: data.hospital.contact,
            address: data.hospital.address
          };
        } else if (data.admin) {
          // Admin profile data structure
          profileData = data.admin;
        }
        
        setFormData((prev) => ({
          ...prev,
          ...profileData,
          firstName: profileData.personalInfo?.firstName || profileData.name?.split(' ')[0] || '',
          lastName: profileData.personalInfo?.lastName || profileData.name?.split(' ')[1] || '',
          bloodType: profileData.personalInfo?.bloodType || prev.bloodType,
          dateOfBirth: profileData.personalInfo?.dateOfBirth || prev.dateOfBirth,
          address: {
            ...prev.address,
            ...(profileData?.address || {})
          },
          emergencyContact: {
            ...prev.emergencyContact,
            ...(profileData?.emergencyContact || {})
          },
          preferences: {
            ...prev.preferences,
            ...(profileData?.preferences || {}),
            notifications: {
              ...prev.preferences.notifications,
              ...(profileData?.preferences?.notifications || {})
            },
            privacy: {
              ...prev.preferences.privacy,
              ...(profileData?.preferences?.privacy || {})
            }
          }
        }));
      }
    }
  );

  // Update profile mutation
  const updateProfileMutation = useMutation(
    async (data) => {
      if (user?.role === 'admin') {
        const res = await adminAPI.updateProfile(data);
        return res.data;
      }
      if (user?.role === 'hospital') {
        const res = await hospitalAPI.updateProfile(data);
        return res.data;
      }
      if (user?.role === 'donor') {
        const res = await donorAPI.updateProfile(data);
        return res.data;
      }
      // Fallback to auth profile update
      const res = await authAPI.updateProfile(data);
      return res.data;
    },
    {
      onSuccess: (data) => {
        // Update the auth context with new user data
        if (data.user) {
          updateUser(data.user);
        } else if (data.donor) {
          // For donor, we might need to reconstruct the user object
          updateUser({
            ...user,
            ...data.donor,
            name: `${data.donor.personalInfo.firstName} ${data.donor.personalInfo.lastName}`
          });
        } else if (data.hospital) {
          // For hospital
          updateUser({
            ...user,
            ...data.hospital,
            name: data.hospital.hospitalName
          });
        }
        
        queryClient.invalidateQueries('user-profile');
        queryClient.invalidateQueries(['profile-role-stats', user?.role]);
        toast.success('Profile updated successfully');
        setIsEditing(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update profile');
      }
    }
  );

  // Change password mutation
  const changePasswordMutation = useMutation(
    (data) => authAPI.changePassword(data),
    {
      onSuccess: () => {
        toast.success('Password changed successfully');
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      },
      onError: (error) => {
        toast.error('Failed to change password');
      }
    }
  );

  // Delete account mutation
  const deleteAccountMutation = useMutation(
    async () => {
      await authAPI.logout();
      await logout();
    },
    {
      onSuccess: () => {
        toast.success('Account deleted successfully');
        navigate('/');
      },
      onError: (error) => {
        toast.error('Failed to delete account');
      }
    }
  );

  // Create ticket mutation
  const createTicketMutation = useMutation(
    (data) => ticketsAPI.createTicket(data),
    {
      onSuccess: () => {
        toast.success('Ticket created successfully');
        setShowTicketModal(false);
        setTicketData({ subject: '', description: '', priority: 'medium', category: 'general' });
      },
      onError: (error) => {
        toast.error('Failed to create ticket');
      }
    }
  );

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    changePasswordMutation.mutate(passwordData);
  };

  const handleDeleteAccount = () => {
    deleteAccountMutation.mutate();
  };

  const handleCreateTicket = () => {
    if (!ticketData.subject.trim() || !ticketData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    createTicketMutation.mutate(ticketData);
  };

  const getRoleSpecificFields = () => {
    switch (user?.role) {
      case 'donor':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Blood Type</label>
              <select
                value={formData.bloodType}
                onChange={(e) => handleInputChange('bloodType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!isEditing}
              >
                <option value="">Select Blood Type</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>
        );
      case 'hospital':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Name</label>
              <input
                type="text"
                value={formData.hospitalName || ''}
                onChange={(e) => handleInputChange('hospitalName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
              <input
                type="text"
                value={formData.license || ''}
                onChange={(e) => handleInputChange('license', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!isEditing}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Profile</h3>
        <p className="text-gray-600">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Profile Header Themed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`rounded-2xl overflow-hidden shadow-sm bg-gradient-to-r ${theme.gradient}`}
      >
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 flex items-center justify-center ring-2 ring-white/20">
                {user?.role === 'hospital' ? (
                  <Building2 className="w-9 h-9 text-white" />
                ) : (
                  <User className="w-9 h-9 text-white" />
                )}
              </div>
              {/* Floating Edit Icon */}
              <button
                onClick={() => setIsEditing(true)}
                className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-white text-gray-700 shadow hover:bg-gray-50"
                title="Edit profile"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{user?.name || user?.firstName || formData?.firstName || formData?.name || user?.email || 'User'}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${theme.chip}`}>{user?.role || 'user'}</span>
                {(user?.email || formData?.email) && <span className={`text-sm ${theme.accent}`}>{user?.email || formData?.email}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-white/90 text-gray-900 rounded-lg hover:bg-white shadow"
            >
              Edit Profile
            </button>
            <button
              onClick={async () => { await logout(); navigate('/'); }}
              className="px-4 py-2 bg-black/30 text-white rounded-lg hover:bg-black/40"
            >
              Logout
            </button>
          </div>
        </div>
        {/* Quick Stats */}
        <div className="bg-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 sm:p-6">
            {/* Loading skeletons */}
            {statsLoading && (
              <>
                {[0,1,2,3].map(i => (
                  <div key={i} className="backdrop-blur bg-white/10 rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-white/30 rounded w-1/2 mb-2"></div>
                    <div className="h-6 bg-white/40 rounded w-1/3"></div>
                  </div>
                ))}
              </>
            )}
            {user?.role === 'admin' && (
              <>
                <div className="backdrop-blur bg-white/10 rounded-xl p-4 text-white">
                  <p className="text-sm opacity-80">Hospitals</p>
                  <p className="text-2xl font-semibold">{roleStats?.statistics?.totalHospitals || 0}</p>
                </div>
                <div className="backdrop-blur bg-white/10 rounded-xl p-4 text-white">
                  <p className="text-sm opacity-80">Donors</p>
                  <p className="text-2xl font-semibold">{roleStats?.statistics?.totalDonors || 0}</p>
                </div>
                <div className="backdrop-blur bg-white/10 rounded-xl p-4 text-white">
                  <p className="text-sm opacity-80">Donations (30d)</p>
                  <p className="text-2xl font-semibold">{roleStats?.statistics?.donationsThisMonth || 0}</p>
                </div>
                <div className="backdrop-blur bg-white/10 rounded-xl p-4 text-white">
                  <p className="text-sm opacity-80">Pending Approvals</p>
                  <p className="text-2xl font-semibold">{roleStats?.statistics?.pendingHospitals || 0}</p>
                </div>
              </>
            )}
            {user?.role === 'hospital' && (
              <>
                <div className="backdrop-blur bg-white/10 rounded-xl p-4 text-white">
                  <p className="text-sm opacity-80">Appointments</p>
                  <p className="text-2xl font-semibold">{roleStats?.appointmentsCount || 0}</p>
                </div>
                <div className="backdrop-blur bg-white/10 rounded-xl p-4 text-white">
                  <p className="text-sm opacity-80">Active Tickets</p>
                  <p className="text-2xl font-semibold">{roleStats?.activeTickets || 0}</p>
                </div>
                <div className="backdrop-blur bg-white/10 rounded-xl p-4 text-white">
                  <p className="text-sm opacity-80">Blood Types</p>
                  <p className="text-2xl font-semibold">{roleStats?.inventorySummary?.bloodTypes || 0}</p>
                </div>
                <div className="backdrop-blur bg-white/10 rounded-xl p-4 text-white">
                  <p className="text-sm opacity-80">Organs</p>
                  <p className="text-2xl font-semibold">{roleStats?.inventorySummary?.organs || 0}</p>
                </div>
              </>
            )}
            {user?.role === 'donor' && (
              <>
                <div className="backdrop-blur bg-white/10 rounded-xl p-4 text-white">
                  <p className="text-sm opacity-80">Total Donations</p>
                  <p className="text-2xl font-semibold">{roleStats?.totals?.donations || 0}</p>
                </div>
                <div className="backdrop-blur bg-white/10 rounded-xl p-4 text-white">
                  <p className="text-sm opacity-80">Last Donation</p>
                  <p className="text-2xl font-semibold">{roleStats?.lastDonation ? new Date(roleStats.lastDonation).toLocaleDateString() : '—'}</p>
                </div>
                <div className="backdrop-blur bg-white/10 rounded-xl p-4 text-white">
                  <p className="text-sm opacity-80">Next Eligible</p>
                  <p className="text-2xl font-semibold">{roleStats?.nextEligible ? new Date(roleStats.nextEligible).toLocaleDateString() : '—'}</p>
                </div>
                <div className="backdrop-blur bg-white/10 rounded-xl p-4 text-white">
                  <p className="text-sm opacity-80">Appointments</p>
                  <p className="text-2xl font-semibold">{roleStats?.appointmentsCount || 0}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Recent Activity Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
        </div>
        {/* Admin activity from dashboard lists */}
        {user?.role === 'admin' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Latest Tickets</h3>
              <div className="space-y-2">
                {(roleStats?.recentActivity?.tickets || []).slice(0,5).map((t) => (
                  <div key={t._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">{t.hospital?.hospitalName}</p>
                      <p className="text-gray-600">{t.displayType} • {t.quantity} units</p>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
                {!roleStats?.recentActivity?.tickets?.length && (
                  <p className="text-sm text-gray-500">No recent tickets</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Latest Appointments</h3>
              <div className="space-y-2">
                {(roleStats?.recentActivity?.appointments || []).slice(0,5).map((a) => (
                  <div key={a._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">{a.hospital?.hospitalName}</p>
                      <p className="text-gray-600">{a.donor?.personalInfo?.firstName} {a.donor?.personalInfo?.lastName} • {a.displayType}</p>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
                {!roleStats?.recentActivity?.appointments?.length && (
                  <p className="text-sm text-gray-500">No recent appointments</p>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Hospital recent updates (fallback simple counters) */}
        {user?.role === 'hospital' && (
          <div className="grid md:grid-cols-3 gap-4">
            {['Pending Requests','Approved Requests','Completed Donations'].map((label, idx) => (
              <div key={label} className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{label}</p>
                <p className="text-2xl font-semibold text-gray-900">{idx === 0 ? (roleStats?.requests?.pending || 0) : idx === 1 ? (roleStats?.requests?.approved || 0) : (roleStats?.requests?.completed || 0)}</p>
              </div>
            ))}
          </div>
        )}
        {/* Donor donations list if available */}
        {user?.role === 'donor' && (
          <div className="space-y-2">
            {(roleStats?.recentDonations || []).slice(0,5).map((d, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{d.hospital?.hospitalName || 'Hospital'}</p>
                  <p className="text-gray-600">{d.type === 'blood' ? d.bloodType : d.organType} • {d.status}</p>
                </div>
                <span className="text-xs text-gray-500">{new Date(d.date || d.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
            {!roleStats?.recentDonations?.length && (
              <p className="text-sm text-gray-500">No recent donations</p>
            )}
          </div>
        )}
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
        <p className="text-gray-600">Manage your account information and preferences.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
      <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="card p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {user?.name || user?.firstName || user?.email || 'User'}
                </h3>
                <p className="text-sm text-gray-500 capitalize">{user?.role || 'user'}</p>
              </div>
            </div>

            <nav className="space-y-2">
              {[
                { id: 'personal', label: 'Personal Info', icon: User },
                { id: 'security', label: 'Security', icon: Lock },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'preferences', label: 'Preferences', icon: Settings }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Raise Ticket Button */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowTicketModal(true)}
                className="w-full flex items-center space-x-3 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Ticket className="w-5 h-5" />
                <span>Raise Ticket</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-3"
        >
          {activeTab === 'personal' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                <div className="flex items-center space-x-3">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={updateProfileMutation.isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                      >
                        {updateProfileMutation.isLoading ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                {/* Role-specific fields */}
                {getRoleSpecificFields()}

                {/* Address */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                      <input
                        type="text"
                        value={formData.address?.street || ''}
                        onChange={(e) => handleInputChange('address.street', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        value={formData.address?.city || ''}
                        onChange={(e) => handleInputChange('address.city', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                      <input
                        type="text"
                        value={formData.address?.state || ''}
                        onChange={(e) => handleInputChange('address.state', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                      <input
                        type="text"
                        value={formData.address?.zipCode || ''}
                        onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                      <input
                        type="text"
                        value={formData.address?.country || ''}
                        onChange={(e) => handleInputChange('address.country', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        value={formData.emergencyContact.name}
                        onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={formData.emergencyContact.phone}
                        onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                      <input
                        type="text"
                        value={formData.emergencyContact.relationship}
                        onChange={(e) => handleInputChange('emergencyContact.relationship', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Password</h3>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Password</p>
                      <p className="text-sm text-gray-600">Last changed 3 months ago</p>
                    </div>
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Key className="w-4 h-4" />
                      <span>Change Password</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Account</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.preferences.notifications.email}
                        onChange={(e) => handleInputChange('preferences.notifications.email', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-700">Receive email notifications</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">SMS Notifications</h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.preferences.notifications.sms}
                        onChange={(e) => handleInputChange('preferences.notifications.sms', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-700">Receive SMS notifications</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Push Notifications</h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.preferences.notifications.push}
                        onChange={(e) => handleInputChange('preferences.notifications.push', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-700">Receive push notifications</span>
                    </label>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSave}
                    disabled={updateProfileMutation.isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{updateProfileMutation.isLoading ? 'Saving...' : 'Save Preferences'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Privacy & Preferences</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Visibility</h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="profileVisibility"
                        value="public"
                        checked={formData.preferences.privacy.profileVisibility === 'public'}
                        onChange={(e) => handleInputChange('preferences.privacy.profileVisibility', e.target.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">Public - Visible to all users</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="profileVisibility"
                        value="private"
                        checked={formData.preferences.privacy.profileVisibility === 'private'}
                        onChange={(e) => handleInputChange('preferences.privacy.profileVisibility', e.target.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">Private - Only visible to you</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Sharing</h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.preferences.privacy.showDonationHistory}
                        onChange={(e) => handleInputChange('preferences.privacy.showDonationHistory', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-700">Show donation history in profile</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.preferences.privacy.showLocation}
                        onChange={(e) => handleInputChange('preferences.privacy.showLocation', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-700">Show location to nearby hospitals</span>
                    </label>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSave}
                    disabled={updateProfileMutation.isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{updateProfileMutation.isLoading ? 'Saving...' : 'Save Preferences'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePasswordChange}
              disabled={changePasswordMutation.isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {changePasswordMutation.isLoading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900 mb-1">Warning: This action cannot be undone</p>
                <p className="text-xs text-red-800">
                  Deleting your account will permanently remove all your data, including donation history, 
                  appointments, and preferences. This action cannot be reversed.
                </p>
              </div>
            </div>
          </div>

          <p className="text-gray-600">
            Are you sure you want to delete your account? This will permanently remove all your data.
          </p>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteAccountMutation.isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {deleteAccountMutation.isLoading ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Raise Ticket Modal */}
      <Modal
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        title="Raise Support Ticket"
        size="lg"
      >
        <div className="max-h-96 overflow-y-auto pr-2">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
              <input
                type="text"
                value={ticketData.subject}
                onChange={(e) => setTicketData({ ...ticketData, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of your issue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={ticketData.category}
                onChange={(e) => setTicketData({ ...ticketData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="general">General Support</option>
                <option value="technical">Technical Issue</option>
                <option value="billing">Billing Question</option>
                <option value="feature">Feature Request</option>
                <option value="bug">Bug Report</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={ticketData.priority}
                onChange={(e) => setTicketData({ ...ticketData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                value={ticketData.description}
                onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Please provide detailed information about your issue, including steps to reproduce if applicable..."
              />
            </div>
          </div>
        </div>

        {/* Fixed buttons at bottom */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-4">
          <button
            onClick={() => setShowTicketModal(false)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateTicket}
            disabled={createTicketMutation.isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            {createTicketMutation.isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Create Ticket</span>
              </>
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ProfilePage;
