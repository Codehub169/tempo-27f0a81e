import React from 'react';
import { Box, VStack, Text, Image, Flex, Heading, Link as ChakraLink, Icon } from '@chakra-ui/react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiHome, FiCalendar, FiUsers, FiHeart, FiArchive, FiFileText, FiPieChart, FiSettings, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext'; // Assuming AuthContext is in this path
import EyeLogo from '../../assets/eye-logo.svg';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: FiHome },
  { label: 'Appointments', path: '/appointments', icon: FiCalendar },
  { label: 'Patients', path: '/patients', icon: FiUsers },
  { label: 'Doctors', path: '/doctors', icon: FiHeart }, // FiHeart as a placeholder for doctor/stethoscope
  { label: 'Inventory', path: '/inventory', icon: FiArchive },
  { label: 'Billing', path: '/billing', icon: FiFileText },
  { label: 'Reports', path: '/reports', icon: FiPieChart },
];

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const activeLinkStyle = {
    backgroundColor: 'gray.700', // Corresponds to #495057 from mockup
    color: 'white',
  };

  return (
    <Box
      as="aside"
      w={{ base: 'full', md: '260px' }} // Responsive width
      bg="neutral.darkGray" // Using theme color: neutral.darkGray (#343A40)
      color="neutral.lightGray" // Using theme color for text
      p="20px"
      display="flex"
      flexDirection="column"
      position="fixed"
      top="0"
      left="0"
      bottom="0"
      zIndex="1000"
    >
      <Flex align="center" pb="30px" borderBottom="1px solid" borderColor="gray.700" mb="20px">
        <Image src={EyeLogo} alt="EyeClinic Logo" boxSize="36px" mr="12px" />
        <Heading as="h1" size="md" color="white" fontFamily="secondary">
          EyeClinic
        </Heading>
      </Flex>

      <VStack as="nav" spacing="8px" align="stretch" flexGrow={1}>
        {navItems.map((item) => (
          <ChakraLink
            key={item.label}
            as={NavLink}
            to={item.path}
            display="flex"
            alignItems="center"
            p="12px 15px"
            color="gray.400" // Corresponds to #adb5bd
            borderRadius="md" // 6px
            fontWeight="medium"
            _hover={{
              bg: 'gray.700',
              color: 'white',
            }}
            _activeLink={activeLinkStyle}
            style={({ isActive }) => (isActive ? activeLinkStyle : undefined)}
          >
            <Icon as={item.icon} boxSize="20px" mr="12px" />
            {item.label}
          </ChakraLink>
        ))}
      </VStack>

      <VStack as="nav" spacing="8px" align="stretch" pt="20px" borderTop="1px solid" borderColor="gray.700">
        <ChakraLink
          as={NavLink}
          to="/settings"
          display="flex"
          alignItems="center"
          p="12px 15px"
          color="gray.400"
          borderRadius="md"
          fontWeight="medium"
          _hover={{
            bg: 'gray.700',
            color: 'white',
          }}
          _activeLink={activeLinkStyle}
          style={({ isActive }) => (isActive ? activeLinkStyle : undefined)}
        >
          <Icon as={FiSettings} boxSize="20px" mr="12px" />
          Settings
        </ChakraLink>
        <ChakraLink
          onClick={handleLogout}
          display="flex"
          alignItems="center"
          p="12px 15px"
          color="gray.400"
          borderRadius="md"
          fontWeight="medium"
          cursor="pointer"
          _hover={{
            bg: 'gray.700',
            color: 'white',
          }}
        >
          <Icon as={FiLogOut} boxSize="20px" mr="12px" />
          Logout
        </ChakraLink>
      </VStack>
    </Box>
  );
};

export default Sidebar;
