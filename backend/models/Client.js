import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  civility: {
    type: String,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  address1: {
    type: String,
    trim: true
  },
  address2: {
    type: String,
    trim: true
  },
  postalCode: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    default: 'LU',
    trim: true
  },
  countryCode: {
    type: String,
    default: 'LU',
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  mobile: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  vatNumber: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour recherche
clientSchema.index({ code: 1 });
clientSchema.index({ email: 1 });
clientSchema.index({ name: 1 });

export default mongoose.model('Client', clientSchema);

