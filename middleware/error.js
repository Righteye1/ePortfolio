// middleware/error.js
function notFound(req, res, _next) {
    res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: `Route ${req.originalUrl} not found` } });
}

function errorHandler(err, _req, res, _next) {
    console.error('[error]', err);
    const status = err.status || 500;
    res.status(status).json({ ok: false, error: { code: 'SERVER_ERROR', message: err.message || 'Server error' } });
}

module.exports = { notFound, errorHandler };
