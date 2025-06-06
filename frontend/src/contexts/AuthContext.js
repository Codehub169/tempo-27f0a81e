import React, { createContext, useState, useContext, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import { loginUser, logoutUser } from '../services/authService'; // Mock service

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    // Check for existing token or user session (e.g., in localStorage)
    const storedUser = localStorage.getItem('eyeClinicUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem('eyeClinicUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      // const userData = await loginUser(email, password); // API call
      // Mock login for now:
      if (email === 'admin@example.com' && password === 'password') {
        const userData = {
          id: 'user123',
          name: 'Dr. Admin',
          email: 'admin@example.com',
          role: 'admin',
          avatarUrl: 'https://i.pravatar.cc/40?u=admin'
          // token: 'fake-jwt-token' // In a real app, you'd get a token
        };
        setUser(userData);
        localStorage.setItem('eyeClinicUser', JSON.stringify(userData));
        toast({
          title: 'Login Successful',
          description: `Welcome back, ${userData.name}!`, 
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setLoading(false);
        return true;
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid email or password.',
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
    // await logoutUser(); // API call
    setUser(null);
    localStorage.removeItem('eyeClinicUser');
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
    setLoading(false);
    // Typically, you would redirect to login page here from the component calling logout
  };

  const isAuthenticated = !!user; // True if user object exists

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
