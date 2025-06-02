import api from './index';

/**
 * Events API service
 * Provides methods for interacting with the events endpoints
 */
const eventsApi = {
  /**
   * Get events with optional filtering
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response
   */
  getEvents: async (params = {}) => {
    try {
      const response = await api.get('/api/events', { params });
      // Check if response.data contains events property, otherwise return the data itself
      return response.data?.events ? response.data.events : response.data || [];
    } catch (error) {
      console.error('API Error in getEvents:', error);
      throw error.response?.data || { message: 'Failed to fetch events' };
    }
  },

  /**
   * Get a single event by ID
   * @param {string} id - Event ID
   * @returns {Promise} - API response
   */
  getEvent: async (id) => {
    try {
      const response = await api.get(`/api/events/${id}`);
      return response.data || null;
    } catch (error) {
      console.error('API Error in getEvent:', error);
      throw error.response?.data || { message: 'Failed to fetch event details' };
    }
  },

  /**
   * Get events that the current user is attending
   * @returns {Promise} - API response
   */
  getUserEvents: async () => {
    try {
      const response = await api.get('/api/events/user/attending');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('API Error in getUserEvents:', error);
      throw error.response?.data || { message: 'Failed to fetch your events' };
    }
  },

  /**
   * Create a new event
   * @param {Object} eventData - Event data
   * @returns {Promise} - API response
   */
  createEvent: async (eventData) => {
    try {
      const response = await api.post('/api/events', eventData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create event' };
    }
  },

  /**
   * Update an existing event
   * @param {string} id - Event ID
   * @param {Object} eventData - Updated event data
   * @returns {Promise} - API response
   */
  updateEvent: async (id, eventData) => {
    try {
      const response = await api.put(`/api/events/${id}`, eventData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update event' };
    }
  },

  /**
   * Delete an event
   * @param {string} id - Event ID
   * @returns {Promise} - API response
   */
  deleteEvent: async (id) => {
    try {
      const response = await api.delete(`/api/events/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete event' };
    }
  },

  /**
   * Register for an event
   * @param {string} id - Event ID
   * @returns {Promise} - API response
   */
  registerForEvent: async (id) => {
    try {
      const response = await api.post(`/api/events/${id}/register`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to register for event' };
    }
  },

  /**
   * Cancel registration for an event
   * @param {string} id - Event ID
   * @returns {Promise} - API response
   */
  cancelRegistration: async (id) => {
    try {
      const response = await api.delete(`/api/events/${id}/register`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to cancel registration' };
    }
  },

  /**
   * Get attendees for an event
   * @param {string} id - Event ID
   * @returns {Promise} - API response
   */
  getEventAttendees: async (id) => {
    try {
      const response = await api.get(`/api/events/${id}/attendees`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch attendees' };
    }
  },

  /**
   * Get attendance list for an event
   * @param {string} id - Event ID
   * @returns {Promise} - API response
   */
  getAttendanceList: async (id) => {
    try {
      const response = await api.get(`/api/events/${id}/attendance`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch attendance list' };
    }
  },

  /**
   * Mark attendance for a user in an event
   * @param {string} id - Event ID
   * @param {string} userId - User ID
   * @param {boolean} attended - Attendance status
   * @returns {Promise} - API response
   */
  markAttendance: async (id, userId, attended) => {
    try {
      const response = await api.post(`/api/events/${id}/attendance`, {
        userId,
        attended
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to mark attendance' };
    }
  },

  /**
   * Bulk mark attendance for multiple users
   * @param {string} id - Event ID
   * @param {Array} attendanceData - Array of attendance data
   * @returns {Promise} - API response
   */
  bulkMarkAttendance: async (id, attendanceData) => {
    try {
      const response = await api.post(`/api/events/${id}/attendance/bulk`, {
        attendanceData
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to bulk mark attendance' };
    }
  },

  /**
   * Get user's QR code for an event
   * @param {string} id - Event ID
   * @returns {Promise} - API response with QR code data
   */
  getUserQRCode: async (id) => {
    try {
      const response = await api.get(`/api/events/${id}/qr-code`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get QR code' };
    }
  },

  /**
   * Download QR code as image file
   * @param {string} id - Event ID
   * @returns {Promise} - Blob response
   */
  downloadQRCode: async (id) => {
    try {
      const response = await api.get(`/api/events/${id}/qr-code/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to download QR code' };
    }
  },

  /**
   * Mark attendance using QR code scan
   * @param {string} id - Event ID
   * @param {string} qrCodeData - QR code data string
   * @returns {Promise} - API response
   */
  markAttendanceByQR: async (id, qrCodeData) => {
    try {
      const response = await api.post(`/api/events/${id}/attendance/qr`, {
        qrCodeData
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to mark attendance by QR' };
    }
  }
};

export { eventsApi };
export default eventsApi; 