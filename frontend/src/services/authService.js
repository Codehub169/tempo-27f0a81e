// frontend/src/services/authService.js
import api from './apiService'; // Using the default export

const AUTH_STORAGE_KEY = 'eyeClinicUser';
const TOKEN_STORAGE_KEY = 'eyeClinicUserToken';

/**
 * Logs in a user.
 * @param {object} credentials - User credentials (e.g., { email, password }).
 * @returns {Promise<object>} - The user object from the API.
 */
export const loginUser = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    // Assuming the backend returns an object like { user: { ... }, token: '...' }
    if (response && response.token && response.user) {
      localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response.user));
      return response.user;
    } else {
      // Handle cases where token or user might be missing in response despite 2xx status
      throw new Error('Login successful, but token or user data missing in response.');
    }
  } catch (error) {
    console.error('Login service error:', error.message);
    // Propagate the error so UI can display it
    throw error; 
  }
};

/**
 * Logs out a user.
 * Clears user data and token from localStorage.
 * Optionally calls a backend logout endpoint.
 */
export const logoutUser = async () => {
  try {
    // Optional: Call backend logout endpoint if it exists and needs to invalidate server-side session/token.
    // await api.post('/auth/logout');
    // This is often good practice for security (e.g., blacklisting token).
  } catch (error) {
    // Log error but proceed with client-side cleanup as logout should always succeed on client.
    console.error('Backend logout API call failed:', error.message);
  } finally {
    // Always clear client-side storage regardless of backend call success/failure.
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    // Potentially notify other parts of the app if needed, though context usually handles this.
  }
};

/**
 * Retrieves the currently authenticated user's data from localStorage.
 * @returns {object|null} - The user object or null if not found.
 */
export const getCurrentUser = () => {
  try {
    const userString = localStorage.getItem(AUTH_STORAGE_KEY);
    return userString ? JSON.parse(userString) : null;
  } catch (error) {
    console.error('Failed to get current user from localStorage:', error.message);
    // If data is corrupted, clear it to prevent further issues.
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

/**
 * Retrieves the auth token from localStorage.
 * @returns {string|null} - The auth token or null if not found.
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

/**
 * Checks if a user is currently authenticated (i.e., a token exists).
 * This is a lightweight check; actual token validity is usually verified by the backend.
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!getToken();
};

// Example of a function to fetch user profile if token is present but full user data isn't needed on every load
// export const fetchUserProfile = async () => {
//   try {
//     if (!isAuthenticated()) throw new Error('No token available for fetching profile.');
//     const user = await api.get('/auth/me'); // Assuming an endpoint like /auth/me or /users/profile
//     localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
//     return user;
//   } catch (error) {
//     console.error('Failed to fetch user profile:', error.message);
//     // If fetching profile fails (e.g. token expired), clear auth data
//     if (error.status === 401 || error.status === 403) {
//        logoutUser(); // This will clear local storage
//     }
//     throw error;
//   }
// };
