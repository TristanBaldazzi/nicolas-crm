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
    },
    reference: {
      type: String,
      trim: true,
      default: ''
    }
  }],
  status: {
    type: String,
    enum: ['en_cours', 'demande', 'traité', 'annulé'],
    default: 'en_cours'
  },
  total: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  },
  orderReference: {
    type: String,
    trim: true,
    default: ''
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

