const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

// Message routes
router.get('/group/:groupId', protect, messageController.getMessages);
router.post('/group/:groupId', protect, messageController.sendMessage);
router.put('/:id', protect, messageController.updateMessage);
router.delete('/:id', protect, messageController.deleteMessage);

module.exports = router; 