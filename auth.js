// auth.js
const jwt = require('jsonwebtoken');
const { CONFIG } = require('./config');

function generateToken(payload) {
    return jwt.sign(payload, CONFIG.JWT_SECRET, { expiresIn: '1h' });
}

function verifyToken(req, res, next) {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ ok: false, error: { code: 'NO_TOKEN', message: 'Missing token' } });
    try {
        const data = jwt.verify(token, CONFIG.JWT_SECRET);
        req.user = data;
        next();
    } catch {
        return res.status(401).json({ ok: false, error: { code: 'BAD_TOKEN', message: 'Invalid or expired token' } });
    }
}

module.exports = { generateToken, verifyToken };
