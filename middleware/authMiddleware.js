const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_clinic_key_123';

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token provided' });

    const tokenParts = token.split(' ');
    const tokenStr = tokenParts.length === 2 ? tokenParts[1] : tokenParts[0];

    jwt.verify(tokenStr, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Unauthorized!' });
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
};

const verifyRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.userRole)) {
            return res.status(403).json({ error: 'Requires specific role access.' });
        }
        next();
    };
};

module.exports = { verifyToken, verifyRole, JWT_SECRET };
