import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  discountPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  appliesToAllProducts: {
    type: Boolean,
    default: true
  },
  productIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  categoryIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }]
}, {
  timestamps: true
});

// Index pour recherche
promotionSchema.index({ company: 1 });
promotionSchema.index({ isActive: 1 });
promotionSchema.index({ startDate: 1, endDate: 1 });

// Méthode pour vérifier si la promotion est valide
promotionSchema.methods.isValid = function() {
  if (!this.isActive) return false;
  const now = new Date();
  if (this.startDate && now < this.startDate) return false;
  if (this.endDate && now > this.endDate) return false;
  return true;
};

// Méthode pour vérifier si la promotion s'applique à un produit
promotionSchema.methods.appliesToProduct = function(productId, categoryId, subCategoryId) {
  if (!this.isValid()) return false;
  
  if (this.appliesToAllProducts) return true;
  
  if (this.productIds && this.productIds.length > 0) {
    if (this.productIds.some(id => id.toString() === productId.toString())) {
      return true;
    }
  }
  
  if (this.categoryIds && this.categoryIds.length > 0) {
    if (categoryId && this.categoryIds.some(id => id.toString() === categoryId.toString())) {
      return true;
    }
    if (subCategoryId && this.categoryIds.some(id => id.toString() === subCategoryId.toString())) {
      return true;
    }
  }
  
  return false;
};

export default mongoose.model('Promotion', promotionSchema);

