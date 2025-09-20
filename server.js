// server.js
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

const adminUser = { username: 'admin', passwordHash: bcrypt.hashSync('admin123', 10) };

function normalizeTripBody(body) {
    if (!body.name && typeof body.title === 'string') body.name = body.title;
    if (!body.destination && typeof body.location === 'string') body.destination = body.location;
    return body;
}
function serializeTrip(doc) {
    const t = doc.toObject ? doc.toObject() : doc;
    return { ...t, title: t.name, location: t.destination };
}
const tripValidators = [
    body(['name', 'title']).custom((_, { req }) => {
        const ok = (req.body.name && req.body.name.trim()) || (req.body.title && req.body.title.trim());
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
    return res.status(400).json({ message: 'Invalid request', details: errors.array() });
}

// login
app.post('/api/login', (req, res) => {
    const username = (req.body.username || '').trim().toLowerCase();
    const password = (req.body.password || '').trim();
    if (username === adminUser.username.toLowerCase() && bcrypt.compareSync(password, adminUser.passwordHash)) {
        const token = generateToken({ username });    // no role claim here
        return res.json({ token });
    }
    res.status(401).json({ message: 'Invalid credentials' });
});

// read
app.get('/api/trips', async (_req, res, next) => {
    try {
        const docs = await Trip.find().sort({ createdAt: -1 }).lean();
        res.json(docs.map(serializeTrip));
    } catch (err) { next(err); }
});

// create
app.post('/api/trips', verifyToken, tripValidators, handleValidation, async (req, res, next) => {
    try {
        normalizeTripBody(req.body);
        const saved = await Trip.create({
            name: req.body.name,
            destination: req.body.destination,
            price: req.body.price,
            date: req.body.date,
            description: req.body.description
        });
        res.status(201).json(serializeTrip(saved));
    } catch (err) { next(err); }
});

// update
app.put('/api/trips/:id', verifyToken, tripValidators, handleValidation, async (req, res, next) => {
    try {
        normalizeTripBody(req.body);
        const updated = await Trip.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                destination: req.body.destination,
                price: req.body.price,
                date: req.body.date,
                description: req.body.description
            },
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ message: 'Trip not found' });
        res.json(serializeTrip(updated));
    } catch (err) { next(err); }
});

// delete
app.delete('/api/trips/:id', verifyToken, async (req, res, next) => {
    try {
        const deleted = await Trip.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Trip not found' });
        res.json({ message: 'Trip deleted', _id: deleted._id });
    } catch (err) { next(err); }
});

app.get('/', (_req, res) => res.send('Travlr API is running!'));
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
