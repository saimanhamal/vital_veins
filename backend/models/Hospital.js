const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hospitalName: {
    type: String,
    required: [true, 'Hospital name is required'],
    trim: true,
    maxlength: [100, 'Hospital name cannot exceed 100 characters']
  },
  license: {
    type: String,
    required: [true, 'License number is required'],
    unique: true
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'India' }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  contact: {
    phone: { type: String, required: true },
    email: { type: String, required: true },
    website: { type: String, default: '' }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  specialization: [{
    type: String,
    enum: ['General', 'Cardiology', 'Neurology', 'Oncology', 'Pediatrics', 'Emergency', 'Transplant']
  }],
  capacity: {
    beds: { type: Number, default: 0 },
    icuBeds: { type: Number, default: 0 },
    operationRooms: { type: Number, default: 0 },
    appointmentSlotCapacity: { type: Number, default: 5 }, // Max donors per appointment slot
    maxDonorsPerDay: { type: Number, default: 50 } // Max total donors per day
  },
  inventory: {
    blood: [{
      type: { 
        type: String, 
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] 
      },
      quantity: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now }
    }],
    organs: [{
      type: { 
        type: String, 
        enum: ['heart', 'liver', 'kidney', 'lung', 'pancreas', 'intestine', 'cornea', 'skin', 'bone'],
        lowercase: true
      },
      quantity: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now }
    }]
  },
  workingHours: {
    monday: { open: String, close: String, closed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
    friday: { open: String, close: String, closed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, closed: { type: Boolean, default: false } }
  },
  documents: [{
    name: String,
    url: String,
    type: { type: String, enum: ['license', 'certificate', 'insurance', 'other'] },
    uploadedAt: { type: Date, default: Date.now }
  }],
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for geospatial queries
hospitalSchema.index({ location: '2dsphere' });

// Virtual for full address
hospitalSchema.virtual('fullAddress').get(function() {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}, ${this.address.country}`;
});

// Method to update inventory
hospitalSchema.methods.updateInventory = function(type, bloodType, quantity) {
  if (type === 'blood') {
    const bloodItem = this.inventory.blood.find(item => item.type === bloodType);
    if (bloodItem) {
      bloodItem.quantity += quantity;
      bloodItem.lastUpdated = new Date();
    } else {
      this.inventory.blood.push({ type: bloodType, quantity, lastUpdated: new Date() });
    }
  } else if (type === 'organ') {
    const organItem = this.inventory.organs.find(item => item.type === bloodType);
    if (organItem) {
      organItem.quantity += quantity;
      organItem.lastUpdated = new Date();
    } else {
      this.inventory.organs.push({ type: bloodType, quantity, lastUpdated: new Date() });
    }
  }
  return this.save();
};

// (Index already declared above)

module.exports = mongoose.model('Hospital', hospitalSchema);
