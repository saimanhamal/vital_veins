import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { motion } from 'framer-motion';
import { Phone, MapPin, Globe } from 'lucide-react';
import api from '../../services/api';
import 'leaflet/dist/leaflet.css';

// Custom hospital marker icon
const hospitalIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const HospitalLocator = ({ showOnlyApproved = true }) => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState([20.5937, 78.9629]); // Center of India

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      // Fetch from public endpoint or admin endpoint
      const response = await api.get(showOnlyApproved
        ? '/api/hospitals-public'
        : '/api/admin/hospitals');

      let hospitalData = response.data.hospitals || response.data.data || [];

      // Filter only approved hospitals if needed
      if (showOnlyApproved) {
        hospitalData = hospitalData.filter(h => h.status === 'approved');
      }

      setHospitals(hospitalData);

      // Calculate center if we have hospitals
      if (hospitalData.length > 0) {
        const validHospitals = hospitalData.filter(h => h.location?.coordinates);
        if (validHospitals.length > 0) {
          const avgLng = validHospitals.reduce((sum, h) => sum + h.location.coordinates[0], 0) / validHospitals.length;
          const avgLat = validHospitals.reduce((sum, h) => sum + h.location.coordinates[1], 0) / validHospitals.length;
          setCenter([avgLat, avgLng]);
        }
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-600">Loading hospitals...</p>
      </div>
    );
  }

  const validHospitals = hospitals.filter(h =>
    h.location &&
    h.location.coordinates &&
    h.location.coordinates.length === 2
  );

  return (
    <div className="w-full space-y-4">
      <div className="text-sm text-gray-600">
        {validHospitals.length} hospitals found on map
      </div>

      <MapContainer
        center={center}
        zoom={5}
        style={{ height: '500px', width: '100%' }}
        className="rounded-lg shadow-lg"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {validHospitals.map((hospital) => (
          <Marker
            key={hospital._id}
            position={[hospital.location.coordinates[1], hospital.location.coordinates[0]]}
            icon={hospitalIcon}
          >
            <Popup className="custom-popup">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 min-w-xs"
              >
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  {hospital.hospitalName}
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-gray-700">{hospital.address?.street}</p>
                      <p className="text-gray-600">
                        {hospital.address?.city}, {hospital.address?.state} {hospital.address?.zipCode}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <a
                      href={`tel:${hospital.contact?.phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {hospital.contact?.phone}
                    </a>
                  </div>

                  {hospital.contact?.website && (
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <a
                        href={hospital.contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}

                  {hospital.specialization && hospital.specialization.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-gray-700 mb-1">Specializations:</p>
                      <div className="flex flex-wrap gap-1">
                        {hospital.specialization.map((spec) => (
                          <span
                            key={spec}
                            className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {hospital.capacity && (
                    <div className="mt-2 text-xs border-t pt-2">
                      <p className="font-semibold text-gray-700 mb-1">Capacity:</p>
                      <p>Beds: {hospital.capacity.beds}</p>
                      <p>ICU Beds: {hospital.capacity.icuBeds}</p>
                      <p>Operation Rooms: {hospital.capacity.operationRooms}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Hospital List */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {validHospitals.slice(0, 6).map((hospital) => (
          <motion.div
            key={hospital._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4 hover:shadow-lg transition-shadow"
          >
            <h3 className="font-bold text-gray-900 mb-2">{hospital.hospitalName}</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>{hospital.address?.city}, {hospital.address?.state}</span>
              </p>
              <p className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <a href={`tel:${hospital.contact?.phone}`} className="text-blue-600 hover:underline">
                  {hospital.contact?.phone}
                </a>
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HospitalLocator;
