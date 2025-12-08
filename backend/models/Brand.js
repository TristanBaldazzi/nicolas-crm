import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index pour recherche
brandSchema.index({ name: 1 });
brandSchema.index({ order: 1 });

export default mongoose.model('Brand', brandSchema);



