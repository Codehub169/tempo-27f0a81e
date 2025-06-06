import React, { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box, Button, FormControl, FormLabel, Input, VStack, Heading, Text, useToast, Flex, Icon, Link
} from '@chakra-ui/react';
import { FiEye } from 'react-icons/fi'; // Using FiEye as a placeholder for the logo
import { useAuth } from '../../contexts/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please enter both email and password.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    const success = await login(email, password);
    if (success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.50">
      <Box 
        p={8} 
        maxWidth="420px" 
        borderWidth={1} 
        borderRadius={12} 
        boxShadow="xl" 
        bg="white"
        textAlign="center"
        w="full"
      >
        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            <Icon as={FiEye} w={12} h={12} color="brand.500" mx="auto" />
            <Heading as="h1" size="xl" mt={2} color="brand.600" fontFamily="heading">
              EyeClinic Login
            </Heading>
            <Text fontSize="md" color="gray.600">
              Welcome back! Please login to your account.
            </Text>
          </Box>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl id="email">
                <FormLabel>Email Address</FormLabel>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="you@example.com"
                  focusBorderColor="brand.400"
                  autoComplete="email"
                />
              </FormControl>

              <FormControl id="password">
                <FormLabel>Password</FormLabel>
                <Input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="
privacy_text
"
                  focusBorderColor="brand.400"
                  autoComplete="current-password"
                />
              </FormControl>

              <Button 
                type="submit" 
                colorScheme="brand" 
                width="full" 
                isLoading={loading}
                mt={4}
              >
                Login
              </Button>
            </VStack>
          </form>

          <Text fontSize="sm" color="gray.500" mt={2}>
            Forgot Password? <Link href="#" color="brand.500" _hover={{ textDecoration: 'underline' }}>Click here</Link>
          </Text>
          <Text fontSize="sm" color="gray.500" mt={2}>
            Don't have an account? <Link as={RouterLink} to="/register" color="brand.500" fontWeight="medium" _hover={{ textDecoration: 'underline' }}>Sign Up</Link>
          </Text>
        </VStack>
      </Box>
    </Flex>
  );
};

export default LoginPage;
