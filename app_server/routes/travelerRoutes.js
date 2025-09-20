const express = require('express');
const router = express.Router();
const travelerController = require('../controllers/travelerController');

router.get('/trips', travelerController.trips);

module.exports = router;
