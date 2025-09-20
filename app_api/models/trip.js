// app_api/models/trip.js
const mongoose = require('../../app_server/models/db');

const TripSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },          // maps from UI 'title'
    destination: { type: String, trim: true },                   // maps from UI 'location'
    description: { type: String, trim: true, maxlength: 2000 },
    price: { type: Number, min: 0, default: 0 },
    date: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Trip', TripSchema);
