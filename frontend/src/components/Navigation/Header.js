import React from 'react';
import { Flex, Heading, Avatar, Text, IconButton, Box, Menu, MenuButton, MenuList, MenuItem, Icon as ChakraIcon } from '@chakra-ui/react'; // Renamed Icon to ChakraIcon to avoid conflict
import { FiMenu, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext'; // Assuming AuthContext is in this path
import { useNavigate } from 'react-router-dom';

// Header component receives pageTitle and onOpen (for mobile sidebar) as props
const Header = ({ pageTitle, onOpenMobileNav }) => {
  const { user, logout } = useAuth(); // Assuming user object { name, avatarUrl } is provided by AuthContext
  const navigate = useNavigate();

  // Placeholder user data if not available from context, matching mockup
  const displayName = user?.name || 'Dr. Emily Carter';
  const avatarUrl = user?.avatarUrl || 'https://i.pravatar.cc/40?u=admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      p={{ base: '15px', md: '0' }} // Padding for mobile, 0 for desktop as MainLayout will handle it
      borderBottomWidth={{ base: '1px', md: '0' }} // Border for mobile, 0 for desktop
      borderColor="border"
      bg={{ base: 'white', md: 'transparent'}}
      w="full"
    >
      {/* Mobile Navigation Toggle - Hidden on md and up */}
      <IconButton
        aria-label="Open menu"
        icon={<FiMenu />}
        onClick={onOpenMobileNav} // This prop should be connected to MainLayout's drawer disclosure
        display={{ base: 'flex', md: 'none' }}
        variant="outline"
        mr={3}
      />

      {/* Page Title */}
      <Heading as="h2" size="lg" fontFamily="secondary" color="text.primary" fontWeight="semibold" flexGrow={1} textAlign={{ base: 'center', md: 'left'}}>
        {pageTitle || 'Dashboard'}
      </Heading>

      <Box ml={{base: 2, md: "auto"}}> {/* Pushes user profile to the right */}
        <Menu>
          <MenuButton
            as={Flex}
            alignItems="center"
            cursor="pointer"
            p={2}
            borderRadius="md"
            _hover={{ bg: 'neutral.lightGray' }}
          >
            <Avatar size="sm" name={displayName} src={avatarUrl} mr="10px" />
            <Text fontWeight="medium" display={{ base: 'none', md: 'block' }}>{displayName}</Text>
            <ChakraIcon as={FiChevronDown} ml={1} display={{ base: 'none', md: 'block' }} />
          </MenuButton>
          <MenuList>
            <MenuItem onClick={() => navigate('/settings')}>Settings</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </MenuList>
        </Menu>
      </Box>
    </Flex>
  );
};

export default Header;
