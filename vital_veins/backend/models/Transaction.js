const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  txId: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: { type: String, enum: ['admin', 'hospital', 'donor'], required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['pending', 'success', 'failed', 'refunded'], default: 'pending' },
  provider: { type: String, default: 'manual' },
  reference: { type: String, default: '' },
  purpose: { type: String, default: '' },
  meta: { type: Object, default: {} },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

transactionSchema.pre('save', function(next) {
  if (!this.txId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 6);
    this.txId = `TX${timestamp}${random}`.toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);


