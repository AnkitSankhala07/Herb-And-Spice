const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
            return res.status(400).json({ message: 'Email and password are required and must be strings' });
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                role: user.role,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// @desc    Register a new user (Admin restricted)
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body || {};

        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ message: 'Valid name is required' });
        }

        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return res.status(400).json({ message: 'Valid email is required' });
        }

        if (!password || typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const allowedRoles = ['admin', 'waiter', 'kitchen', 'customer'];
        const userRole = role && allowedRoles.includes(role) ? role : 'customer';

        const normalizedEmail = email.trim().toLowerCase();
        const userExists = await User.findOne({ email: normalizedEmail });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password,
            role: userRole
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                role: user.role,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

module.exports = { loginUser, registerUser };
