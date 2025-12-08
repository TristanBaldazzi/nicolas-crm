import mongoose from 'mongoose';

const productAnalyticsSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  eventType: {
    type: String,
    required: true,
    enum: ['view', 'cart_add', 'cart_remove', 'purchase', 'favorite_add', 'favorite_remove'],
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  referrerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  sessionId: {
    type: String,
    index: true
  },
  referrer: {
    type: String,
    default: null
  },
  source: {
    type: String,
    enum: ['direct', 'search', 'catalog', 'category', 'brand', 'external', 'user_referral', 'other'],
    default: 'other'
  },
  userAgent: {
    type: String,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index composés pour les requêtes fréquentes
productAnalyticsSchema.index({ product: 1, eventType: 1, createdAt: -1 });
productAnalyticsSchema.index({ product: 1, createdAt: -1 });
productAnalyticsSchema.index({ userId: 1, createdAt: -1 });
productAnalyticsSchema.index({ createdAt: -1 });

export default mongoose.model('ProductAnalytics', productAnalyticsSchema);


