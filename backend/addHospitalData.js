const mongoose = require('mongoose');
const Hospital = require('./models/Hospital');
const Appointment = require('./models/Appointment');
const Donor = require('./models/Donor');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lifelink', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

const addInventoryAndAppointments = async () => {
  try {
    // Get all hospitals
    const hospitals = await Hospital.find({});
    console.log(`Found ${hospitals.length} hospitals`);

    // Blood types and organ types
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const organTypes = ['Heart', 'Liver', 'Kidney', 'Lung', 'Pancreas', 'Intestine', 'Cornea', 'Skin', 'Bone'];

    // Get all donors for appointments
    const donors = await Donor.find({}).populate('user');
    console.log(`Found ${donors.length} donors`);

    // Process each hospital
    for (const hospital of hospitals) {
      // Clear existing inventory
      hospital.inventory.blood = [];
      hospital.inventory.organs = [];

      // Add blood inventory
      for (const bloodType of bloodTypes) {
        const quantity = Math.floor(Math.random() * 50) + 20; // 20-70 units
        hospital.inventory.blood.push({
          type: bloodType,
          quantity,
          lastUpdated: new Date()
        });
      }

      // Add organ inventory
      for (const organType of organTypes) {
        const quantity = Math.floor(Math.random() * 5) + 1; // 1-6 units
        hospital.inventory.organs.push({
          type: organType,
          quantity,
          lastUpdated: new Date()
        });
      }

      await hospital.save();
      console.log(`Updated inventory for ${hospital.hospitalName}`);

      // Create 3 appointments for each hospital
      if (donors.length > 0) {
        for (let i = 0; i < 3; i++) {
          const donor = donors[Math.floor(Math.random() * donors.length)];
          const isBloodDonation = Math.random() > 0.5;
          
          const today = new Date();
          const futureDate = new Date();
          futureDate.setDate(today.getDate() + Math.floor(Math.random() * 14) + 1); // 1-14 days in future
          
          const hours = Math.floor(Math.random() * 8) + 9; // 9 AM to 5 PM
          const minutes = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, or 45 minutes
          const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          
          const appointment = new Appointment({
            appointmentId: `APT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            donor: donor._id,
            hospital: hospital._id,
            type: isBloodDonation ? 'blood' : 'organ',
            bloodType: isBloodDonation ? bloodTypes[Math.floor(Math.random() * bloodTypes.length)] : undefined,
            organType: !isBloodDonation ? organTypes[Math.floor(Math.random() * organTypes.length)] : undefined,
            scheduledDate: futureDate,
            scheduledTime: timeString,
            status: ['pending', 'confirmed', 'completed'][Math.floor(Math.random() * 3)],
            notes: `${isBloodDonation ? 'Blood' : 'Organ'} donation appointment`
          });
          
          await appointment.save();
          console.log(`Created appointment for ${donor.personalInfo?.firstName || 'Donor'} at ${hospital.hospitalName}`);
        }
      }
    }

    console.log('Successfully added inventory and appointments to all hospitals');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

// Run the function
addInventoryAndAppointments();