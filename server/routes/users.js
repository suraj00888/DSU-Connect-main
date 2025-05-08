const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Import user controller (we'll create this next)
const userController = require('../controllers/userController');

// User routes
router.get('/me', protect, userController.getMe);
router.put('/me', protect, userController.updateMe);
router.put('/me/password', protect, userController.updatePassword);

// Admin only routes
router.get('/', protect, authorize('admin'), userController.getUsers);
router.get('/:id', protect, authorize('admin'), userController.getUser);
router.put('/:id', protect, authorize('admin'), userController.updateUser);
router.delete('/:id', protect, authorize('admin'), userController.deleteUser);

module.exports = router; 