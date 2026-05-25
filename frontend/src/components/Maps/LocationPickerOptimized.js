import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CustomMarker = ({ position, onMapClick }) => {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return position ? <Marker position={position} /> : null;
};

const LocationPicker = ({ onLocationSelect, initialLocation = null, required = true }) => {
  const [location, setLocation] = useState(initialLocation || { latitude: null, longitude: null });
  const [mapCenter, setMapCenter] = useState([20, 0]); // World center, not Kathmandu
  const [mapZoom, setMapZoom] = useState(2); // World view
  const [isLoading, setIsLoading] = useState(false);
  const [accuracy, setAccuracy] = useState(null);
  const [address, setAddress] = useState('');
  const mapRef = useRef(null);

  // Enrich location with backend data (reverse geocoding, validation)
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

      if (!response.ok) throw new Error('Location validation failed');
      
      const enriched = await response.json();
      return enriched;
    } catch (error) {
      console.warn('Backend enrichment failed, using raw data:', error.message);
      return { 
        latitude: lat.toFixed(8), 
        longitude: lng.toFixed(8), 
        accuracy: acc ? Math.round(acc) : null,
        mapsPreviewUrl: `https://www.google.com/maps?q=${lat},${lng}&z=18`
      };
    }
  }, []);

  // Extract location using GPS
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
          
          // Enrich with address data from backend
          const enriched = await enrichLocation(latitude, longitude, gpsAccuracy, altitude);
          
          setLocation({
            latitude: enriched.latitude,
            longitude: enriched.longitude,
            accuracy: enriched.accuracy
          });
          setMapCenter([latitude, longitude]);
          setMapZoom(15);
          setAccuracy(enriched.accuracy);
          setAddress(enriched.address || 'Location detected');
          
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

  // Handle map click
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

  const markerPosition = location.latitude && location.longitude
    ? [parseFloat(location.latitude), parseFloat(location.longitude)]
    : null;

  return (
    <div className="w-full space-y-4">
      {/* Location Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Your Location</label>
          
          {location.latitude && location.longitude ? (
            <div className="bg-white rounded p-3 space-y-2 border-2 border-green-400">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">✅ Location Selected</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-2 rounded font-mono text-xs space-y-1">
                <p className="text-gray-700"><span className="font-semibold">Latitude:</span> {location.latitude}</p>
                <p className="text-gray-700"><span className="font-semibold">Longitude:</span> {location.longitude}</p>
              </div>
              
              {accuracy && (
                <div className={`p-2 rounded border text-xs ${
                  accuracy <= 10 
                    ? 'bg-green-100 border-green-300' 
                    : accuracy <= 30
                    ? 'bg-yellow-100 border-yellow-300'
                    : 'bg-red-100 border-red-300'
                }`}>
                  <p className={accuracy <= 10 ? 'text-green-700' : accuracy <= 30 ? 'text-yellow-700' : 'text-red-700'}>
                    <span className="font-semibold">GPS Accuracy:</span> ±{accuracy}m
                    {accuracy <= 10 && ' ✅ EXCELLENT'}
                  </p>
                </div>
              )}
              
              {address && <p className="text-sm text-gray-700"><span className="font-semibold">Address:</span> {address}</p>}
              
              {location.latitude && location.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}&z=18`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block text-center bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition"
                >
                  🔍 Verify in Google Maps
                </a>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-yellow-700 mt-0.5" />
              <p className="text-sm text-yellow-700">{required ? '⚠️ Location required' : 'No location selected'}</p>
            </div>
          )}

          {/* Buttons */}
          <button
            onClick={extractLocation}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition font-medium"
          >
            <Navigation className="w-4 h-4" />
            <span>{isLoading ? '⏳ Getting GPS Location...' : '🌍 Get My GPS Location'}</span>
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="rounded-lg overflow-hidden border border-gray-200">
        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          style={{ width: '100%', height: '400px' }} 
          ref={mapRef}
          key={`map-opt-${mapCenter[0]}-${mapCenter[1]}`}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap &copy; CartoDB'
            maxZoom={19}
          />
          <CustomMarker position={markerPosition} onMapClick={handleMapClick} />
        </MapContainer>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-3">
        <p className="font-semibold">📍 Select Your Location (2 Ways):</p>
        
        <div className="bg-white border-2 border-blue-400 rounded-lg p-3">
          <p className="font-semibold text-blue-700 mb-2">✅ Method 1: Click Extract Location</p>
          <ul className="list-disc list-inside text-gray-600 text-xs space-y-1">
            <li>Click "Extract Location" button</li>
            <li>Allow GPS permission when prompted</li>
            <li>Automatic reverse geocoding retrieves your address</li>
            <li>Most accurate - uses phone's GPS</li>
          </ul>
        </div>
        
        <div className="bg-white border border-blue-200 rounded-lg p-3">
          <p className="font-semibold text-blue-700 mb-2">🗺️ Method 2: Click on Map</p>
          <ul className="list-disc list-inside text-gray-600 text-xs space-y-1">
            <li>Click directly on the map at your location</li>
            <li>Pin appears automatically</li>
            <li>Works everywhere without GPS</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
