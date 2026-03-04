import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Brand from '../models/Brand.js';

dotenv.config();

const defaultBrands = [
  { name: 'Nematic', order: 1 },
  { name: 'Prinus', order: 2 },
  { name: 'Bosch', order: 3 },
  { name: 'Electro Lux', order: 4 },
  { name: 'Autre', order: 99 }
];

async function initBrands() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rcmplay', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    let created = 0;
    let skipped = 0;

    for (const brand of defaultBrands) {
      try {
        const existing = await Brand.findOne({ name: brand.name });
        if (!existing) {
          await Brand.create(brand);
          console.log(`✅ Created: ${brand.name}`);
          created++;
        } else {
          console.log(`⏭️  Skipped (already exists): ${brand.name}`);
          skipped++;
        }
      } catch (error) {
        console.error(`❌ Error creating ${brand.name}:`, error.message);
      }
    }

    console.log(`\n📊 Summary: ${created} created, ${skipped} skipped`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

initBrands();














