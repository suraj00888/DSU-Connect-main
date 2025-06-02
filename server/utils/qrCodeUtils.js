const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique QR code for event registration
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @param {string} userName - User name
 * @returns {Object} - QR code data and base64 image
 */
const generateRegistrationQR = async (eventId, userId, userName) => {
    try {
        // Generate unique QR code identifier
        const qrCodeId = uuidv4();
        
        // Create QR code data object
        const qrData = {
            type: 'event_attendance',
            eventId: eventId,
            userId: userId,
            userName: userName,
            qrCodeId: qrCodeId,
            timestamp: new Date().toISOString()
        };
        
        // Convert to JSON string for QR code
        const qrDataString = JSON.stringify(qrData);
        
        // Generate QR code as base64 image
        const qrCodeImage = await QRCode.toDataURL(qrDataString, {
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
        
        return {
            qrCodeId: qrCodeId,
            qrCodeData: qrDataString,
            qrCodeImage: qrCodeImage
        };
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw new Error('Failed to generate QR code');
    }
};

/**
 * Validate QR code data for attendance marking
 * @param {string} qrDataString - QR code data string
 * @param {string} eventId - Expected event ID
 * @returns {Object} - Validation result and parsed data
 */
const validateAttendanceQR = (qrDataString, eventId) => {
    try {
        // Parse QR code data
        const qrData = JSON.parse(qrDataString);
        
        // Validate QR code structure
        if (!qrData.type || qrData.type !== 'event_attendance') {
            return {
                valid: false,
                error: 'Invalid QR code type'
            };
        }
        
        // Validate event ID
        if (!qrData.eventId || qrData.eventId !== eventId) {
            return {
                valid: false,
                error: 'QR code is not for this event'
            };
        }
        
        // Validate required fields
        if (!qrData.userId || !qrData.qrCodeId) {
            return {
                valid: false,
                error: 'Invalid QR code data'
            };
        }
        
        return {
            valid: true,
            data: qrData
        };
    } catch (error) {
        return {
            valid: false,
            error: 'Invalid QR code format'
        };
    }
};

/**
 * Generate QR code for download (returns buffer)
 * @param {string} qrDataString - QR code data string
 * @returns {Buffer} - QR code image buffer
 */
const generateQRBuffer = async (qrDataString) => {
    try {
        return await QRCode.toBuffer(qrDataString, {
            errorCorrectionLevel: 'M',
            type: 'png',
            quality: 0.92,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            width: 512
        });
    } catch (error) {
        console.error('Error generating QR code buffer:', error);
        throw new Error('Failed to generate QR code');
    }
};

module.exports = {
    generateRegistrationQR,
    validateAttendanceQR,
    generateQRBuffer
}; 