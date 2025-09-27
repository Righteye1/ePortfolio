// app.js
require('./app_server/models/db');

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const morgan = require('morgan');
const { body, validationResult } = require('express-validator');

const { CONFIG } = require('./config');
const { generateToken, verifyToken } = require('./auth');
const { notFound, errorHandler } = require('./middleware/error');
const Trip = require('./app_api/models/trip');

const app = express();
const PORT = CONFIG.PORT || 3000;

app.use(morgan('dev'));
app.use(cors({ origin: CONFIG.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json());

// Hardcoded demo admin
const adminUser = { username: 'admin', passwordHash: bcrypt.hashSync('admin123', 10) };

//
function normalizeTripBody(body) {
    if (!body.name && typeof body.title === 'string') body.name = body.title;
    if (!body.destination && typeof body.location === 'string') body.destination = body.location;
    return body;
}

// 🔑 Updated serializer to always include both forms of the fields
function serializeTrip(doc) {
    const t = doc.toObject ? doc.toObject() : doc;
    return {
        ...t,
        name: t.name || t.title,
        destination: t.destination || t.location,
        title: t.name || t.title,
        location: t.destination || t.location
    };
}

const tripValidators = [
    body(['name', 'title']).custom((_, { req }) => {
        const ok =
            (req.body.name && req.body.name.trim()) ||
            (req.body.title && req.body.title.trim());
        if (!ok) throw new Error('name/title is required');
        return true;
    }),
    body('destination').optional().isString().trim().isLength({ max: 120 }),
    body('location').optional().isString().trim().isLength({ max: 120 }),
    body('price').optional().isFloat({ min: 0 }),
    body('date').optional().isISO8601(),
    body('description').optional().isString().trim().isLength({ max: 2000 }),
];

function handleValidation(req, res, next) {
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    return res
        .status(400)
        .json({ message: 'Invalid request', details: errors.array() });
}

// Login
app.post('/api/login', (req, res) => {
    const username = (req.body.username || '').trim().toLowerCase();
    const password = (req.body.password || '').trim();
    if (
        username === adminUser.username.toLowerCase() &&
        bcrypt.compareSync(password, adminUser.passwordHash)
    ) {
        const token = generateToken({ username });
        return res.json({ token });
    }
    res.status(401).json({ message: 'Invalid credentials' });
});

// ---------------------------------------------------------------------------
// Read (public) — enhanced with pagination, sorting, filters, total, ETag
// ---------------------------------------------------------------------------
app.get('/api/trips', async (req, res, next) => {
    try {
        const MAX_LIMIT = 50, DEFAULT_LIMIT = 20;

        const limit = Math.min(Math.max(parseInt(req.query.limit || DEFAULT_LIMIT, 10), 1), MAX_LIMIT);
        const skip = Math.max(parseInt(req.query.skip || 0, 10), 0);

        let sort = { createdAt: -1 };
        if (req.query.sort) {
            const [field, dir] = String(req.query.sort).split(':');
            const allowed = new Set(['createdAt', 'updatedAt', 'price', 'name', 'destination', 'date']);
            if (allowed.has(field)) sort = { [field]: (String(dir).toLowerCase() === 'asc' ? 1 : -1) };
        }

        const where = {};
        const q = (req.query.q || '').trim();
        if (q) {
            const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const rx = new RegExp(safe, 'i');
            where.$or = [
                { name: rx },
                { destination: rx },
                { description: rx }
            ];
        }
        const dest = (req.query.dest || '').trim();
        if (dest) where.destination = new RegExp(`^${dest}$`, 'i');

        const [total, rows] = await Promise.all([
            Trip.countDocuments(where),
            Trip.find(where).sort(sort).skip(skip).limit(limit).lean()
        ]);

        const newest = rows[0]?.updatedAt || 0;
        const etag = `"${total}-${new Date(newest).getTime()}"`;
        if (req.headers['if-none-match'] === etag) return res.status(304).end();
        res.set('ETag', etag);

        res.json({ ok: true, data: rows.map(serializeTrip), total });
    } catch (err) {
        next(err);
    }
});

// ---------------------------------------------------------------------------
// Read (detail) — GET /api/trips/:id with ETag
// ---------------------------------------------------------------------------
app.get('/api/trips/:id', async (req, res, next) => {
    try {
        const doc = await Trip.findById(req.params.id).lean();
        if (!doc) return res.status(404).json({ message: 'Not found' });

        const etag = `"doc-${doc._id}-${new Date(doc.updatedAt).getTime()}"`;
        if (req.headers['if-none-match'] === etag) return res.status(304).end();
        res.set('ETag', etag);

        res.json({ ok: true, data: serializeTrip(doc) });
    } catch (err) {
        next(err);
    }
});

// Create
app.post(
    '/api/trips',
    verifyToken,
    tripValidators,
    handleValidation,
    async (req, res, next) => {
        try {
            normalizeTripBody(req.body);
            const saved = await Trip.create({
                name: req.body.name || req.body.title,
                destination: req.body.destination || req.body.location,
                price: req.body.price,
                date: req.body.date,
                description: req.body.description,
            });
            res.status(201).json(serializeTrip(saved));
        } catch (err) {
            next(err);
        }
    }
);

// Update
app.put(
    '/api/trips/:id',
    verifyToken,
    tripValidators,
    handleValidation,
    async (req, res, next) => {
        try {
            normalizeTripBody(req.body);
            const updated = await Trip.findByIdAndUpdate(
                req.params.id,
                {
                    name: req.body.name || req.body.title,
                    destination: req.body.destination || req.body.location,
                    price: req.body.price,
                    date: req.body.date,
                    description: req.body.description,
                },
                { new: true, runValidators: true }
            );
            if (!updated) return res.status(404).json({ message: 'Trip not found' });
            res.json(serializeTrip(updated));
        } catch (err) {
            next(err);
        }
    }
);

// Delete
app.delete('/api/trips/:id', verifyToken, async (req, res, next) => {
    try {
        const deleted = await Trip.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Trip not found' });
        res.json({ message: 'Trip deleted', _id: deleted._id });
    } catch (err) {
        next(err);
    }
});

// Health
app.get('/', (_req, res) => res.send('Travlr API is running!'));

// Errors
app.use(notFound);
app.use(errorHandler);

// Start
app.listen(PORT, () =>
    console.log(`API listening on http://localhost:${PORT}`)
);
