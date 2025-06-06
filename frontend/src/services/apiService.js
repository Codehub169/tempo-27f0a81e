// frontend/src/services/apiService.js

const BASE_URL = process.env.REACT_APP_API_URL || '/api';

/**
 * A utility function to make API requests.
 * @param {string} endpoint - The API endpoint (e.g., '/users').
 * @param {string} [method='GET'] - HTTP method.
 * @param {object|FormData|null} [body=null] - Request body for POST, PUT, PATCH.
 * @param {boolean} [isFormData=false] - Set to true if body is FormData.
 * @returns {Promise<any>} - The JSON response from the API.
 */
const request = async (endpoint, method = 'GET', body = null, isFormData = false) => {
  const headers = {};
  
  // Set Content-Type header unless it's FormData (browser sets it with boundary)
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  // Retrieve token from localStorage (adjust if stored differently, e.g., via auth context/service)
  const token = localStorage.getItem('eyeClinicUserToken'); 
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    // Handle cases where response might not have a body (e.g., 204 No Content)
    if (response.status === 204) {
      return null; 
    }

    const responseData = await response.json().catch(e => {
      // If response.json() fails, it means body is not JSON or empty
      // We still need to check if the request was successful by status code
      if (response.ok) return null; // Successful but no json body (e.g. plain text)
      return { message: response.statusText || 'Failed to parse JSON response' }; // Construct an error object
    });

    if (!response.ok) {
      // Prefer message from JSON body, fallback to statusText
      const errorMessage = responseData?.message || response.statusText || `HTTP error! Status: ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = responseData; // Attach full response data to error if available
      throw error;
    }
    
    return responseData;
  } catch (error) {
    console.error(`API Error (${method} ${BASE_URL}${endpoint}):`, error.message);
    // Re-throw the error so it can be caught by the calling function
    // This allows UI components to handle errors appropriately (e.g., show toast)
    throw error; 
  }
};

export const api = {
  get: (endpoint, params) => {
    let url = endpoint;
    if (params) {
      const queryParams = new URLSearchParams(params);
      url += `?${queryParams.toString()}`;
    }
    return request(url);
  },
  post: (endpoint, body, isFormData = false) => request(endpoint, 'POST', body, isFormData),
  put: (endpoint, body, isFormData = false) => request(endpoint, 'PUT', body, isFormData),
  patch: (endpoint, body, isFormData = false) => request(endpoint, 'PATCH', body, isFormData),
  delete: (endpoint) => request(endpoint, 'DELETE'),
};

export default api;
