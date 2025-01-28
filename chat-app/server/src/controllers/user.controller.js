const User = require('../models/user.model');

const userController = {
    getAllUsers: async (req, res) => {
      try {
        console.log('Fetching all users...');
        const users = await User.find({}, '-password');
        console.log('Found users:', users);
        res.json(users);
      } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: err.message });
      }
    }
  };

module.exports = userController;