import axios from 'axios';

const API_URL = '/api/resources';

/**
 * Fetch resources with optional filters
 * 
 * @param {Object} filters - Query parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise} Promise with resource data
 */
export const fetchResources = async (filters = {}, page = 1, limit = 12) => {
  const queryParams = new URLSearchParams();
  
  // Add filters to query params
  if (filters.search) queryParams.append('search', filters.search);
  if (filters.category) queryParams.append('category', filters.category);
  if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
  
  // Add pagination
  queryParams.append('page', page);
  queryParams.append('limit', limit);
  
  const response = await axios.get(`${API_URL}?${queryParams}`);
  return response.data;
};

/**
 * Create a new resource
 * 
 * @param {Object} resourceData - Resource data
 * @param {File} file - File to upload
 * @returns {Promise} Promise with created resource
 */
export const createResource = async (resourceData, file) => {
  const formData = new FormData();
  
  // Append resource data
  Object.keys(resourceData).forEach(key => {
    if (Array.isArray(resourceData[key])) {
      formData.append(key, JSON.stringify(resourceData[key]));
    } else {
      formData.append(key, resourceData[key]);
    }
  });
  
  // Append file
  formData.append('file', file);
  
  const response = await axios.post(API_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data;
};

/**
 * Get resource by ID
 * 
 * @param {string} id - Resource ID
 * @returns {Promise} Promise with resource data
 */
export const getResourceById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

/**
 * Update resource
 * 
 * @param {string} id - Resource ID
 * @param {Object} resourceData - Updated resource data
 * @returns {Promise} Promise with updated resource
 */
export const updateResource = async (id, resourceData) => {
  const response = await axios.put(`${API_URL}/${id}`, resourceData);
  return response.data;
};

/**
 * Delete resource
 * 
 * @param {string} id - Resource ID
 * @returns {Promise} Promise with deleted resource
 */
export const deleteResource = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};

/**
 * Download resource
 * 
 * @param {string} id - Resource ID
 * @returns {Promise} Promise with download URL
 */
export const downloadResource = async (id) => {
  const response = await axios.get(`${API_URL}/${id}/download`);
  return response.data;
};

/**
 * Increment resource view count
 * 
 * @param {string} id - Resource ID
 * @returns {Promise} Promise with updated resource
 */
export const incrementResourceViews = async (id) => {
  const response = await axios.post(`${API_URL}/${id}/view`);
  return response.data;
}; 