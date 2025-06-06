import React from 'react';
import {
  Flex,
  IconButton,
  Text,
  Box,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Heading,
  useBreakpointValue
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { HamburgerIcon, BellIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ pageTitle, onOpenDrawer }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useBreakpointValue({ base: true, md: false });

  const handleLogout = async () => {
    await logout(); // Ensure logout completes before navigation
    navigate('/login');
  };

  const userName = user?.username || 'User Name'; 
  const userAvatarSrc = user?.avatarUrl || ''; 

  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      w="full"
      px={{ base: "2", md: "4" }}
      py="2"
      bg="white"
      borderBottomWidth="1px"
      borderColor="gray.200"
      h="60px" 
      position="sticky"
      top="0"
      zIndex="banner" 
    >
      <Flex align="center">
        {isMobile && (
          <IconButton
            icon={<HamburgerIcon w={5} h={5} />}
            onClick={onOpenDrawer} 
            aria-label="Open menu"
            variant="ghost"
            mr="2"
          />
        )}
        <Heading as="h1" size="md" fontWeight="semibold" color="gray.700" noOfLines={1} title={pageTitle}>
          {pageTitle}
        </Heading>
      </Flex>

      <Flex align="center">
        <IconButton
          icon={<BellIcon w={6} h={6} />} 
          variant="ghost"
          aria-label="Notifications"
          mr={{ base: "1", md: "3" }}
          color="gray.600"
          // onClick={() => navigate('/notifications')} // Example action
        />
        <Menu>
          <MenuButton 
            as={Box} 
            cursor="pointer" 
            p={{ base: 1, md: 2}} 
            borderRadius="md" 
            _hover={{ bg: "gray.100"}}
          >
            <Flex align="center">
              <Avatar size="sm" name={userName} src={userAvatarSrc} />
              {!isMobile && <Text fontSize="sm" ml="2" mr="1" fontWeight="medium" color="gray.700">{userName}</Text>}
              {!isMobile && <ChevronDownIcon color="gray.600"/>}
            </Flex>
          </MenuButton>
          <MenuList zIndex="popover"> {/* Ensure menu list is above other content */}
            <MenuItem as={RouterLink} to="/profile">Profile</MenuItem> 
            <MenuItem as={RouterLink} to="/settings">Settings</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    </Flex>
  );
};

export default Header;
