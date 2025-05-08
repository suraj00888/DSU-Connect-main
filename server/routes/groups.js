const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { protect, authorize } = require('../middleware/auth');

// Group routes
router.post('/', protect, authorize('admin'), groupController.createGroup);
router.get('/', protect, groupController.getGroups);
router.get('/:id', protect, groupController.getGroup);
router.put('/:id', protect, groupController.updateGroup);
router.delete('/:id', protect, groupController.deleteGroup);

// Group membership routes
router.post('/:id/join', protect, groupController.joinGroup);
router.post('/:id/leave', protect, groupController.leaveGroup);

module.exports = router; 