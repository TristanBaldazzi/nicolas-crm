import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
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
    maxlength: 2500,
    trim: true
  },
  files: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String
  }],
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index pour recherche
contactSchema.index({ email: 1 });
contactSchema.index({ user: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ isRead: 1 });

export default mongoose.model('Contact', contactSchema);

