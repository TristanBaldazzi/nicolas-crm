import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  status: {
    type: String,
    enum: ['demande', 'traité', 'fini', 'annulé'],
    default: 'demande'
  },
  total: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Calculer le total avant de sauvegarder
cartSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    this.total = this.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
  } else {
    this.total = 0;
  }
  next();
});

// Index pour recherche
cartSchema.index({ user: 1, status: 1 });
cartSchema.index({ status: 1 });
cartSchema.index({ createdAt: -1 });

export default mongoose.model('Cart', cartSchema);

