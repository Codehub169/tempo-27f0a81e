import React, { createContext, useState, useContext, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import { loginUser, logoutUser } from '../services/authService'; // Actual service for login and logout

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem('eyeClinicUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem('eyeClinicUser'); // Clean up corrupted data
        localStorage.removeItem('eyeClinicUserToken'); // Also remove token if user data is corrupt
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const userDataFromService = await loginUser({ email, password }); // authService.loginUser handles API call and localStorage
      
      if (userDataFromService) {
        setUser(userDataFromService);
        toast({
          title: 'Login Successful',
          // Assuming backend user object has 'username' rather than 'name'
          description: `Welcome back, ${userDataFromService.username || 'User'}!`, 
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setLoading(false);
        return true;
      } else {
        // This case implies loginUser returned falsy without throwing an error, which is unexpected
        // if authService.loginUser is designed to throw on any failure.
        throw new Error('Login service did not return user data or token.');
      }
    } catch (error) {
      console.error("Login failed in AuthContext:", error);
      toast({
        title: 'Login Failed',
        description: error.data?.msg || error.message || 'Invalid email or password.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser(); // authService.logoutUser handles API call (if any) and clearing localStorage
      setUser(null);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      // Even if backend logout fails, client-side state should be cleared.
      // authService.logoutUser should ensure localStorage is cleared in its finally block.
      console.error("Logout failed in AuthContext (service call error):", error);
      setUser(null); // Ensure client state is cleared
      toast({
        title: 'Logout Error',
        description: 'Could not properly logout from server. Client session cleared.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = !!user; 

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined || context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
