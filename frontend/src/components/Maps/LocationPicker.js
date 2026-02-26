import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const LocationPicker = ({ onLocationSelect, initialLocation = null, required = true }) => {
  const [location, setLocation] = useState(initialLocation || { latitude: null, longitude: null });
  const [mapCenter, setMapCenter] = useState({ lat: 28.7041, lng: 77.1025 }); // Default to Delhi
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [address, setAddress] = useState('');
  const mapRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''
  });

  useEffect(() => {
    if (location.latitude && location.longitude) {
      setMapCenter({ lat: parseFloat(location.latitude), lng: parseFloat(location.longitude) });
      // Reverse geocode to get address
      reverseGeocode(location.latitude, location.longitude);
    }
  }, [location]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude: latitude.toString(), longitude: longitude.toString() });
        setMapCenter({ lat: latitude, lng: longitude });
        onLocationSelect({ latitude, longitude });
        toast.success('Location captured successfully');
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Unable to get your location. Please allow location access.');
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const reverseGeocode = async (lat, lng) => {
    if (!window.google || !window.google.maps) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode(
      { location: { lat: parseFloat(lat), lng: parseFloat(lng) } },
      (results, status) => {
        if (status === 'OK' && results[0]) {
          setAddress(results[0].formatted_address);
        }
      }
    );
  };

  const handleMapClick = (e) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setLocation({ latitude: lat.toString(), longitude: lng.toString() });
    onLocationSelect({ latitude: lat, longitude: lng });
    toast.success('Location updated');
  };

  if (loadError) {
    return (
      <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Map Loading Error</h3>
            <p className="text-sm text-red-700">
              {process.env.REACT_APP_GOOGLE_MAPS_API_KEY
                ? 'Error loading Google Maps API'
                : 'Google Maps API key is not configured. Please contact support.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-80 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-2">
            <MapPin className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Location Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="space-y-3">
          {/* Current Location Display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Location
            </label>
            {location.latitude && location.longitude ? (
              <div className="bg-white rounded p-3 space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Latitude:</span> {location.latitude}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Longitude:</span> {location.longitude}
                </p>
                {address && (
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Address:</span> {address}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600 italic">
                {required ? '⚠️ Location is required' : 'No location selected'}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition"
            >
              <Navigation className="w-4 h-4" />
              <span>{isGettingLocation ? 'Getting location...' : 'Use Current Location'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="rounded-lg overflow-hidden border border-gray-200">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '400px' }}
          center={mapCenter}
          zoom={13}
          onClick={handleMapClick}
          options={{
            mapTypeControl: true,
            fullscreenControl: true,
            streetViewControl: false,
            zoomControl: true
          }}
          ref={mapRef}
        >
          {location.latitude && location.longitude && (
            <MarkerF
              position={{
                lat: parseFloat(location.latitude),
                lng: parseFloat(location.longitude)
              }}
              icon={{
                path: window.google?.maps?.SymbolPath?.CIRCLE,
                scale: 12,
                fillColor: '#2563eb',
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 3
              }}
              title="Selected Location"
            />
          )}
        </GoogleMap>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 space-y-2">
        <p className="font-semibold">📍 How to select your location:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          <li>Click the "Use Current Location" button to automatically detect your position</li>
          <li>Or click directly on the map to manually select your location</li>
          <li>Your coordinates will be updated automatically</li>
        </ul>
        {required && (
          <p className="text-red-600 font-semibold">* Location is mandatory for appointment booking</p>
        )}
      </div>
    </div>
  );
};

export default LocationPicker;
