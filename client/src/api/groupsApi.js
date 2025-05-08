import api from './index';

/**
 * Groups API service
 * Provides methods for interacting with the groups endpoints
 */
const groupsApi = {
  /**
   * Get all groups with optional filtering
   * @param {Object} params - Query parameters for filtering and searching
   * @returns {Promise} - API response
   */
  getGroups: async (params = {}) => {
    try {
      const response = await api.get('/api/groups', { params });
      return response.data;
    } catch (error) {
      console.error('API Error in getGroups:', error);
      throw error.response?.data || { success: false, message: 'Failed to fetch groups' };
    }
  },

  /**
   * Get a single group by ID
   * @param {string} id - Group ID
   * @returns {Promise} - API response
   */
  getGroup: async (id) => {
    try {
      const response = await api.get(`/api/groups/${id}`);
      return response.data;
    } catch (error) {
      console.error('API Error in getGroup:', error);
      throw error.response?.data || { success: false, message: 'Failed to fetch group details' };
    }
  },

  /**
   * Create a new group
   * @param {Object} groupData - Group data
   * @returns {Promise} - API response
   */
  createGroup: async (groupData) => {
    try {
      const response = await api.post('/api/groups', groupData);
      return response.data;
    } catch (error) {
      console.error('API Error in createGroup:', error);
      throw error.response?.data || { success: false, message: 'Failed to create group' };
    }
  },

  /**
   * Update a group
   * @param {string} id - Group ID
   * @param {Object} groupData - Updated group data
   * @returns {Promise} - API response
   */
  updateGroup: async (id, groupData) => {
    try {
      const response = await api.put(`/api/groups/${id}`, groupData);
      return response.data;
    } catch (error) {
      console.error('API Error in updateGroup:', error);
      throw error.response?.data || { success: false, message: 'Failed to update group' };
    }
  },

  /**
   * Delete a group
   * @param {string} id - Group ID
   * @returns {Promise} - API response
   */
  deleteGroup: async (id) => {
    try {
      const response = await api.delete(`/api/groups/${id}`);
      return response.data;
    } catch (error) {
      console.error('API Error in deleteGroup:', error);
      throw error.response?.data || { success: false, message: 'Failed to delete group' };
    }
  },

  /**
   * Join a group
   * @param {string} id - Group ID
   * @returns {Promise} - API response
   */
  joinGroup: async (id) => {
    try {
      const response = await api.post(`/api/groups/${id}/join`);
      return response.data;
    } catch (error) {
      console.error('API Error in joinGroup:', error);
      throw error.response?.data || { success: false, message: 'Failed to join group' };
    }
  },

  /**
   * Leave a group
   * @param {string} id - Group ID
   * @returns {Promise} - API response
   */
  leaveGroup: async (id) => {
    try {
      const response = await api.post(`/api/groups/${id}/leave`);
      return response.data;
    } catch (error) {
      console.error('API Error in leaveGroup:', error);
      throw error.response?.data || { success: false, message: 'Failed to leave group' };
    }
  }
};

export default groupsApi; 