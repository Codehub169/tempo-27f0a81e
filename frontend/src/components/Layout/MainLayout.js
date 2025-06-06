import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, Flex, Drawer, DrawerContent, DrawerOverlay, useDisclosure, useBreakpointValue } from '@chakra-ui/react';
import Sidebar from '../Navigation/Sidebar';
import Header from '../Navigation/Header';

const MainLayout = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const location = useLocation();

  const getPageTitle = (pathname) => {
    if (pathname === '/') return 'Dashboard';
    // Handle /dashboard explicitly as it might not be the last segment if there are sub-routes
    if (pathname.startsWith('/dashboard')) return 'Dashboard'; 

    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments.pop();
    if (!lastSegment) return 'Dashboard'; 
    // Capitalize first letter and replace hyphens with spaces for multi-word titles
    return lastSegment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const pageTitle = getPageTitle(location.pathname);
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Flex minH="100vh" bg="neutral-light-gray">
      {/* Sidebar for Desktop (fixed position) */}
      {!isMobile && (
        <Box 
          as="aside"
          w={{ base: 'full', md: '250px' }} 
          position={{ md: 'fixed' }} 
          h={{ md: 'full' }} 
          top={{md: "0"}} 
          left={{md: "0"}} 
          zIndex={{md: "sticky"}} // zIndex value from theme for sticky elements
          bg="white" // Sidebar background is white as per Sidebar.js
          borderRight={{ md: '1px' }} // Border as per Sidebar.js style for desktop
          borderColor={{ md: 'gray.200' }} // Border color as per Sidebar.js style for desktop
        >
            <Sidebar />
        </Box>
      )}

      {/* Sidebar Drawer for Mobile */}
      {isMobile && (
        <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
          <DrawerOverlay />
          <DrawerContent>
            <Sidebar onCloseDrawer={onClose} />
          </DrawerContent>
        </Drawer>
      )}

      {/* Main Content Area */}
      <Flex direction="column" flex="1" ml={{ base: '0', md: isMobile ? '0' : '250px' }}>
        <Header
          pageTitle={pageTitle}
          onOpenDrawer={onOpen} 
          isMobile={isMobile}
        />
        <Box as="main" p={{base: "3", md: "4"}} flex="1">
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
};

export default MainLayout;
