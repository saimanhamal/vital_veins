import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Search, 
  Filter,
  Phone, 
  Mail, 
  Globe, 
  Clock,
  Star,
  Navigation,
  Building2,
  Heart,
  Droplets,
  Calendar,
  Info,
  RefreshCw,
  Eye,
  BookOpen,
  Users,
  Building,
  MapPinIcon,
  Map,
  List
} from 'lucide-react';
import { donorAPI, hospitalsAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import HospitalMap from '../../components/Maps/HospitalMap';
import LocationPicker from '../../components/Maps/LocationPicker';
import Modal from '../../components/UI/Modal';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const DonorHospitals = () => {
  const { user, token } = useAuth();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [filters, setFilters] = useState({
    search: '',
    specialization: 'all',
    status: 'approved',
    sortBy: 'distance', // Changed default to 'distance' for auto-recommendation
    radius: '50' // km
  });
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [bookingModal, setBookingModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [refreshing, setRefreshing] = useState(false);
  const [bookingData, setBookingData] = useState({
    type: 'blood',
    bloodType: 'A+',
    organType: 'Heart',
    preferredDate: '',
    preferredTime: '',
    notes: '',
    donorLocation: {
      lat: null,
      lng: null,
      address: ''
    }
  });
  const [donorStatus, setDonorStatus] = useState(null);

  // Get user location once on mount
  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    // fetch donor profile status
    const fetchProfile = async () => {
      try {
        const res = await donorAPI.getProfile();
        setDonorStatus(res.data.donor?.status || null);
      } catch (err) {
        setDonorStatus(null);
      }
    };
    if (user?.role === 'donor') fetchProfile();
  }, [user]);

  // Debounce hospital fetches when filters/location change
  const fetchDebounceRef = useRef(null);
  const isFetchingRef = useRef(false);
  useEffect(() => {
    if (fetchDebounceRef.current) {
      clearTimeout(fetchDebounceRef.current);
    }
    fetchDebounceRef.current = setTimeout(async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      await fetchHospitals();
      isFetchingRef.current = false;
    }, 300);
    return () => {
      if (fetchDebounceRef.current) {
        clearTimeout(fetchDebounceRef.current);
      }
    };
  }, [filters, userLocation]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationPermission('granted');
        },
        (error) => {
          console.log('Location access denied:', error);
          setLocationPermission('denied');
        }
      );
    } else {
      setLocationPermission('unavailable');
    }
  };

  const requestLocationPermission = () => {
    setLocationPermission('prompt');
    getUserLocation();
  };

  const fetchNearbyHospitals = async () => {
    if (!userLocation) {
      toast.error('Please enable location access to find nearby hospitals');
      getUserLocation();
      return;
    }

    try {
      setLoading(true);
      const maxDistance = parseInt(filters.radius) * 1000; // Convert km to meters
      const response = await hospitalsAPI.getNearbyHospitals(
        userLocation.lng,
        userLocation.lat,
        maxDistance
      );
      setHospitals(response.data.hospitals || []);
      if (response.data.hospitals.length === 0) {
        toast.info(`No hospitals found within ${filters.radius} km`);
      }
    } catch (error) {
      console.error('Error fetching nearby hospitals:', error);
      toast.error('Failed to find nearby hospitals');
    } finally {
      setLoading(false);
    }
  };

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      // If sortBy is 'distance' and we have location, fetch nearby hospitals
      if (filters.sortBy === 'distance' && userLocation) {
        await fetchNearbyHospitals();
        return;
      }

      // Otherwise search all hospitals
      const params = {
        search: filters.search || undefined,
        specialization: filters.specialization !== 'all' ? filters.specialization : undefined,
        city: undefined
      };

      const response = await hospitalsAPI.searchHospitals(params);
      let hospitalsList = response.data.hospitals || [];

      // Apply sorting
      if (filters.sortBy === 'name') {
        hospitalsList.sort((a, b) => a.hospitalName.localeCompare(b.hospitalName));
      } else if (filters.sortBy === 'rating' && userLocation) {
        hospitalsList.sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0));
      }

      setHospitals(hospitalsList);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      toast.error('Failed to fetch hospitals');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHospitals();
    setRefreshing(false);
    toast.success('Hospitals refreshed');
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const openDetailsModal = (hospital) => {
    setSelectedHospital(hospital);
    setDetailsModal(true);
  };

  const openBookingModal = (hospital) => {
    console.log('Opening booking modal for hospital:', hospital);
    setSelectedHospital(hospital);
    setBookingModal(true);
  };

  const handleBookAppointment = async () => {
    if (donorStatus && donorStatus !== 'active') {
      toast.error('Your account is not yet activated by admin. You cannot book appointments.');
      return;
    }
    console.log('Starting appointment booking...');
    console.log('User:', user);
    console.log('Token:', token ? 'Present' : 'Missing');
    console.log('Selected Hospital:', selectedHospital);
    console.log('Booking Data:', bookingData);

    if (!user || !token) {
      toast.error('Please login to book an appointment');
      return;
    }

    if (user.role !== 'donor') {
      toast.error('Only donors can book appointments');
      return;
    }

    if (!bookingData.preferredDate || !bookingData.preferredTime) {
      toast.error('Please select a preferred date and time');
      return;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(bookingData.preferredTime)) {
      toast.error('Please enter a valid time format (HH:MM)');
      return;
    }

    // Validate location
    if (!bookingData.donorLocation.lat || !bookingData.donorLocation.lng) {
      toast.error('Please set your location for the appointment');
      return;
    }

    // Validate hospital selection
    if (!selectedHospital) {
      toast.error('Please select a hospital');
      return;
    }

    const hospitalId = selectedHospital._id || selectedHospital.id;
    if (!hospitalId) {
      toast.error('Invalid hospital selection');
      return;
    }

    try {
      // Ensure date is in ISO format
      const scheduledDate = new Date(bookingData.preferredDate).toISOString();
      
      const appointmentData = {
        hospital: hospitalId,
        type: bookingData.type,
        scheduledDate: scheduledDate,
        scheduledTime: bookingData.preferredTime,
        donorLocation: bookingData.donorLocation
      };

      // Add type-specific fields
      if (bookingData.type === 'blood') {
        appointmentData.bloodType = bookingData.bloodType;
      } else if (bookingData.type === 'organ') {
        appointmentData.organType = bookingData.organType;
      }

      // Add notes if provided
      if (bookingData.notes) {
        appointmentData.notes = bookingData.notes;
      }

      console.log('Sending appointment data:', appointmentData);
      await donorAPI.bookAppointment(appointmentData);
      
      toast.success('Appointment request sent successfully!');
      setBookingModal(false);
      setBookingData({
        type: 'blood',
        bloodType: 'A+',
        organType: 'Heart',
        preferredDate: '',
        preferredTime: '',
        notes: '',
        donorLocation: {
          lat: null,
          lng: null,
          address: ''
        }
      });
    } catch (error) {
      console.error('Error booking appointment:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.data?.errors) {
        // Show specific validation errors
        error.response.data.errors.forEach(err => {
          toast.error(`${err.field}: ${err.message}`);
        });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to book appointment');
      }
    }
  };

  const calculateDistance = (hospital) => {
    if (!userLocation || !hospital.location?.coordinates) return null;
    
    const R = 6371; // Earth's radius in km
    const dLat = (hospital.location.coordinates[1] - userLocation.lat) * Math.PI / 180;
    const dLon = (hospital.location.coordinates[0] - userLocation.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(hospital.location.coordinates[1] * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getSpecializationIcon = (specialization) => {
    const icons = {
      'General': Building2,
      'Cardiology': Heart,
      'Emergency': Droplets,
      'Transplant': Heart,
      'default': Building2
    };
    const Icon = icons[specialization] || icons.default;
    return <Icon className="w-5 h-5" />;
  };

  const getWorkingHoursText = (workingHours) => {
    if (!workingHours) return '24/7';
    const today = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' });
    const todayHours = workingHours[today];
    if (!todayHours || todayHours.closed) return 'Closed today';
    return `${todayHours.open} - ${todayHours.close}`;
  };

  const filteredHospitals = hospitals.filter(hospital => {
    const matchesSearch = !filters.search || 
      hospital.hospitalName.toLowerCase().includes(filters.search.toLowerCase()) ||
      hospital.address?.city?.toLowerCase().includes(filters.search.toLowerCase()) ||
      hospital.specialization?.some(spec => spec.toLowerCase().includes(filters.search.toLowerCase()));
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nearby Hospitals</h1>
          <p className="text-gray-600">Find hospitals in your area for blood and organ donation</p>
        </div>
        <div className="flex space-x-3">
          {locationPermission === 'denied' && (
            <button
              onClick={requestLocationPermission}
              className="btn-secondary flex items-center space-x-2"
            >
              <Navigation className="w-4 h-4" />
              <span>Enable Location</span>
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-primary flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* Location Status */}
      {locationPermission !== 'granted' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2">
            <MapPinIcon className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                {locationPermission === 'denied' ? 'Location access denied' : 'Location unavailable'}
              </p>
              <p className="text-xs text-yellow-700">
                Enable location access to see nearby hospitals and accurate distances
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="card p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search hospitals, specializations..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>

          {/* Specialization Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.specialization}
            onChange={(e) => handleFilterChange('specialization', e.target.value)}
          >
            <option value="all">All Specializations</option>
            <option value="General">General</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Neurology">Neurology</option>
            <option value="Emergency">Emergency</option>
            <option value="Transplant">Transplant</option>
          </select>

          {/* Sort By */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <option value="name">Name</option>
            <option value="rating">Rating</option>
            {userLocation && <option value="distance">Distance</option>}
          </select>

          {/* Radius Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.radius}
            onChange={(e) => handleFilterChange('radius', e.target.value)}
            disabled={!userLocation}
          >
            <option value="10">10 km</option>
            <option value="25">25 km</option>
            <option value="50">50 km</option>
            <option value="100">100 km</option>
          </select>
        </div>
      </motion.div>

      {/* View Mode Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex items-center gap-2 mb-6"
      >
        <button
          onClick={() => setViewMode('list')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
            viewMode === 'list'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <List className="w-4 h-4" />
          <span>List View</span>
        </button>
        <button
          onClick={() => setViewMode('map')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
            viewMode === 'map'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Map className="w-4 h-4" />
          <span>Map View</span>
        </button>
      </motion.div>

      {/* Conditional View Rendering */}
      {viewMode === 'map' ? (
        /* Map View */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card overflow-hidden"
        >
          {userLocation ? (
            <HospitalMap
              hospitals={filteredHospitals}
              userLocation={userLocation}
              onHospitalSelect={openDetailsModal}
              defaultZoom={12}
            />
          ) : (
            <div className="p-8 text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Location Required</h3>
              <p className="text-gray-600 mb-4">
                Please enable location access to use the map view.
              </p>
              <button
                onClick={getUserLocation}
                className="btn-primary"
              >
                Enable Location
              </button>
            </div>
          )}
        </motion.div>
      ) : (
        /* List View */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          {/* Nearby Hospitals Info */}
          {filters.sortBy === 'distance' && userLocation && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-4 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-900">Hospitals Sorted by Distance</p>
                  <p className="text-sm text-green-700">Showing hospitals within {filters.radius} km of your location</p>
                </div>
              </div>
            </motion.div>
          )}

          {filteredHospitals.length === 0 ? (
            <div className="card p-8 text-center">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Hospitals Found</h3>
              <p className="text-gray-600">
                {filters.sortBy === 'distance' 
                  ? `No hospitals found within ${filters.radius} km. Try increasing the radius.`
                  : 'No hospitals found matching your search criteria.'}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredHospitals.map((hospital, index) => {
              const distance = calculateDistance(hospital);
              const isClosest = index === 0 && filters.sortBy === 'distance' && distance;
              return (
                <motion.div
                  key={hospital._id || hospital.id || `${hospital.hospitalName || 'hospital'}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`card p-6 hover:shadow-lg transition-all ${
                    isClosest ? 'border-2 border-green-500 shadow-lg' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0 relative">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          isClosest ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          <Building2 className={`w-6 h-6 ${isClosest ? 'text-green-600' : 'text-blue-600'}`} />
                        </div>
                        {isClosest && (
                          <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            Closest
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {hospital.hospitalName}
                          </h3>
                          <div className="flex items-center gap-2">
                            {hospital.rating?.average > 0 && (
                              <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                <span className="text-sm text-gray-700 font-medium">
                                  {hospital.rating.average.toFixed(1)} ({hospital.rating.count})
                                </span>
                              </div>
                            )}
                            {distance && (
                              <span className={`${
                                isClosest 
                                  ? 'bg-green-100 text-green-800 border-green-300' 
                                  : 'bg-blue-100 text-blue-800 border-blue-300'
                              } border px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1`}>
                                <Navigation className="w-4 h-4" />
                                {distance.toFixed(1)} km
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{hospital.fullAddress || `${hospital.address?.city}, ${hospital.address?.state}`}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4" />
                            <span>{hospital.contact?.phone}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>{getWorkingHoursText(hospital.workingHours)}</span>
                          </div>
                        </div>

                        {/* Specializations */}
                        {hospital.specialization && hospital.specialization.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {hospital.specialization.slice(0, 4).map((spec, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center space-x-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs"
                              >
                                {getSpecializationIcon(spec)}
                                <span>{spec}</span>
                              </span>
                            ))}
                            {hospital.specialization.length > 4 && (
                              <span className="text-xs text-gray-500 px-2 py-1">
                                +{hospital.specialization.length - 4} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Capacity Info */}
                        {hospital.capacity && (
                          <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                            <div className="text-center">
                              <div className="font-semibold text-gray-900">{hospital.capacity.beds || 0}</div>
                              <div>Total Beds</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-gray-900">{hospital.capacity.icuBeds || 0}</div>
                              <div>ICU Beds</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-gray-900">{hospital.capacity.operationRooms || 0}</div>
                              <div>OR Rooms</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => openDetailsModal(hospital)}
                        className="btn-secondary flex items-center space-x-2 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Details</span>
                      </button>
                      <button
                        onClick={() => openBookingModal(hospital)}
                        className="btn-primary flex items-center space-x-2 text-sm"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Book</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            </AnimatePresence>
          )}
        </motion.div>
      )}

      {/* Hospital Details Modal */}
      <Modal
        isOpen={detailsModal}
        onClose={() => {
          setDetailsModal(false);
          setSelectedHospital(null);
        }}
        title="Hospital Details"
        size="xl"
      >
        {selectedHospital && (
          <div className="space-y-6">
            {/* Hospital Header */}
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedHospital.hospitalName}</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  {selectedHospital.rating?.average > 0 && (
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span>{selectedHospital.rating.average.toFixed(1)} ({selectedHospital.rating.count} reviews)</span>
                    </div>
                  )}
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    {selectedHospital.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="font-medium">Address</div>
                    <div className="text-sm text-gray-600">
                      {selectedHospital.fullAddress || `${selectedHospital.address?.street}, ${selectedHospital.address?.city}, ${selectedHospital.address?.state} ${selectedHospital.address?.zipCode}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="font-medium">Phone</div>
                    <div className="text-sm text-gray-600">{selectedHospital.contact?.phone}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="font-medium">Email</div>
                    <div className="text-sm text-gray-600">{selectedHospital.contact?.email}</div>
                  </div>
                </div>
                {selectedHospital.contact?.website && (
                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="font-medium">Website</div>
                      <a 
                        href={selectedHospital.contact.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {selectedHospital.contact.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Specializations */}
            {selectedHospital.specialization && selectedHospital.specialization.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Specializations</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedHospital.specialization.map((spec, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm"
                    >
                      {getSpecializationIcon(spec)}
                      <span>{spec}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Capacity & Facilities */}
            {selectedHospital.capacity && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Capacity & Facilities</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{selectedHospital.capacity.beds || 0}</div>
                    <div className="text-sm text-gray-600">Total Beds</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{selectedHospital.capacity.icuBeds || 0}</div>
                    <div className="text-sm text-gray-600">ICU Beds</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{selectedHospital.capacity.operationRooms || 0}</div>
                    <div className="text-sm text-gray-600">Operating Rooms</div>
                  </div>
                </div>
              </div>
            )}

            {/* Blood Inventory */}
            {selectedHospital.inventory?.blood && selectedHospital.inventory.blood.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Blood Inventory</h3>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {selectedHospital.inventory.blood.map((blood, index) => (
                    <div key={index} className="text-center p-3 border rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        <Droplets className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="font-semibold text-sm">{blood.type}</div>
                      <div className="text-xs text-gray-600">{blood.quantity} units</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Working Hours */}
            {selectedHospital.workingHours && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Working Hours</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {Object.entries(selectedHospital.workingHours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between py-1">
                      <span className="capitalize font-medium">{day}</span>
                      <span className="text-gray-600">
                        {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  setDetailsModal(false);
                  setSelectedHospital(null);
                }}
                className="btn-secondary"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setDetailsModal(false);
                  setBookingModal(true);
                }}
                className="btn-primary flex items-center space-x-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Appointment</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Booking Modal */}
      <Modal
        isOpen={bookingModal}
        onClose={() => {
          setBookingModal(false);
          setSelectedHospital(null);
          setBookingData({
            type: 'blood',
            bloodType: 'A+',
            organType: 'Heart',
            preferredDate: '',
            preferredTime: '',
            notes: '',
            donorLocation: {
              lat: null,
              lng: null,
              address: ''
            }
          });
        }}
        title="Book Appointment"
        size="lg"
      >
        {selectedHospital ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Selected Hospital</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{selectedHospital.hospitalName}</h3>
              <p className="text-sm text-gray-600">{selectedHospital.address?.city}, {selectedHospital.address?.state}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Donation Type *
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={bookingData.type}
                  onChange={(e) => setBookingData({ ...bookingData, type: e.target.value })}
                >
                  <option value="blood">Blood Donation</option>
                  <option value="organ">Organ Donation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {bookingData.type === 'blood' ? 'Blood Type' : 'Organ Type'} *
                </label>
                {bookingData.type === 'blood' ? (
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={bookingData.bloodType}
                    onChange={(e) => setBookingData({ ...bookingData, bloodType: e.target.value })}
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                ) : (
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={bookingData.organType}
                    onChange={(e) => setBookingData({ ...bookingData, organType: e.target.value })}
                  >
                    <option value="Heart">Heart</option>
                    <option value="Liver">Liver</option>
                    <option value="Kidney">Kidney</option>
                    <option value="Lung">Lung</option>
                    <option value="Pancreas">Pancreas</option>
                    <option value="Cornea">Cornea</option>
                  </select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Date *
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={bookingData.preferredDate}
                  onChange={(e) => setBookingData({ ...bookingData, preferredDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Time *
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={bookingData.preferredTime}
                  onChange={(e) => setBookingData({ ...bookingData, preferredTime: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Location Selection for Appointment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Appointment Location <span className="text-red-500">*</span></span>
              </label>
              <p className="text-xs text-gray-600 mb-2">
                Please set your location for the appointment. This helps the hospital confirm your visit.
              </p>
              <LocationPicker
                onLocationSelect={(location) => {
                  const normalizedLocation = {
                    lat: location.lat !== undefined ? location.lat : location.latitude,
                    lng: location.lng !== undefined ? location.lng : location.longitude,
                    address: location.address || ''
                  };
                  setBookingData({ ...bookingData, donorLocation: normalizedLocation });
                }}
                initialLocation={bookingData.donorLocation.lat ? { lat: bookingData.donorLocation.lat, lng: bookingData.donorLocation.lng } : null}
                required={true}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Any special requirements or notes..."
                value={bookingData.notes}
                onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Important Notes:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>This is an appointment request. The hospital will confirm your slot.</li>
                    <li>Please arrive 15 minutes before your scheduled time.</li>
                    <li>Bring a valid ID and any required documents.</li>
                    <li>Ensure you meet all donation eligibility criteria.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  setBookingModal(false);
                  setSelectedHospital(null);
                  setBookingData({
                    type: 'blood',
                    bloodType: 'A+',
                    organType: 'Heart',
                    preferredDate: '',
                    preferredTime: '',
                    notes: ''
                  });
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleBookAppointment}
                className="btn-primary flex items-center space-x-2"
                disabled={!bookingData.preferredDate || !bookingData.preferredTime}
              >
                <Calendar className="w-4 h-4" />
                <span>Book Appointment</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Hospital Selected</h3>
            <p className="text-gray-600">Please select a hospital from the list to book an appointment.</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DonorHospitals;
