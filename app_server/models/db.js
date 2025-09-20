// app_server/models/db.js
const mongoose = require('mongoose');
const { CONFIG } = require('../../config');

mongoose.connect(CONFIG.MONGO_URI, { dbName: undefined })
    .then(() => console.log('[mongo] connected:', CONFIG.MONGO_URI))
    .catch(err => console.error('[mongo] connection error', err));

module.exports = mongoose;
