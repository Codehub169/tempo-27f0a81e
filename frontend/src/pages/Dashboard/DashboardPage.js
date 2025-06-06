import React from 'react';
import {
  Box, SimpleGrid, Heading, Text, Icon, Flex, Stat, StatLabel, StatNumber, StatHelpText, StatArrow, Button, VStack
} from '@chakra-ui/react';
import { FiCalendar, FiUsers, FiBox, FiDollarSign, FiPlusCircle, FiUserPlus, FiFileText } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom'; // For navigation
import { useAuth } from '../../contexts/AuthContext'; // To get user info

const StatCard = ({ title, value, icon, change, changeType, linkTo, accentColor }) => (
  <Box p={5} shadow="card" borderWidth="1px" borderRadius="xl" bg="white">
    <Flex justifyContent="space-between" alignItems="flex-start">
      <Box>
        <Stat>
          <StatLabel color="gray.500" fontWeight="medium">{title}</StatLabel>
          <StatNumber fontSize="2xl" fontWeight="bold" color="gray.700">{value}</StatNumber>
          {change && (
            <StatHelpText>
              {changeType && <StatArrow type={changeType === 'increase' ? 'increase' : 'decrease'} />}
              {change}
            </StatHelpText>
          )}
        </Stat>
      </Box>
      <Box bg={`${accentColor}.100`} p={3} borderRadius="lg">
        <Icon as={icon} w={8} h={8} color={`${accentColor}.500`} />
      </Box>
    </Flex>
    {linkTo && (
      <Button as={RouterLink} to={linkTo} size="sm" colorScheme={accentColor} variant="link" mt={4} rightIcon={<Text as="span">&rarr;</Text>}>
        View Details
      </Button>
    )}
  </Box>
);

const QuickActionButton = ({ label, icon, linkTo, colorScheme }) => (
  <Button 
    as={RouterLink} 
    to={linkTo} 
    leftIcon={<Icon as={icon} />} 
    colorScheme={colorScheme || 'brand'} 
    variant="solid"
    size="lg"
    w={{ base: '100%', md: 'auto' }}
    flexGrow={{ base: 1, md: 0 }} // Allow buttons to grow on mobile if in a Flex container
  >
    {label}
  </Button>
);

const DashboardPage = () => {
  const { user } = useAuth(); // Get user info for personalization if needed

  // Mock data - replace with API calls
  const dashboardData = {
    todayAppointments: 12,
    upcomingAppointmentsNextHour: 3,
    newPatientsThisWeek: 8,
    newPatientsChange: '+5%',
    lowStockItems: 3,
    lowStockItemsNames: 'Lenses, Drops',
    revenueThisMonth: '$12,450',
    revenueTarget: '$15,000',
  };

  return (
    <Box p={{ base: 4, md: 6 }}>
      <Heading as="h2" size="lg" mb={6} color="brand.700" fontFamily="heading">
        Welcome, {user?.username || 'User'}!
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <StatCard 
          title="Today's Appointments"
          value={dashboardData.todayAppointments}
          icon={FiCalendar}
          change={`${dashboardData.upcomingAppointmentsNextHour} upcoming`}
          linkTo="/appointments"
          accentColor="blue"
        />
        <StatCard 
          title="New Patients (Week)"
          value={dashboardData.newPatientsThisWeek}
          icon={FiUsers}
          change={dashboardData.newPatientsChange}
          changeType="increase"
          linkTo="/patients"
          accentColor="green"
        />
        <StatCard 
          title="Low Stock Items"
          value={dashboardData.lowStockItems}
          icon={FiBox}
          change={dashboardData.lowStockItemsNames}
          linkTo="/inventory"
          accentColor="orange"
        />
        <StatCard 
          title="Revenue (Month)"
          value={dashboardData.revenueThisMonth}
          icon={FiDollarSign}
          change={`Target: ${dashboardData.revenueTarget}`}
          linkTo="/reports"
          accentColor="purple"
        />
      </SimpleGrid>

      <Box p={6} shadow="card" borderWidth="1px" borderRadius="xl" bg="white">
        <Heading as="h3" size="md" mb={6} color="gray.700" fontFamily="heading">
          Quick Actions
        </Heading>
        {/* Using Flex directly for better control over button wrapping and spacing */}
        <Flex wrap="wrap" gap={4} direction={{ base: 'column', sm: 'row' }} > 
            <QuickActionButton 
              label="New Appointment"
              icon={FiPlusCircle}
              linkTo="/appointments?action=new" // Query param to open modal
              colorScheme="brand"
            />
            <QuickActionButton 
              label="Add New Patient"
              icon={FiUserPlus}
              linkTo="/patients?action=new" // Query param to open modal
              colorScheme="green"
            />
            <QuickActionButton 
              label="Create Bill"
              icon={FiFileText}
              linkTo="/billing?action=new" // Query param to open modal
              colorScheme="teal"
            />
        </Flex>
      </Box>
    </Box>
  );
};

export default DashboardPage;
