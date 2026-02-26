import React, { useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import LoadingSpinner from '../UI/LoadingSpinner';
import { MapPin, Phone, Globe, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const HospitalMap = ({ hospitals = [], userLocation, onHospitalSelect, defaultZoom = 12 }) => {
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [infoWindowOpen, setInfoWindowOpen] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''
  });

  const defaultCenter = userLocation
    ? { lat: parseFloat(userLocation.latitude), lng: parseFloat(userLocation.longitude) }
    : { lat: 28.7041, lng: 77.1025 }; // Default to Delhi, India

  const mapOptions = {
    zoom: defaultZoom,
    center: defaultCenter,
    mapTypeControl: true,
    fullscreenControl: true,
    streetsViewControl: false
  };

  const onMarkerClick = (hospital) => {
    setSelectedHospital(hospital);
    setInfoWindowOpen(hospital._id);
  };

  const onHospitalClick = (hospital) => {
    if (onHospitalSelect) {
      onHospitalSelect(hospital);
    }
    toast.success(`Selected: ${hospital.hospitalName}`);
  };

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Failed to load map</p>
          <p className="text-gray-600 text-sm">
            {process.env.REACT_APP_GOOGLE_MAPS_API_KEY 
              ? 'Error loading Google Maps API' 
              : 'Google Maps API key is not configured'}
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Loading map..." />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        options={mapOptions}
        defaultCenter={defaultCenter}
        defaultZoom={defaultZoom}
      >
        {/* User location marker */}
        {userLocation && (
          <MarkerF
            position={{
              lat: parseFloat(userLocation.latitude),
              lng: parseFloat(userLocation.longitude)
            }}
            icon={{
              path: window.google?.maps?.SymbolPath?.CIRCLE,
              scale: 8,
              fillColor: '#2563eb',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2
            }}
            title="Your Location"
          />
        )}

        {/* Hospital markers */}
        {hospitals.map((hospital) => (
          <React.Fragment key={hospital._id}>
            <MarkerF
              position={{
                lat: hospital.location.coordinates[1],
                lng: hospital.location.coordinates[0]
              }}
              onClick={() => onMarkerClick(hospital)}
              icon={{
                path: window.google?.maps?.SymbolPath?.CIRCLE,
                scale: 10,
                fillColor: '#ef4444',
                fillOpacity: 0.9,
                strokeColor: '#fff',
                strokeWeight: 2
              }}
              title={hospital.hospitalName}
            />

            {/* Info Window */}
            {infoWindowOpen === hospital._id && selectedHospital && (
              <InfoWindowF
                position={{
                  lat: hospital.location.coordinates[1],
                  lng: hospital.location.coordinates[0]
                }}
                onCloseClick={() => {
                  setInfoWindowOpen(null);
                  setSelectedHospital(null);
                }}
              >
                <div
                  className="bg-white rounded-lg shadow-lg p-4 max-w-xs cursor-pointer"
                  onClick={() => onHospitalClick(hospital)}
                >
                  <div className="space-y-3">
                    {/* Hospital Name */}
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">
                        {hospital.hospitalName}
                      </h3>
                      {hospital.distance && (
                        <p className="text-xs text-blue-600 font-semibold mt-1">
                          🎯 {hospital.distance} km away
                        </p>
                      )}
                    </div>

                    {/* Rating */}
                    {hospital.rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium text-gray-700">
                          {hospital.rating.average || 'N/A'} ({hospital.rating.count || 0} reviews)
                        </span>
                      </div>
                    )}

                    {/* Address */}
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-600">
                        {hospital.address?.street}, {hospital.address?.city}
                      </p>
                    </div>

                    {/* Contact */}
                    {hospital.contact?.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <p className="text-xs text-gray-600">{hospital.contact.phone}</p>
                      </div>
                    )}

                    {/* Website */}
                    {hospital.contact?.website && (
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <a
                          href={hospital.contact.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}

                    {/* Specializations */}
                    {hospital.specialization && hospital.specialization.length > 0 && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Specializations:</p>
                        <div className="flex flex-wrap gap-1">
                          {hospital.specialization.slice(0, 3).map((spec, idx) => (
                            <span
                              key={idx}
                              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Inventory Summary */}
                    {hospital.inventory && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Available:</p>
                        <div className="space-y-1">
                          {hospital.inventory.blood && hospital.inventory.blood.length > 0 && (
                            <p className="text-xs text-gray-600">
                              🩸 {hospital.inventory.blood.length} blood types
                            </p>
                          )}
                          {hospital.inventory.organs && hospital.inventory.organs.length > 0 && (
                            <p className="text-xs text-gray-600">
                              🫀 {hospital.inventory.organs.length} organ types
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      onClick={() => onHospitalClick(hospital)}
                      className="w-full mt-2 bg-blue-600 text-white text-xs py-2 rounded hover:bg-blue-700 transition"
                    >
                      Select Hospital
                    </button>
                  </div>
                </div>
              </InfoWindowF>
            )}
          </React.Fragment>
        ))}
      </GoogleMap>

      {/* Hospitals list overlay (optional, on mobile) */}
      {hospitals.length === 0 && (
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow p-4 text-center">
          <p className="text-gray-600 text-sm">No hospitals found nearby</p>
        </div>
      )}
    </div>
  );
};

export default HospitalMap;
