import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  Droplets, 
  Heart, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Filter,
  Search,
  Download,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  Calendar,
  Hash,
  Activity,
  Zap,
  Target,
  BarChart3,
  PieChart
} from 'lucide-react';
import { hospitalAPI } from '../../services/api';
import DataTable from '../UI/DataTable';
import Modal from '../UI/Modal';
import LoadingSpinner from '../UI/LoadingSpinner';
import StatsCard from '../UI/StatsCard';
import { formatDateTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

const InventoryManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showExpired, setShowExpired] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    type: 'blood',
    bloodType: '',
    organType: '',
    quantity: '',
    expiryDate: '',
    notes: '',
    source: 'donation',
    donorId: '',
    batchNumber: '',
    storageLocation: '',
    temperature: '',
    quality: 'excellent'
  });

  const queryClient = useQueryClient();

  // Fetch inventory data
  const { data: inventoryData, isLoading, error } = useQuery(
    ['hospital-inventory', currentPage, searchTerm, typeFilter, statusFilter, showExpired],
    () => hospitalAPI.getInventory({
      page: currentPage,
      limit: 10,
      search: searchTerm || undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      showExpired
    }).then(res => res.data),
    {
      refetchInterval: 30000,
      keepPreviousData: true,
      retry: 3,
      retryDelay: 1000
    }
  );

  // Add/Update inventory mutation
  const updateInventoryMutation = useMutation(
    (data) => {
      const apiData = {
        type: data.type,
        itemType: data.type === 'blood' ? data.bloodType : data.organType,
        quantity: parseInt(data.quantity),
        expiryDate: data.expiryDate,
        notes: data.notes,
        source: data.source,
        donorId: data.donorId,
        batchNumber: data.batchNumber,
        storageLocation: data.storageLocation,
        temperature: data.temperature,
        quality: data.quality
      };
      return hospitalAPI.updateInventory(apiData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('hospital-inventory');
        queryClient.invalidateQueries('hospital-dashboard');
        toast.success('Inventory updated successfully!');
        handleCloseModal();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update inventory');
      }
    }
  );

  // Delete inventory mutation
  const deleteInventoryMutation = useMutation(
    (id) => hospitalAPI.deleteInventoryItem(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('hospital-inventory');
        queryClient.invalidateQueries('hospital-dashboard');
        toast.success('Inventory item deleted successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete inventory item');
      }
    }
  );

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        type: item.type,
        bloodType: item.bloodType || '',
        organType: item.organType || '',
        quantity: item.quantity,
        expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
        notes: item.notes || '',
        source: item.source || 'donation',
        donorId: item.donorId || '',
        batchNumber: item.batchNumber || '',
        storageLocation: item.storageLocation || '',
        temperature: item.temperature || '',
        quality: item.quality || 'excellent'
      });
    } else {
      setEditingItem(null);
      setFormData({
        type: 'blood',
        bloodType: '',
        organType: '',
        quantity: '',
        expiryDate: '',
        notes: '',
        source: 'donation',
        donorId: '',
        batchNumber: '',
        storageLocation: '',
        temperature: '',
        quality: 'excellent'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({
      type: 'blood',
      bloodType: '',
      organType: '',
      quantity: '',
      expiryDate: '',
      notes: '',
      source: 'donation',
      donorId: '',
      batchNumber: '',
      storageLocation: '',
      temperature: '',
      quality: 'excellent'
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateInventoryMutation.mutate(formData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDelete = (item) => {
    if (window.confirm(`Are you sure you want to delete this ${item.type} inventory item?`)) {
      deleteInventoryMutation.mutate(item._id);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'low': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQualityColor = (quality) => {
    switch (quality) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    {
      header: 'Type',
      accessor: 'type',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          {value === 'blood' ? (
            <Droplets className="w-4 h-4 text-red-500" />
          ) : (
            <Heart className="w-4 h-4 text-purple-500" />
          )}
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            value === 'blood' ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'
        }`}>
          {value === 'blood' ? 'Blood' : 'Organ'}
        </span>
        </div>
      )
    },
    {
      header: 'Item',
      accessor: 'itemType',
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          {row.batchNumber && (
            <p className="text-xs text-gray-500">Batch: {row.batchNumber}</p>
          )}
        </div>
      )
    },
    {
      header: 'Quantity',
      accessor: 'quantity',
      render: (value, row) => (
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">units</p>
        </div>
      )
    },
    {
      header: 'Quality',
      accessor: 'quality',
      render: (quality) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getQualityColor(quality)}`}>
          {quality}
        </span>
      )
    },
    {
      header: 'Expiry',
      accessor: 'expiryDate',
      render: (value) => {
        if (!value) return <span className="text-gray-500">N/A</span>;
        const expiryDate = new Date(value);
        const today = new Date();
        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return (
          <div className="text-sm">
            <p className="text-gray-900">{expiryDate.toLocaleDateString()}</p>
            <p className={`text-xs ${
              diffDays < 0 ? 'text-red-600' :
              diffDays <= 7 ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {diffDays < 0 ? 'Expired' : `${diffDays} days left`}
            </p>
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (status) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
          {status}
        </span>
      )
    },
    {
      header: 'Location',
      accessor: 'storageLocation',
      render: (location) => (
        <div className="text-sm">
          <p className="text-gray-900">{location || 'N/A'}</p>
        </div>
      )
    }
  ];

  const actions = (row) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => handleOpenModal(row)}
        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleDelete(row)}
        disabled={deleteInventoryMutation.isLoading}
        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded disabled:opacity-50"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  // Calculate stats - ensure inventory is always an array
  const inventory = Array.isArray(inventoryData?.inventory) ? inventoryData.inventory : [];
  const totalItems = inventoryData?.pagination?.total || 0;
  const bloodCount = inventory.filter(item => item && item.type === 'blood').length;
  const organCount = inventory.filter(item => item && item.type === 'organ').length;
  const lowStockCount = inventory.filter(item => item && item.status === 'low').length;
  const expiredCount = inventory.filter(item => item && item.status === 'expired').length;

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Inventory</h3>
        <p className="text-gray-600">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
            <p className="text-gray-600">Manage your blood and organ inventory with real-time tracking.</p>
        </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => queryClient.invalidateQueries('hospital-inventory')}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
        <button
          onClick={() => handleOpenModal()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Item</span>
        </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total Items"
          value={totalItems}
          icon={Package}
          color="blue"
        />
        <StatsCard
          title="Blood Units"
          value={bloodCount}
          icon={Droplets}
          color="red"
        />
        <StatsCard
          title="Organ Units"
          value={organCount}
          icon={Heart}
          color="purple"
        />
        <StatsCard
          title="Low Stock"
          value={lowStockCount}
          icon={AlertTriangle}
          color="yellow"
        />
            </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search inventory..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Type Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="blood">Blood</option>
            <option value="organ">Organ</option>
          </select>

          {/* Status Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="low">Low Stock</option>
            <option value="expired">Expired</option>
            <option value="critical">Critical</option>
          </select>

          {/* Show Expired Toggle */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showExpired}
              onChange={(e) => setShowExpired(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show Expired</span>
          </label>
        </div>
      </motion.div>

      {/* Inventory Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200"
      >
        <DataTable
          data={inventory}
          columns={columns}
          loading={isLoading}
          actions={actions}
          pagination={inventoryData?.pagination}
          onPageChange={setCurrentPage}
        />
      </motion.div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="blood">Blood</option>
              <option value="organ">Organ</option>
            </select>
          </div>

            {/* Source */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source
              </label>
              <select
                name="source"
                value={formData.source}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="donation">Donation</option>
                <option value="purchase">Purchase</option>
                <option value="transfer">Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Item Type */}
          {formData.type === 'blood' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blood Type *
              </label>
              <select
                name="bloodType"
                value={formData.bloodType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter quantity"
              required
              min="1"
            />
          </div>

            {/* Quality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quality
              </label>
              <select
                name="quality"
                value={formData.quality}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date
            </label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

            {/* Batch Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch Number
              </label>
              <input
                type="text"
                name="batchNumber"
                value={formData.batchNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter batch number"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Storage Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Storage Location
              </label>
              <input
                type="text"
                name="storageLocation"
                value={formData.storageLocation}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Freezer A, Shelf 2"
              />
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Storage Temperature
              </label>
              <input
                type="text"
                name="temperature"
                value={formData.temperature}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., -20°C, 4°C"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes about this inventory item..."
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateInventoryMutation.isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              {updateInventoryMutation.isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>{editingItem ? 'Update Item' : 'Add Item'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InventoryManagement;
