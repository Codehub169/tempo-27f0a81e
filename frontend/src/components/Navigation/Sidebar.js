import React from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { Box, VStack, Link, Text, Icon, Divider, Heading } from '@chakra-ui/react';
import { FaTachometerAlt, FaUserMd, FaCalendarCheck, FaCog, FaSignOutAlt, FaFileInvoice, FaUsers } from 'react-icons/fa'; // Added FaUsers
import { useAuth } from '../../contexts/AuthContext'; 

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: FaTachometerAlt }, 
  { label: 'Appointments', path: '/appointments', icon: FaCalendarCheck },
  { label: 'Doctors', path: '/doctors', icon: FaUserMd }, 
  { label: 'Patients', path: '/patients', icon: FaUsers }, // Added Patients link
  { label: 'Invoices', path: '/invoices', icon: FaFileInvoice },
  // Add more primary navigation items here
];

const Sidebar = ({ onCloseDrawer }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (onCloseDrawer) {
      onCloseDrawer();
    }
  };

  const secondaryNavItems = [
    { label: 'Settings', path: '/settings', icon: FaCog },
    { label: 'Logout', icon: FaSignOutAlt, action: handleLogout },
  ];

  const handleLinkClick = (itemAction) => {
    if (itemAction) {
      itemAction(); 
    } 
    if (onCloseDrawer) {
      onCloseDrawer();
    }
  };

  const renderNavItem = (item) => {
    const isActive = !item.action && location.pathname === item.path;
    
    const linkProps = {
      key: item.label,
      display: "flex",
      alignItems: "center",
      p: "3",
      borderRadius: "md",
      role: "group",
      color: isActive ? 'white' : 'gray.700',
      bg: isActive ? 'primary.500' : 'transparent',
      _hover: {
        textDecoration: 'none',
        bg: isActive ? 'primary.600' : 'gray.100',
        color: isActive ? 'white' : 'gray.900',
      },
    };

    if (item.action) {
      linkProps.onClick = () => handleLinkClick(item.action);
      linkProps.cursor = "pointer";
    } else {
      linkProps.as = RouterLink;
      linkProps.to = item.path;
      linkProps.onClick = () => handleLinkClick(null); 
    }

    return (
      <Link {...linkProps}>
        {item.icon && (
          <Icon 
            as={item.icon} 
            mr="3" 
            boxSize="5" 
            color={isActive ? 'white' : 'gray.500'} 
            _groupHover={{color: isActive ? 'white' : 'gray.700'}}
          />
        )}
        <Text fontWeight="medium">{item.label}</Text>
      </Link>
    );
  };

  return (
    <Box
      bg="white"
      w="full"
      h="full"
      display="flex"
      flexDirection="column"
    >
      <Box p="4">
        <Heading size="md" mb="6" textAlign="center" color="primary.500">
            Eye Clinic
        </Heading>
      </Box>

      <VStack spacing="2" align="stretch" p="4" flexGrow={1} overflowY="auto">
        {navItems.map((item) => renderNavItem(item))}
      </VStack>

      <Divider />
      <VStack spacing="2" align="stretch" p="4">
        {secondaryNavItems.map((item) => renderNavItem(item))}
      </VStack>
    </Box>
  );
};

export default Sidebar;
