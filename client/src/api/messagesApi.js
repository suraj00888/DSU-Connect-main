import api from './index';

/**
 * Messages API service
 * Provides methods for interacting with the messages endpoints
 */
const messagesApi = {
  /**
   * Get messages for a group with pagination
   * @param {string} groupId - Group ID
   * @param {Object} params - Query parameters for pagination
   * @returns {Promise} - API response
   */
  getMessages: async (groupId, params = {}) => {
    try {
      const response = await api.get(`/api/groups/${groupId}/messages`, { params });
      return response.data;
    } catch (error) {
      console.error('API Error in getMessages:', error);
      throw error.response?.data || { success: false, message: 'Failed to fetch messages' };
    }
  },

  /**
   * Send a new message to a group
   * @param {string} groupId - Group ID
   * @param {Object} messageData - Message data
   * @returns {Promise} - API response
   */
  sendMessage: async (groupId, messageData) => {
    try {
      const response = await api.post(`/api/groups/${groupId}/messages`, messageData);
      return response.data;
    } catch (error) {
      console.error('API Error in sendMessage:', error);
      throw error.response?.data || { success: false, message: 'Failed to send message' };
    }
  },

  /**
   * Update a message
   * @param {string} groupId - Group ID
   * @param {string} messageId - Message ID
   * @param {Object} messageData - Updated message data
   * @returns {Promise} - API response
   */
  updateMessage: async (groupId, messageId, messageData) => {
    try {
      const response = await api.put(`/api/groups/${groupId}/messages/${messageId}`, messageData);
      return response.data;
    } catch (error) {
      console.error('API Error in updateMessage:', error);
      throw error.response?.data || { success: false, message: 'Failed to update message' };
    }
  },

  /**
   * Delete a message
   * @param {string} groupId - Group ID
   * @param {string} messageId - Message ID
   * @returns {Promise} - API response
   */
  deleteMessage: async (groupId, messageId) => {
    try {
      const response = await api.delete(`/api/groups/${groupId}/messages/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('API Error in deleteMessage:', error);
      throw error.response?.data || { success: false, message: 'Failed to delete message' };
    }
  },

  /**
   * Like a message
   * @param {string} groupId - Group ID
   * @param {string} messageId - Message ID
   * @returns {Promise} - API response
   */
  likeMessage: async (groupId, messageId) => {
    try {
      const response = await api.post(`/api/groups/${groupId}/messages/${messageId}/like`);
      return response.data;
    } catch (error) {
      console.error('API Error in likeMessage:', error);
      throw error.response?.data || { success: false, message: 'Failed to like message' };
    }
  },

  /**
   * Unlike a message
   * @param {string} groupId - Group ID
   * @param {string} messageId - Message ID
   * @returns {Promise} - API response
   */
  unlikeMessage: async (groupId, messageId) => {
    try {
      const response = await api.post(`/api/groups/${groupId}/messages/${messageId}/unlike`);
      return response.data;
    } catch (error) {
      console.error('API Error in unlikeMessage:', error);
      throw error.response?.data || { success: false, message: 'Failed to unlike message' };
    }
  }
};

export default messagesApi; 