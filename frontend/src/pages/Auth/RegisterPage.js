import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Button, FormControl, FormLabel, Input, VStack, Heading, Text, useToast, Flex, Icon, Link, FormErrorMessage
} from '@chakra-ui/react';
import { FiEye, FiUserPlus } from 'react-icons/fi'; // Using FiEye as a placeholder for the logo
import api from '../../services/apiService'; // For making API calls

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const toast = useToast();

  const validateForm = () => {
    const newErrors = {};
    if (!username.trim()) newErrors.username = 'Username is required.';
    else if (username.trim().length < 3) newErrors.username = 'Username must be at least 3 characters.';
    
    if (!email.trim()) newErrors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format.';
    
    if (!password) newErrors.password = 'Password is required.';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
    
    if (!confirmPassword) newErrors.confirmPassword = 'Confirm password is required.';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userData = { username, email, password };
      // The backend /api/auth/register endpoint will handle this data
      await api.post('/auth/register', userData);
      
      toast({
        title: 'Registration Successful',
        description: 'Your account has been created. Please login.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      navigate('/login');
    } catch (error) {
      const errorMsg = error.data?.msg || error.message || 'Registration failed. Please try again.';
      toast({
        title: 'Registration Error',
        description: errorMsg,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.50">
      <Box 
        p={8} 
        maxWidth="450px" 
        borderWidth={1} 
        borderRadius={12} 
        boxShadow="xl" 
        bg="white"
        textAlign="center"
        w="full"
      >
        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            <Icon as={FiUserPlus} w={12} h={12} color="brand.500" mx="auto" />
            <Heading as="h1" size="xl" mt={2} color="brand.600" fontFamily="heading">
              Create Account
            </Heading>
            <Text fontSize="md" color="gray.600">
              Join EyeClinic today!
            </Text>
          </Box>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl id="username" isInvalid={!!errors.username}>
                <FormLabel>Username</FormLabel>
                <Input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder="Choose a username"
                  focusBorderColor="brand.400"
                  autoComplete="username"
                />
                {errors.username && <FormErrorMessage>{errors.username}</FormErrorMessage>}
              </FormControl>

              <FormControl id="email" isInvalid={!!errors.email}>
                <FormLabel>Email Address</FormLabel>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="you@example.com"
                  focusBorderColor="brand.400"
                  autoComplete="email"
                />
                {errors.email && <FormErrorMessage>{errors.email}</FormErrorMessage>}
              </FormControl>

              <FormControl id="password" isInvalid={!!errors.password}>
                <FormLabel>Password</FormLabel>
                <Input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Create a password (min. 6 characters)"
                  focusBorderColor="brand.400"
                  autoComplete="new-password"
                />
                {errors.password && <FormErrorMessage>{errors.password}</FormErrorMessage>}
              </FormControl>

              <FormControl id="confirmPassword" isInvalid={!!errors.confirmPassword}>
                <FormLabel>Confirm Password</FormLabel>
                <Input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="Confirm your password"
                  focusBorderColor="brand.400"
                  autoComplete="new-password"
                />
                {errors.confirmPassword && <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>}
              </FormControl>

              <Button 
                type="submit" 
                colorScheme="brand" 
                width="full" 
                isLoading={loading}
                mt={4}
              >
                Sign Up
              </Button>
            </VStack>
          </form>

          <Text fontSize="sm" color="gray.500" mt={4}>
            Already have an account? <Link as={RouterLink} to="/login" color="brand.500" fontWeight="medium" _hover={{ textDecoration: 'underline' }}>Login here</Link>
          </Text>
        </VStack>
      </Box>
    </Flex>
  );
};

export default RegisterPage;
