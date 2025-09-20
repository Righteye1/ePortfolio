const mongoose = require('mongoose');
const Trip = mongoose.model('Trip');

exports.trips = async (req, res) => {
    try {
        const trips = await Trip.find({});
        res.json(trips); // For testing: returns all trips in JSON
    } catch (err) {
        res.status(500).send(err);
    }
};
