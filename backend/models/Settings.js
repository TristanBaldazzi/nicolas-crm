import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  // Visibilité des prix
  priceVisibility: {
    type: String,
    enum: ['all', 'loggedIn', 'hidden'],
    default: 'all',
    required: true
  },
  // Autorisation des inscriptions
  allowRegistration: {
    type: Boolean,
    default: true,
    required: true
  },
  // Mode IA pour les demandes personnalisées
  customQuotesAIMode: {
    type: String,
    enum: ['none', 'manual', 'auto'],
    default: 'auto',
    required: true
  },
  // Autres settings peuvent être ajoutés ici
}, {
  timestamps: true
});

// S'assurer qu'il n'y a qu'un seul document de settings
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({ 
      priceVisibility: 'all', 
      allowRegistration: true,
      customQuotesAIMode: 'auto'
    });
  }
  return settings;
};

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;

