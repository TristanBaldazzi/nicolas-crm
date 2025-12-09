import mongoose from 'mongoose';

const customQuoteRequestSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  message: {
    type: String,
    required: true,
    maxlength: 3500,
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index pour recherche
customQuoteRequestSchema.index({ email: 1 });
customQuoteRequestSchema.index({ user: 1 });
customQuoteRequestSchema.index({ createdAt: -1 });
customQuoteRequestSchema.index({ isRead: 1 });

export default mongoose.model('CustomQuoteRequest', customQuoteRequestSchema);
