import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProductSpec from '../models/ProductSpec.js';

dotenv.config();

const defaultSpecs = [
  { name: 'Dimensions (L x l x H)', type: 'text', order: 1 },
  { name: 'Poids', type: 'text', order: 2 },
  { name: 'Gestion des', type: 'text', order: 3 },
  { name: 'Seaux de lavage', type: 'text', order: 4 },
  { name: 'Réservoirs', type: 'text', order: 5 },
  { name: 'Diamètre des roues', type: 'text', order: 6 },
  { name: 'Rayon d\'action', type: 'text', order: 7 },
  { name: 'Vitesse de rotation', type: 'text', order: 8 },
  { name: 'Puissance moteur', type: 'text', order: 9 },
  { name: 'Rendement théorique', type: 'text', order: 10 },
  { name: 'Technologie ReFlo', type: 'text', order: 11 },
  { name: 'Technologie Batterie', type: 'text', order: 12 },
  { name: 'Pression', type: 'text', order: 13 },
  { name: 'Niveau sonore', type: 'text', order: 14 },
  { name: 'Indice de protection', type: 'text', order: 15 },
  { name: 'Classe de protection', type: 'text', order: 16 },
  { name: 'Réservoir inclus', type: 'text', order: 17 },
  { name: 'Prise Nuplug', type: 'text', order: 18 }
];

async function initProductSpecs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rcmplay', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    let created = 0;
    let skipped = 0;

    for (const spec of defaultSpecs) {
      try {
        const existing = await ProductSpec.findOne({ name: spec.name });
        if (!existing) {
          await ProductSpec.create(spec);
          console.log(`✅ Created: ${spec.name}`);
          created++;
        } else {
          console.log(`⏭️  Skipped (already exists): ${spec.name}`);
          skipped++;
        }
      } catch (error) {
        console.error(`❌ Error creating ${spec.name}:`, error.message);
      }
    }

    console.log(`\n📊 Summary: ${created} created, ${skipped} skipped`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

initProductSpecs();


