const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        console.log('Token received:', token);
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        console.log('Decoded token:', decoded);
        
        const user = await User.findById(decoded.userId);
        console.log('Found user:', user);

        if (!user) {
            console.log('No user found with decoded ID');
            throw new Error();
        }

        req.user = user;
        console.log('User set in request:', req.user);
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(401).send({ error: 'Please authenticate.' });
    }
};

const roleCheck = (roles) => {
    return (req, res, next) => {
        console.log('Checking roles:', roles);
        console.log('User roles:', req.user.roles);
        
        if (!req.user.roles.some(role => roles.includes(role))) {
            console.log('Role check failed');
            return res.status(403).send({ error: 'Access denied.' });
        }
        console.log('Role check passed');
        next();
    };
};

module.exports = { auth, roleCheck };