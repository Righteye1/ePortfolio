// config.js
require('dotenv').config();

const CONFIG = {
    PORT: process.env.PORT || 3000,
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/travlr',
    JWT_SECRET: process.env.JWT_SECRET || 'dev_fallback_secret',
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*'
};

module.exports = { CONFIG };
