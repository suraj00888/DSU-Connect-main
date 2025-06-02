const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { eventExists } = require('../middleware/eventMiddleware');
const eventController = require('../controllers/eventController');

// GET /api/events - Get all events with pagination and filtering
router.get('/', eventController.getEvents);

// GET /api/events/user/attending - Get events user is attending (protected)
// This specific route needs to come before the :id route to prevent conflicts
router.get('/user/attending', protect, eventController.getUserEvents);

// GET /api/events/:id - Get a specific event
router.get('/:id', eventExists, eventController.getEvent);

// POST /api/events - Create a new event (protected)
router.post('/', protect, eventController.createEvent);

// PUT /api/events/:id - Update an event (protected)
router.put('/:id', protect, eventExists, eventController.updateEvent);

// DELETE /api/events/:id - Delete/cancel an event (protected)
router.delete('/:id', protect, eventExists, eventController.deleteEvent);

// POST /api/events/:id/register - Register for an event (protected)
router.post('/:id/register', protect, eventExists, eventController.registerForEvent);

// DELETE /api/events/:id/register - Cancel registration (protected)
router.delete('/:id/register', protect, eventExists, eventController.cancelRegistration);

// GET /api/events/:id/attendees - Get event attendees
router.get('/:id/attendees', eventExists, eventController.getEventAttendees);

// GET /api/events/:id/attendance - Get attendance list for an event (protected)
router.get('/:id/attendance', protect, eventExists, eventController.getAttendanceList);

// POST /api/events/:id/attendance - Mark attendance for a user (protected)
router.post('/:id/attendance', protect, eventExists, eventController.markAttendance);

// POST /api/events/:id/attendance/bulk - Bulk mark attendance (protected)
router.post('/:id/attendance/bulk', protect, eventExists, eventController.bulkMarkAttendance);

// QR Code routes
// GET /api/events/:id/qr-code - Get user's QR code for an event (protected)
router.get('/:id/qr-code', protect, eventExists, eventController.getUserQRCode);

// GET /api/events/:id/qr-code/download - Download QR code as image (protected)
router.get('/:id/qr-code/download', protect, eventExists, eventController.downloadQRCode);

// POST /api/events/:id/attendance/qr - Mark attendance using QR code scan (protected)
router.post('/:id/attendance/qr', protect, eventExists, eventController.markAttendanceByQR);

module.exports = router; 