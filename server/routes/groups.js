const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const messageController = require('../controllers/messageController');
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

// Group message routes (RESTful approach)
router.get('/:groupId/messages', protect, messageController.getMessages);
router.post('/:groupId/messages', protect, messageController.sendMessage);
router.put('/:groupId/messages/:id', protect, messageController.updateMessage);
router.delete('/:groupId/messages/:id', protect, messageController.deleteMessage);

module.exports = router; 