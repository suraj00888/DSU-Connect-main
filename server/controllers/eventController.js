const Event = require('../models/Event');
const mongoose = require('mongoose');
const { getDateRange, formatEventData } = require('../utils/eventUtils');
const { generateRegistrationQR, validateAttendanceQR, generateQRBuffer } = require('../utils/qrCodeUtils');

/**
 * Get all events with pagination and basic filtering
 */
exports.getEvents = async (req, res) => {
    try {
        // Extract query parameters
        const { 
            page = 1, 
            limit = 10, 
            status, 
            category,
            period,
            startDate,
            endDate,
            search
        } = req.query;
        
        // Build query object
        const query = {};
        
        // Add filters if provided
        if (status) query.status = status;
        if (category) query.category = category;
        
        // Date filtering
        if (period || (startDate && endDate)) {
            try {
                const dateRange = getDateRange(
                    period || 'custom', 
                    startDate, 
                    endDate
                );
                
                // Create date query
                if (dateRange.start) {
                    query.startDate = { $gte: dateRange.start };
                }
                
                if (dateRange.end) {
                    if (!query.endDate) query.endDate = {};
                    query.endDate.$lte = dateRange.end;
                }
            } catch (error) {
                return res.status(400).json({ 
                    message: 'Invalid date parameters' 
                });
            }
        }
        
        // Search by title or description
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Calculate skip value for pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Execute query with pagination
        const events = await Event.find(query)
            .sort({ startDate: 1 }) // Sort by startDate ascending
            .skip(skip)
            .limit(parseInt(limit));
        
        // Count total documents for pagination metadata
        const total = await Event.countDocuments(query);
        
        // Format events with extra information
        const formattedEvents = events.map(event => 
            formatEventData(event, req.user?._id, req.user?.role)
        );
        
        // Send response
        res.json({
            events: formattedEvents,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get a specific event by ID
 */
exports.getEvent = async (req, res) => {
    try {
        // The event is already attached to req by the eventExists middleware
        let event = req.event;
        
        // Temporary migration fix: ensure all attendees have name field
        let needsSave = false;
        for (let i = 0; i < event.attendees.length; i++) {
            if (!event.attendees[i].name) {
                // If name is missing, try to get it from the user document
                try {
                    const User = require('../models/User');
                    const user = await User.findById(event.attendees[i].userId);
                    if (user && user.name) {
                        event.attendees[i].name = user.name;
                        needsSave = true;
                    } else {
                        // Fallback name if user not found
                        event.attendees[i].name = 'Unknown User';
                        needsSave = true;
                    }
                } catch (userError) {
                    event.attendees[i].name = 'Unknown User';
                    needsSave = true;
                }
            }
        }
        
        // Save if we had to update any attendees
        if (needsSave) {
            await event.save();
        }
        
        // Format the event data with user-specific information if available
        const formattedEvent = formatEventData(event, req.user?._id, req.user?.role);
        
        // Add capacity information
        formattedEvent.isAtCapacity = event.isAtCapacity();
        
        res.json(formattedEvent);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Create a new event
 */
exports.createEvent = async (req, res) => {
    try {
        const { 
            title, description, location, 
            startDate, endDate, category, image, capacity, additionalDetails
        } = req.body;
        
        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: 'Invalid date format' });
        }
        
        if (start > end) {
            return res.status(400).json({ 
                message: 'End date must be after start date' 
            });
        }
        
        // Validate capacity if provided
        if (capacity !== undefined && capacity !== null) {
            const capacityNum = Number(capacity);
            if (isNaN(capacityNum) || !Number.isInteger(capacityNum) || capacityNum <= 0) {
                return res.status(400).json({ message: 'Capacity must be a positive integer' });
            }
        }
        
        // Create new event
        const event = new Event({
            title,
            description,
            location,
            startDate,
            endDate,
            category,
            image,
            capacity: capacity ? Number(capacity) : null,
            additionalDetails,
            organizer: {
                id: req.user._id,
                name: req.user.name
            }
        });
        
        // Save to database
        await event.save();
        
        res.status(201).json({ 
            message: 'Event created successfully', 
            event 
        });
    } catch (error) {
        console.error('Error creating event:', error);
        
        // Check for validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Update an existing event
 */
exports.updateEvent = async (req, res) => {
    try {
        const { 
            title, description, location, 
            startDate, endDate, category, image, status, capacity, additionalDetails
        } = req.body;
        
        // Find the event
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        // Check if user is the organizer
        if (event.organizer.id.toString() !== req.user._id.toString() && 
            req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Not authorized to update this event' 
            });
        }
        
        // Validate dates if provided
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ message: 'Invalid date format' });
            }
            
            if (start > end) {
                return res.status(400).json({ 
                    message: 'End date must be after start date' 
                });
            }
        }
        
        // Validate capacity if provided
        if (capacity !== undefined && capacity !== null) {
            const capacityNum = Number(capacity);
            if (isNaN(capacityNum) || !Number.isInteger(capacityNum) || capacityNum <= 0) {
                return res.status(400).json({ message: 'Capacity must be a positive integer' });
            }
            
            // Check if reducing capacity would exceed new limit with existing attendees
            if (event.attendees.length > capacityNum) {
                return res.status(400).json({
                    message: `Cannot reduce capacity below current attendee count (${event.attendees.length})`
                });
            }
        }
        
        // Update fields
        if (title) event.title = title;
        if (description) event.description = description;
        if (location) event.location = location;
        if (startDate) event.startDate = startDate;
        if (endDate) event.endDate = endDate;
        if (category) event.category = category;
        if (image) event.image = image;
        if (status) event.status = status;
        if (additionalDetails) event.additionalDetails = additionalDetails;
        
        // Handle capacity (allow setting to null to remove limit)
        if (capacity !== undefined) {
            event.capacity = capacity ? Number(capacity) : null;
        }
        
        // Save changes
        await event.save();
        
        res.json({ 
            message: 'Event updated successfully', 
            event 
        });
    } catch (error) {
        console.error('Error updating event:', error);
        
        // Check if error is due to invalid ID format
        if (error instanceof mongoose.Error.CastError) {
            return res.status(400).json({ message: 'Invalid event ID' });
        }
        
        // Check for validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Delete/cancel an event
 */
exports.deleteEvent = async (req, res) => {
    try {
        // Find the event
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        // Check if user is the organizer
        if (event.organizer.id.toString() !== req.user._id.toString() && 
            req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Not authorized to delete this event' 
            });
        }
        
        // Delete the event
        await Event.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        
        // Check if error is due to invalid ID format
        if (error instanceof mongoose.Error.CastError) {
            return res.status(400).json({ message: 'Invalid event ID' });
        }
        
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Register current user for an event
 */
exports.registerForEvent = async (req, res) => {
    try {
        // Check if user is an admin
        if (req.user.role === 'admin') {
            return res.status(403).json({ 
                message: 'Administrators cannot register for events'
            });
        }
        
        // Find the event
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        // Check if event is already completed or cancelled
        if (event.status === 'completed' || event.status === 'cancelled') {
            return res.status(400).json({ 
                message: `Cannot register for ${event.status} event` 
            });
        }
        
        // Check if user is already registered
        if (event.isUserRegistered(req.user._id)) {
            return res.status(400).json({ 
                message: 'You are already registered for this event' 
            });
        }
        
        // Check if event has reached its capacity
        if (event.isAtCapacity()) {
            return res.status(400).json({
                message: 'This event has reached its maximum capacity'
            });
        }
        
        // Generate QR code for this registration
        const qrCodeData = await generateRegistrationQR(
            event._id.toString(),
            req.user._id.toString(),
            req.user.name
        );
        
        // Add user to attendees with name and QR code
        event.attendees.push({
            userId: req.user._id,
            name: req.user.name,
            registeredAt: new Date(),
            qrCode: qrCodeData.qrCodeId,
            qrCodeData: qrCodeData.qrCodeData
        });
        
        // Save changes
        await event.save();
        
        // Return success response with the updated event and QR code
        const formattedEvent = formatEventData(event, req.user._id, req.user.role);
        formattedEvent.isAtCapacity = event.isAtCapacity();
        
        // Find the current user's attendee record to include QR code
        const userAttendee = event.attendees.find(
            attendee => attendee.userId.toString() === req.user._id.toString()
        );
        
        res.status(200).json({ 
            message: 'Successfully registered for event',
            event: formattedEvent,
            qrCode: {
                qrCodeId: qrCodeData.qrCodeId,
                qrCodeImage: qrCodeData.qrCodeImage
            }
        });
    } catch (error) {
        console.error('Error registering for event:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Cancel registration for an event
 */
exports.cancelRegistration = async (req, res) => {
    try {
        // Find the event
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        // Check if user is registered for the event
        if (!event.isUserRegistered(req.user._id)) {
            return res.status(400).json({ 
                message: 'You are not registered for this event' 
            });
        }
        
        // Remove user from attendees
        event.attendees = event.attendees.filter(
            attendee => attendee.userId.toString() !== req.user._id.toString()
        );
        
        // Save changes
        await event.save();
        
        // Return success with updated event
        const formattedEvent = formatEventData(event, req.user._id, req.user.role);
        res.status(200).json({ 
            message: 'Registration cancelled successfully',
            event: formattedEvent
        });
    } catch (error) {
        console.error('Error cancelling registration:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get attendees for an event
 */
exports.getEventAttendees = async (req, res) => {
    try {
        // Find the event and populate attendees
        const event = await Event.findById(req.params.id)
            .populate('attendees.userId', 'name email');
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        res.json(event.attendees);
    } catch (error) {
        console.error('Error fetching attendees:', error);
        
        // Check if error is due to invalid ID format
        if (error instanceof mongoose.Error.CastError) {
            return res.status(400).json({ message: 'Invalid event ID' });
        }
        
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get events a user is attending
 */
exports.getUserEvents = async (req, res) => {
    try {
        // Find events where user is an attendee
        const events = await Event.find({
            'attendees.userId': req.user._id
        }).sort({ startDate: 1 });
        
        res.json(events);
    } catch (error) {
        console.error('Error fetching user events:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Mark attendance for a specific user in an event
 */
exports.markAttendance = async (req, res) => {
    try {
        const { userId, attended } = req.body;
        
        // Find the event
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        // Check if user is the organizer or admin
        if (event.organizer.id.toString() !== req.user._id.toString() && 
            req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Not authorized to mark attendance for this event' 
            });
        }
        
        // Validate userId
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        
        try {
            // Mark attendance using the model method
            const attendee = event.markAttendance(userId, attended);
            
            // Save the event
            await event.save();
            
            res.json({ 
                message: `Attendance ${attended ? 'marked' : 'unmarked'} successfully`,
                attendee: {
                    userId: attendee.userId,
                    name: attendee.name,
                    attended: attendee.attended,
                    attendedAt: attendee.attendedAt
                }
            });
        } catch (modelError) {
            return res.status(400).json({ message: modelError.message });
        }
    } catch (error) {
        console.error('Error marking attendance:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get attendance list for an event
 */
exports.getAttendanceList = async (req, res) => {
    try {
        // Find the event
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        // Check if user is the organizer or admin
        if (event.organizer.id.toString() !== req.user._id.toString() && 
            req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Not authorized to view attendance for this event' 
            });
        }
        
        // Get attendance statistics
        const stats = event.getAttendanceStats();
        
        // Format attendee data
        const attendeeList = event.attendees.map(attendee => ({
            userId: attendee.userId,
            name: attendee.name,
            registeredAt: attendee.registeredAt,
            attended: attendee.attended,
            attendedAt: attendee.attendedAt
        }));
        
        res.json({
            eventId: event._id,
            eventTitle: event.title,
            stats,
            attendees: attendeeList
        });
    } catch (error) {
        console.error('Error fetching attendance list:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Bulk mark attendance for multiple users
 */
exports.bulkMarkAttendance = async (req, res) => {
    try {
        const { attendanceData } = req.body; // Array of { userId, attended }
        
        // Find the event
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        // Check if user is the organizer or admin
        if (event.organizer.id.toString() !== req.user._id.toString() && 
            req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Not authorized to mark attendance for this event' 
            });
        }
        
        // Validate input
        if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
            return res.status(400).json({ message: 'Invalid attendance data' });
        }
        
        const results = [];
        const errors = [];
        
        // Process each attendance record
        for (const { userId, attended } of attendanceData) {
            try {
                const attendee = event.markAttendance(userId, attended);
                results.push({
                    userId: attendee.userId,
                    name: attendee.name,
                    attended: attendee.attended,
                    success: true
                });
            } catch (modelError) {
                errors.push({
                    userId,
                    error: modelError.message
                });
            }
        }
        
        // Save the event
        await event.save();
        
        // Get updated statistics
        const stats = event.getAttendanceStats();
        
        res.json({
            message: 'Bulk attendance update completed',
            stats,
            results,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Error in bulk mark attendance:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Download QR code for user's registration
 */
exports.downloadQRCode = async (req, res) => {
    try {
        // Find the event
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        // Find user's registration
        const userAttendee = event.attendees.find(
            attendee => attendee.userId.toString() === req.user._id.toString()
        );
        
        if (!userAttendee) {
            return res.status(404).json({ 
                message: 'You are not registered for this event' 
            });
        }
        
        // Generate QR code buffer for download
        const qrBuffer = await generateQRBuffer(userAttendee.qrCodeData);
        
        // Set headers for file download
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="event-qr-${event.title.replace(/[^a-zA-Z0-9]/g, '-')}.png"`);
        
        // Send the QR code image
        res.send(qrBuffer);
    } catch (error) {
        console.error('Error downloading QR code:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Mark attendance using QR code scan
 */
exports.markAttendanceByQR = async (req, res) => {
    try {
        const { qrCodeData } = req.body;
        
        // Find the event
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        // Check if user is the organizer or admin
        if (event.organizer.id.toString() !== req.user._id.toString() && 
            req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Not authorized to mark attendance for this event' 
            });
        }
        
        // Validate QR code
        const validation = validateAttendanceQR(qrCodeData, req.params.id);
        
        if (!validation.valid) {
            return res.status(400).json({ message: validation.error });
        }
        
        const { userId, qrCodeId } = validation.data;
        
        // Find the attendee by QR code ID
        const attendee = event.attendees.find(
            att => att.qrCode === qrCodeId && att.userId.toString() === userId
        );
        
        if (!attendee) {
            return res.status(404).json({ 
                message: 'Invalid QR code or attendee not found' 
            });
        }
        
        // Check if already marked present
        if (attendee.attended) {
            return res.status(400).json({ 
                message: `${attendee.name} is already marked as present` 
            });
        }
        
        // Mark attendance
        attendee.attended = true;
        attendee.attendedAt = new Date();
        
        // Save the event
        await event.save();
        
        res.json({ 
            message: `Attendance marked successfully for ${attendee.name}`,
            attendee: {
                userId: attendee.userId,
                name: attendee.name,
                attended: attendee.attended,
                attendedAt: attendee.attendedAt
            }
        });
    } catch (error) {
        console.error('Error marking attendance by QR:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get user's QR code for an event
 */
exports.getUserQRCode = async (req, res) => {
    try {
        // Find the event
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        // Find user's registration
        const userAttendee = event.attendees.find(
            attendee => attendee.userId.toString() === req.user._id.toString()
        );
        
        if (!userAttendee) {
            return res.status(404).json({ 
                message: 'You are not registered for this event' 
            });
        }
        
        // Parse QR code data to get the original QR code image
        const qrData = JSON.parse(userAttendee.qrCodeData);
        
        // Generate QR code image
        const QRCode = require('qrcode');
        const qrCodeImage = await QRCode.toDataURL(userAttendee.qrCodeData, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            quality: 0.92,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            width: 256
        });
        
        res.json({
            qrCodeId: userAttendee.qrCode,
            qrCodeImage: qrCodeImage,
            eventTitle: event.title,
            userName: userAttendee.name,
            registeredAt: userAttendee.registeredAt
        });
    } catch (error) {
        console.error('Error getting user QR code:', error);
        res.status(500).json({ message: 'Server error' });
    }
}; 