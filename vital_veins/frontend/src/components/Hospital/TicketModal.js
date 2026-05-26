import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Clock, 
  MessageSquare, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  User, 
  Heart, 
  Droplets, 
  Zap, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Info, 
  Bell, 
  Send,
  Plus,
  Minus,
  Target,
  Activity
} from 'lucide-react';
import { useMutation, useQueryClient } from 'react-query';
import { hospitalAPI, ticketsAPI } from '../../services/api';
import Modal from '../UI/Modal';
import LoadingSpinner from '../UI/LoadingSpinner';
import toast from 'react-hot-toast';

const TicketModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    type: 'blood',
    bloodType: '',
    organType: '',
    quantity: '',
    urgency: 'medium',
    message: '',
    contactPhone: '',
    contactEmail: '',
    patientName: '',
    patientAge: '',
    patientCondition: '',
    requiredBy: '',
    location: '',
    specialRequirements: '',
    priority: 'normal',
    notifyDonors: true,
    notifyAdmins: true,
    autoClose: false,
    estimatedDuration: '',
    bloodCompatibility: [],
    organCompatibility: []
  });

  const queryClient = useQueryClient();

  const createTicketMutation = useMutation(
    (data) => {
      // Transform data for backend API
      const apiData = {
        type: data.type,
        bloodType: data.type === 'blood' ? data.bloodType : undefined,
        organType: data.type === 'organ' ? data.organType : undefined,
        quantity: parseInt(data.quantity),
        urgency: data.urgency,
        priority: data.priority,
        message: data.message,
        patientInfo: {
          name: data.patientName,
          age: data.patientAge,
          condition: data.patientCondition,
          contactPhone: data.contactPhone,
          contactEmail: data.contactEmail
        },
        requirements: {
          requiredBy: data.requiredBy,
          location: data.location,
          specialRequirements: data.specialRequirements,
          estimatedDuration: data.estimatedDuration,
          bloodCompatibility: data.bloodCompatibility,
          organCompatibility: data.organCompatibility
        },
        notifications: {
          notifyDonors: data.notifyDonors,
          notifyAdmins: data.notifyAdmins,
          autoClose: data.autoClose
        }
      };
      // Use the tickets API endpoint for creating tickets
      return ticketsAPI.createTicket(apiData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('hospital-tickets');
        queryClient.invalidateQueries('hospital-dashboard');
        queryClient.invalidateQueries('admin-tickets');
        queryClient.invalidateQueries('donor-tickets');
        toast.success('Emergency ticket created successfully!');
        handleClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create ticket');
      }
    }
  );

  const handleClose = () => {
    setFormData({
      type: 'blood',
      bloodType: '',
      organType: '',
      quantity: '',
      urgency: 'medium',
      message: '',
      contactPhone: '',
      contactEmail: '',
      patientName: '',
      patientAge: '',
      patientCondition: '',
      requiredBy: '',
      location: '',
      specialRequirements: '',
      priority: 'normal',
      notifyDonors: true,
      notifyAdmins: true,
      autoClose: false,
      estimatedDuration: '',
      bloodCompatibility: [],
      organCompatibility: []
    });
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createTicketMutation.mutate(formData);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCompatibilityChange = (type, value) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].includes(value) 
        ? prev[type].filter(item => item !== value)
        : [...prev[type], value]
    }));
  };

  const urgencyOptions = [
    { value: 'low', label: 'Low', color: 'text-green-600', icon: '🟢', description: 'Can wait 24+ hours' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600', icon: '🟡', description: 'Needed within 12-24 hours' },
    { value: 'high', label: 'High', color: 'text-orange-600', icon: '🟠', description: 'Needed within 2-12 hours' },
    { value: 'critical', label: 'Critical', color: 'text-red-600', icon: '🔴', description: 'Needed immediately' }
  ];

  const priorityOptions = [
    { value: 'normal', label: 'Normal', color: 'text-blue-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-orange-600' },
    { value: 'emergency', label: 'Emergency', color: 'text-red-600' }
  ];

  const bloodCompatibilityOptions = [
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
  ];

  const organCompatibilityOptions = [
    'Heart', 'Liver', 'Kidney', 'Lung', 'Pancreas', 'Intestine', 'Cornea', 'Skin', 'Bone'
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Emergency Ticket"
      size="xl"
    >
      <div className="max-h-[80vh] overflow-y-auto pr-2">
        <div className="space-y-8">
        {/* Urgency Alert */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-medium text-red-800">Emergency Request</h3>
          </div>
          <p className="text-sm text-red-700 mt-1">
            This will create an emergency ticket that will be broadcast to nearby donors and administrators. 
            Please ensure all information is accurate before submitting.
          </p>
        </motion.div>

        <form id="ticket-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Request Type *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                formData.type === 'blood' 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="type"
                  value="blood"
                  checked={formData.type === 'blood'}
                  onChange={handleInputChange}
                  className="text-red-600 focus:ring-red-500"
                />
                <Droplets className="w-5 h-5 text-red-500" />
                <div>
                  <span className="text-sm font-medium text-gray-700">Blood</span>
                  <p className="text-xs text-gray-500">Blood transfusion needed</p>
                </div>
              </label>
              <label className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                formData.type === 'organ' 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="type"
                  value="organ"
                  checked={formData.type === 'organ'}
                  onChange={handleInputChange}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <Heart className="w-5 h-5 text-purple-500" />
                <div>
                  <span className="text-sm font-medium text-gray-700">Organ</span>
                  <p className="text-xs text-gray-500">Organ transplant needed</p>
                </div>
              </label>
            </div>
          </motion.div>

          {/* Subtype */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {formData.type === 'blood' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blood Type *
                </label>
                <select
                  name="bloodType"
                  value={formData.bloodType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
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
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organ Type *
                </label>
                <select
                  name="organType"
                  value={formData.organType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Organ Type</option>
                  <option value="Heart">Heart</option>
                  <option value="Liver">Liver</option>
                  <option value="Kidney">Kidney</option>
                  <option value="Lung">Lung</option>
                  <option value="Pancreas">Pancreas</option>
                  <option value="Intestine">Intestine</option>
                  <option value="Cornea">Cornea</option>
                  <option value="Skin">Skin</option>
                  <option value="Bone">Bone</option>
                </select>
              </div>
            )}
          </motion.div>

          {/* Patient Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-blue-50 p-4 rounded-lg"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-600" />
              <span>Patient Information</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Name
                </label>
                <input
                  type="text"
                  name="patientName"
                  value={formData.patientName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter patient name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  name="patientAge"
                  value={formData.patientAge}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Age"
                  min="0"
                  max="120"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <input
                  type="text"
                  name="patientCondition"
                  value={formData.patientCondition}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Medical condition"
                />
              </div>
            </div>
          </motion.div>

          {/* Quantity and Requirements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity Needed *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter quantity needed"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required By
              </label>
              <input
                type="datetime-local"
                name="requiredBy"
                value={formData.requiredBy}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </motion.div>

          {/* Urgency and Priority */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Urgency Level *
              </label>
              <div className="space-y-2">
                {urgencyOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.urgency === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="urgency"
                      value={option.value}
                      checked={formData.urgency === option.value}
                      onChange={handleInputChange}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-lg">{option.icon}</span>
                    <div>
                      <span className={`text-sm font-medium ${option.color}`}>
                        {option.label}
                      </span>
                      <p className="text-xs text-gray-500">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Priority Level
              </label>
              <div className="space-y-2">
                {priorityOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.priority === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={option.value}
                      checked={formData.priority === option.value}
                      onChange={handleInputChange}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm font-medium ${option.color}`}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Message and Requirements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-1" />
                Emergency Message *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the emergency situation and any specific requirements..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Requirements
              </label>
              <textarea
                name="specialRequirements"
                value={formData.specialRequirements}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any special handling, storage, or compatibility requirements..."
              />
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gray-50 p-4 rounded-lg"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Phone className="w-5 h-5 text-gray-600" />
              <span>Contact Information</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="contact@hospital.com"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Hospital location or specific department"
              />
            </div>
          </motion.div>

          {/* Notification Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-yellow-50 p-4 rounded-lg"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Bell className="w-5 h-5 text-yellow-600" />
              <span>Notification Settings</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="notifyDonors"
                  checked={formData.notifyDonors}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Notify Donors</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="notifyAdmins"
                  checked={formData.notifyAdmins}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Notify Administrators</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="autoClose"
                  checked={formData.autoClose}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Auto-close when filled</span>
              </label>
            </div>
          </motion.div>
        </form>
        </div>
      </div>

      {/* Fixed Submit Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-4">
        <div className="text-sm text-gray-500">
          <Info className="w-4 h-4 inline mr-1" />
          This ticket will be visible to all users in the system
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="ticket-form"
            disabled={createTicketMutation.isLoading}
            className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {createTicketMutation.isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>Create Emergency Ticket</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default TicketModal;
