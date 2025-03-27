const express = require('express');
const resourceController = require('../controllers/resourceController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/resources/upload - Upload a resource
router.post('/upload', protect, resourceController.uploadResource);

// GET /api/resources - Get all resources with filtering
router.get('/', resourceController.getResources);

// GET /api/resources/:id - Get a specific resource
router.get('/:id', resourceController.getResource);

// DELETE /api/resources/:id - Delete a resource
router.delete('/:id', protect, resourceController.deleteResource);

// POST /api/resources/:id/download - Track resource download
router.post('/:id/download', resourceController.trackDownload);

module.exports = router; 