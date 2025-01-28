const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const authController = {
    register: async (req, res) => {
        try {
            const { username, email, password } = req.body;
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await User.create({
                username,
                email,
                password: hashedPassword,
                roles: ['user']  // Setting default role
            });

            const token = jwt.sign(
                { userId: user._id }, 
                process.env.JWT_SECRET || 'your_jwt_secret'
            );

            res.status(201).json({ 
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    roles: user.roles
                }, 
                token 
            });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    },

    login: async (req, res) => {
        try {
            const { username, password } = req.body;
            
            // Check for super admin
            if (username === 'super' && password === '123') {
                // Create super admin user if it doesn't exist
                let superAdmin = await User.findOne({ username: 'super' });
                if (!superAdmin) {
                    const hashedPassword = await bcrypt.hash('123', 10);
                    superAdmin = await User.create({
                        username: 'super',
                        email: 'super@admin.com',
                        password: hashedPassword,
                        roles: ['super_admin']
                    });
                }
                const token = jwt.sign(
                    { userId: superAdmin._id }, 
                    process.env.JWT_SECRET || 'your_jwt_secret'
                );
                return res.json({ 
                    user: {
                        _id: superAdmin._id,
                        username: superAdmin.username,
                        roles: superAdmin.roles
                    }, 
                    token 
                });
            }

            // Regular user login
            const user = await User.findOne({ username });
            if (!user) {
                throw new Error('Invalid credentials');
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                throw new Error('Invalid credentials');
            }

            const token = jwt.sign(
                { userId: user._id }, 
                process.env.JWT_SECRET || 'your_jwt_secret'
            );

            res.json({ 
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    roles: user.roles
                }, 
                token 
            });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
};

module.exports = authController;