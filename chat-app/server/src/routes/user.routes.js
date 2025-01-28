const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { auth, roleCheck } = require('../middleware/auth.middleware');

router.get('/', auth, roleCheck(['super_admin']), userController.getAllUsers);

module.exports = router;