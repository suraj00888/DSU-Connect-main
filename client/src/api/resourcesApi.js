import api from './index';

/**
 * Resources API service
 * Provides methods for interacting with the resources endpoints
 */
const resourcesApi = {
  /**
   * Get resources with optional filtering
   * @param {Object} params - Query parameters for filtering, searching, and pagination
   * @returns {Promise} - API response
   */
  getResources: async (params = {}) => {
    try {
      const response = await api.get('/api/resources', { params });
      return response.data || { resources: [], pagination: {} };
    } catch (error) {
      console.error('API Error in getResources:', error);
      throw error.response?.data || { message: 'Failed to fetch resources' };
    }
  },

  /**
   * Get a single resource by ID
   * @param {string} id - Resource ID
   * @returns {Promise} - API response
   */
  getResource: async (id) => {
    try {
      const response = await api.get(`/api/resources/${id}`);
      return response.data || null;
    } catch (error) {
      console.error('API Error in getResource:', error);
      throw error.response?.data || { message: 'Failed to fetch resource details' };
    }
  },

  /**
   * Upload a new resource
   * @param {FormData} formData - Form data including file and metadata
   * @returns {Promise} - API response
   */
  uploadResource: async (formData) => {
    try {
      const response = await api.post('/api/resources/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('API Error in uploadResource:', error);
      throw error.response?.data || { message: 'Failed to upload resource' };
    }
  },

  /**
   * Delete a resource
   * @param {string} id - Resource ID
   * @returns {Promise} - API response
   */
  deleteResource: async (id) => {
    try {
      const response = await api.delete(`/api/resources/${id}`);
      return response.data;
    } catch (error) {
      console.error('API Error in deleteResource:', error);
      throw error.response?.data || { message: 'Failed to delete resource' };
    }
  },

  /**
   * Track a resource download
   * @param {string} id - Resource ID
   * @returns {Promise} - API response with download URL
   */
  trackDownload: async (id) => {
    try {
      const response = await api.post(`/api/resources/${id}/download`);
      return response.data;
    } catch (error) {
      console.error('API Error in trackDownload:', error);
      throw error.response?.data || { message: 'Failed to track download' };
    }
  }
};

export { resourcesApi };
export default resourcesApi; 