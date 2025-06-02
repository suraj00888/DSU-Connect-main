import api from './index';

/**
 * User API service
 * Provides methods for interacting with user endpoints
 */
const userApi = {
  /**
   * Get current user profile
   * @returns {Promise} - API response
   */
  getProfile: async () => {
    try {
      const response = await api.get('/api/user/profile');
      return response.data;
    } catch (error) {
      console.error('API Error in getProfile:', error);
      throw error.response?.data || { message: 'Failed to fetch profile' };
    }
  },

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} - API response
   */
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/api/user/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('API Error in updateProfile:', error);
      throw error.response?.data || { message: 'Failed to update profile' };
    }
  },

  /**
   * Update user password
   * @param {Object} passwordData - Password data
   * @returns {Promise} - API response
   */
  updatePassword: async (passwordData) => {
    try {
      const response = await api.put('/api/user/password', passwordData);
      return response.data;
    } catch (error) {
      console.error('API Error in updatePassword:', error);
      throw error.response?.data || { message: 'Failed to update password' };
    }
  },

  /**
   * Upload profile photo
   * @param {File} photoFile - Photo file to upload
   * @returns {Promise} - API response
   */
  uploadProfilePhoto: async (photoFile) => {
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);

      const response = await api.post('/api/user/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('API Error in uploadProfilePhoto:', error);
      throw error.response?.data || { message: 'Failed to upload profile photo' };
    }
  },

  /**
   * Delete profile photo
   * @returns {Promise} - API response
   */
  deleteProfilePhoto: async () => {
    try {
      const response = await api.delete('/api/user/photo');
      return response.data;
    } catch (error) {
      console.error('API Error in deleteProfilePhoto:', error);
      throw error.response?.data || { message: 'Failed to delete profile photo' };
    }
  }
};

export { userApi };
export default userApi; 