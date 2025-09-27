// app_api/models/trip.js
const mongoose = require('../../app_server/models/db');

const TripSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },          // maps from UI 'title'
    destination: { type: String, trim: true },                   // maps from UI 'location'
    description: { type: String, trim: true, maxlength: 2000 },
    price: { type: Number, min: 0, default: 0 },
    date: { type: Date }
}, { timestamps: true });


TripSchema.index({ createdAt: -1 });                        // sort by newest
TripSchema.index({ price: 1 });                             // sort/filter by price
TripSchema.index({ destination: 1 });                       // filter by destination

// Optional for large datasets: enable text search for "q"
TripSchema.index({ name: 'text', destination: 'text', description: 'text' });

module.exports = mongoose.model('Trip', TripSchema);
