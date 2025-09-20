

// One time script to import trips.json into MongoDB

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { CONFIG } = require('../config');
const Trip = require('../app_api/models/trip'); // use the model created earlier

async function run() {
  try {
    // Connect to DB
    await mongoose.connect(CONFIG.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('[mongo] connected for seeding');

    // Load trips.json
    const jsonPath = path.join(__dirname, '..', 'trips.json');
    if (!fs.existsSync(jsonPath)) {
      console.error('trips.json not found at', jsonPath);
      process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    // Map old file-backed fields to schema
    const docs = data.map(t => ({
      name: t.name || 'Untitled Trip',
      destination: t.destination || '',
      price: typeof t.price === 'number' ? t.price : Number(t.price) || 0,
      date: t.date ? new Date(t.date) : undefined,
      description: t.description || ''
    }));

    // Clear existing trips
    await Trip.deleteMany({});
    console.log(`Cleared existing trips`);

    // Insert new docs
    await Trip.insertMany(docs);
    console.log(`Seeded ${docs.length} trips into MongoDB`);

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

run();
