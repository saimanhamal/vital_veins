import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, AlertCircle, CheckCircle, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_BASE = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL.replace(/\/+$/, '')}/api`
  : `${window.location.origin}/api`;
const DEFAULT_MAP_CENTER = [20, 0]; // World center, neutral starting point

const CustomMarker = ({ position, onMapClick }) => {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return position ? <Marker position={position} /> : null;
};

const LocationPicker = ({ onLocationSelect, initialLocation = null, required = true }) => {
  const [location, setLocation] = useState(initialLocation || { latitude: null, longitude: null });
  const [mapCenter, setMapCenter] = useState(DEFAULT_MAP_CENTER);
  const [mapZoom, setMapZoom] = useState(2); // World view
  const [isLoading, setIsLoading] = useState(false);
  const [accuracy, setAccuracy] = useState(null);
  const [address, setAddress] = useState('');
  const mapRef = useRef(null);

  // Get location from backend using Google Maps API
  const enrichLocation = useCallback(async (lat, lng, acc = null, alt = null) => {
    try {
      const response = await fetch(`${API_BASE}/location/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          ...(acc && { accuracy: acc }),
          ...(alt && { altitude: alt })
        })
      });

      if (!response.ok) {
        console.error('API response not ok:', response.status);
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Location API error:', error.message);
      // Return basic location without address if API fails
      return { 
        latitude: lat.toFixed(8), // 8 decimals = 1.1mm precision
        longitude: lng.toFixed(8), // 8 decimals = 1.1mm precision
        accuracy: acc ? Math.round(acc) : null,
        address: 'Location detected (address unavailable)',
        mapsPreviewUrl: `https://www.google.com/maps?q=${lat},${lng}&z=18`
      };
    }
  }, []);

  // Extract exact location using GPS
  const extractLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error('❌ Geolocation not supported on this device');
      return;
    }

    setIsLoading(true);
    console.log('🔍 Requesting GPS location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude, accuracy: gpsAccuracy, altitude } = position.coords;
          console.log(`📍 GPS received: ${latitude}, ${longitude} (±${gpsAccuracy}m)`);
          
          // Get address from backend
          const enriched = await enrichLocation(latitude, longitude, gpsAccuracy, altitude);
          
          setLocation({
            latitude: enriched.latitude,
            longitude: enriched.longitude,
            accuracy: enriched.accuracy
          });
          
          // Center map on actual location with proper zoom
          setMapCenter([latitude, longitude]);
          setMapZoom(15); // Street level zoom
          
          setAccuracy(enriched.accuracy);
          setAddress(enriched.address || 'Location found');
          
          onLocationSelect({
            latitude: enriched.latitude,
            longitude: enriched.longitude,
            accuracy: enriched.accuracy,
            address: enriched.address
          });

          toast.success(`✅ GPS Location Found (±${enriched.accuracy || '?'}m)`);
          setIsLoading(false);
        } catch (err) {
          console.error('Error processing position:', err);
          toast.error('❌ Failed to process location');
          setIsLoading(false);
        }
      },
      (error) => {
        const errorMessages = {
          1: '❌ Permission Denied - Enable location in browser settings',
          2: '❌ Location Unavailable - Try moving outdoors',
          3: '❌ Timeout - GPS took too long, try again'
        };
        const msg = errorMessages[error.code] || `❌ GPS Error (${error.code})`;
        console.error('Geolocation error:', error.message, error.code);
        toast.error(msg);
        setIsLoading(false);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 30000, // Longer timeout for GPS
        maximumAge: 0 // Always get fresh location
      }
    );
  }, [enrichLocation, onLocationSelect]);

  // Handle map click to select location
  const handleMapClick = async (latlng) => {
    console.log(`📍 Map clicked at: ${latlng.lat}, ${latlng.lng}`);
    setIsLoading(true);
    
    const enriched = await enrichLocation(latlng.lat, latlng.lng);
    
    setLocation({
      latitude: enriched.latitude,
      longitude: enriched.longitude
    });
    setMapCenter([latlng.lat, latlng.lng]);
    setMapZoom(15);
    setAccuracy(null);
    setAddress(enriched.address || 'Location selected');
    
    onLocationSelect({
      latitude: enriched.latitude,
      longitude: enriched.longitude,
      address: enriched.address
    });
    
    toast.success('✅ Location Selected from Map');
    setIsLoading(false);
  };

  // Don't auto-extract - let user click the button
  // This prevents unwanted GPS prompts on page load

  const markerPosition = location.latitude && location.longitude
    ? [parseFloat(location.latitude), parseFloat(location.longitude)]
    : null;

  return (
    <div className="w-full space-y-4">
      {/* Location Info Display */}
      <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-3">📍 Your Exact Location</label>
        
        {location.latitude && location.longitude ? (
          <div className="bg-white rounded p-3 space-y-3 border-2 border-green-400">
            {/* Success Header */}
            <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold text-green-700">✅ Location Confirmed</span>
            </div>
            
            {/* Super Precise Coordinates (8 decimals = 1.1mm accuracy) */}
            <div className="bg-gray-50 p-2 rounded font-mono text-xs space-y-1">
              <p className="text-gray-700"><span className="font-bold">Latitude:</span> {location.latitude}</p>
              <p className="text-gray-700"><span className="font-bold">Longitude:</span> {location.longitude}</p>
              <p className="text-gray-500 text-xs mt-1">Precision: ±1.1mm (8 decimal places)</p>
            </div>
            
            {/* GPS Accuracy Status */}
            {accuracy && (
              <div className={`p-2 rounded text-xs ${
                accuracy <= 10 
                  ? 'bg-green-100 border border-green-300' 
                  : accuracy <= 30
                  ? 'bg-yellow-100 border border-yellow-300'
                  : 'bg-red-100 border border-red-300'
              }`}>
                <p className={accuracy <= 10 ? 'text-green-700' : accuracy <= 30 ? 'text-yellow-700' : 'text-red-700'}>
                  <span className="font-bold">GPS Accuracy:</span> ±{accuracy}m
                  {accuracy <= 10 && ' ✅ EXCELLENT (within 10m)'}
                  {accuracy > 10 && accuracy <= 30 && ' ⚠️ GOOD'}
                  {accuracy > 30 && ' ⚠️ POOR - Try outdoors'}
                </p>
              </div>
            )}
            
            {/* Address */}
            {address && <p className="text-sm"><span className="font-bold">Address:</span> {address}</p>}
            
            {/* Google Maps Preview Button */}
            {location.latitude && location.longitude && (
              <a
                href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}&z=18`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block text-center bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition"
              >
                🔍 Verify Location in Google Maps
              </a>
            )}
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-300 rounded p-3 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-700 mt-0.5" />
            <p className="text-sm text-yellow-700">{required ? '⚠️ Location is required - Use GPS or click map' : 'No location selected'}</p>
          </div>
        )}

        <button
          onClick={extractLocation}
          disabled={isLoading}
          className="w-full mt-4 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition font-medium"
        >
          <Navigation className="w-4 h-4" />
          <span>{isLoading ? '⏳ Getting GPS Location...' : '🌍 Get My GPS Location'}</span>
        </button>
      </div>

      {/* Map Interface */}
      <div className="rounded-lg overflow-hidden border-2 border-gray-300 shadow-sm">
        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          style={{ width: '100%', height: '400px' }} 
          ref={mapRef}
          key={`map-${mapCenter[0]}-${mapCenter[1]}`}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap &copy; CartoDB'
            maxZoom={19}
          />
          <CustomMarker position={markerPosition} onMapClick={handleMapClick} />
        </MapContainer>
      </div>

      {/* Helper Instructions */}
      <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-2 border border-gray-200">
        <p className="font-semibold text-gray-800">💡 How to Get Super Precise Location:</p>
        <div className="space-y-2">
          <p className="text-gray-700"><span className="font-bold text-blue-600">Step 1:</span> Click "Get My GPS Location" to capture coordinates</p>
          <p className="text-gray-700"><span className="font-bold text-blue-600">Step 2:</span> Wait for GPS to get ±10m accuracy or better ✅</p>
          <p className="text-gray-700"><span className="font-bold text-blue-600">Step 3:</span> Click "Verify Location in Google Maps" to confirm exact spot</p>
          <p className="text-gray-600 text-xs mt-2">⚠️ For best accuracy: Stand outdoors with clear sky view for 30+ seconds</p>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
