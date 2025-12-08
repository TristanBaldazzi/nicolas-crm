import mongoose from 'mongoose';

const productSpecSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'number', 'boolean'],
    default: 'text'
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index pour recherche
productSpecSchema.index({ name: 1 });
productSpecSchema.index({ order: 1 });

export default mongoose.model('ProductSpec', productSpecSchema);



