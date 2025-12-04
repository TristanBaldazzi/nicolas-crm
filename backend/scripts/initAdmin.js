import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function initAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rcmplay');
    console.log('✅ Connected to MongoDB');

    const email = process.argv[2] || 'admin@rcmplay.lu';
    const password = process.argv[3] || 'admin123';
    const firstName = process.argv[4] || 'Admin';
    const lastName = process.argv[5] || 'RCMPLAY';

    // Vérifier si l'admin existe déjà
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('⚠️  Admin existe déjà avec cet email');
      existing.role = 'admin';
      existing.password = password; // Sera hashé automatiquement
      await existing.save();
      console.log('✅ Admin mis à jour');
    } else {
      const admin = new User({
        email,
        password,
        firstName,
        lastName,
        role: 'admin',
      });
      await admin.save();
      console.log('✅ Admin créé avec succès');
    }

    console.log(`\n📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log('\n⚠️  Changez le mot de passe après la première connexion !\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

initAdmin();




