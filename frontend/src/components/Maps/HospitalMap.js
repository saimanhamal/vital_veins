import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const userIcon = L.divIcon({
  html: `<div style="background-color: #2563EB; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
  iconSize: [24, 24],
  className: 'custom-icon'
});

const hospitalIcon = L.divIcon({
  html: `<div style="background-color: #E8192C; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">🏥</div>`,
  iconSize: [28, 28],
  className: 'custom-icon'
});

const MapUpdater = ({ userLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (userLocation && map) {
      const lat = parseFloat(userLocation.latitude || userLocation.lat);
      const lng = parseFloat(userLocation.longitude || userLocation.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        map.setView([lat, lng], 13);
      }
    }
  }, [userLocation, map]);

  return null;
};

const HospitalMap = ({
  hospitals = [],
  userLocation,
  onHospitalSelect,
  defaultZoom = 13
}) => {
  const mapRef = useRef(null);
  const [selectedHospital, setSelectedHospital] = useState(null);

  const hospitalsArray = Array.isArray(hospitals) ? hospitals : [];

  // Extract coordinates safely from various formats
  const getCoordinates = (item) => {
    if (item.location?.coordinates && Array.isArray(item.location.coordinates)) {
      // GeoJSON format: [longitude, latitude]
      return {
        lat: parseFloat(item.location.coordinates[1]),
        lng: parseFloat(item.location.coordinates[0])
      };
    }
    if (item.lat && item.lng) {
      return { lat: parseFloat(item.lat), lng: parseFloat(item.lng) };
    }
    if (item.latitude && item.longitude) {
      return { lat: parseFloat(item.latitude), lng: parseFloat(item.longitude) };
    }
    return null;
  };

  const userCoords = userLocation ? getCoordinates(userLocation) : null;
  const center = userCoords 
    ? [userCoords.lat, userCoords.lng]
    : [27.7172, 85.3240]; // Kathmandu, Nepal

  // Calculate bounds to fit all hospitals and user
  const FitToBounds = ({ hospitals, userLocation }) => {
    const map = useMap();
    
    useEffect(() => {
      if (!map) return;
      
      const bounds = L.latLngBounds();
      let hasMarkers = false;
      
      if (userLocation) {
        const userCoords = getCoordinates(userLocation);
        if (userCoords && !isNaN(userCoords.lat) && !isNaN(userCoords.lng)) {
          bounds.extend([userCoords.lat, userCoords.lng]);
          hasMarkers = true;
        }
      }
      
      hospitalsArray.forEach((hospital) => {
        const coords = getCoordinates(hospital);
        if (coords && !isNaN(coords.lat) && !isNaN(coords.lng)) {
          bounds.extend([coords.lat, coords.lng]);
          hasMarkers = true;
        }
      });
      
      if (hasMarkers && bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }, [hospitals, userLocation, map]);
    
    return null;
  };

  const handleHospitalClick = (hospital) => {
    setSelectedHospital(hospital);
    if (onHospitalSelect) {
      onHospitalSelect(hospital);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={defaultZoom}
        style={{ width: '100%', height: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CartoDB</a>'
          maxZoom={19}
        />

        <MapUpdater userLocation={userLocation} />
        <FitToBounds hospitals={hospitalsArray} userLocation={userLocation} />

        {/* User Location Marker */}
        {userLocation && (() => {
          const coords = getCoordinates(userLocation);
          return coords && !isNaN(coords.lat) && !isNaN(coords.lng) ? (
            <Marker position={[coords.lat, coords.lng]} icon={userIcon}>
              <Popup>
                <div style={{ fontSize: '12px', fontWeight: 500 }}>
                  <strong>Your Location</strong>
                </div>
              </Popup>
            </Marker>
          ) : null;
        })()}

        {/* Hospital Markers */}
        {hospitalsArray.map((hospital, idx) => {
          const coords = getCoordinates(hospital);
          
          if (!coords || isNaN(coords.lat) || isNaN(coords.lng)) {
            console.warn(`Invalid coordinates for hospital ${idx}:`, hospital);
            return null;
          }

          const distance = hospital.distance
            ? typeof hospital.distance === 'number' && hospital.distance > 100
              ? (hospital.distance / 1000).toFixed(1)
              : parseFloat(hospital.distance).toFixed(1)
            : null;

          return (
            <Marker
              key={hospital._id || hospital.id || `hospital-${idx}`}
              position={[coords.lat, coords.lng]}
              icon={hospitalIcon}
              eventHandlers={{
                click: () => handleHospitalClick(hospital),
              }}
            >
              <Popup>
                <div style={{ width: '220px', fontSize: '13px' }}>
                  <div style={{ fontWeight: 700, marginBottom: '8px', color: '#1A1A1A' }}>
                    {hospital.hospitalName || 'Hospital'}
                  </div>
                  
                  {distance && (
                    <div style={{ color: '#E8192C', fontWeight: 600, marginBottom: '6px' }}>
                      📍 {distance} km away
                    </div>
                  )}
                  
                  {hospital.address && (
                    <div style={{ color: '#6B7280', fontSize: '12px', marginBottom: '6px' }}>
                      {[hospital.address.street, hospital.address.city, hospital.address.state]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  )}
                  
                  {hospital.contact?.phone && (
                    <div style={{ color: '#374151', fontSize: '12px', marginBottom: '4px' }}>
                      📞 {hospital.contact.phone}
                    </div>
                  )}
                  
                  {hospital.specialization && hospital.specialization.length > 0 && (
                    <div style={{ fontSize: '11px', color: '#6366F1', marginTop: '6px' }}>
                      {hospital.specialization.slice(0, 2).join(', ')}
                      {hospital.specialization.length > 2 && ` +${hospital.specialization.length - 2}`}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default HospitalMap;
