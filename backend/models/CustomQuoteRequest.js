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
  },
  // Suggestions IA (pour mode 'manual')
  aiSuggestions: {
    suggestedProducts: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      quantity: {
        type: Number,
        default: 1
      },
      reason: {
        type: String
      }
    }],
    summary: {
      type: String
    },
    analyzedAt: {
      type: Date
    }
  },
  // Panier créé automatiquement (pour mode 'auto')
  autoCreatedCart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cart',
    default: null
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
