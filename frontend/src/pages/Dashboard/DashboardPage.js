import React, { useState, useEffect } from 'react';
import {
  Box, SimpleGrid, Heading, Text, Icon, Flex, Stat, StatLabel, StatNumber, StatHelpText, StatArrow, Button, useToast, Spinner
} from '@chakra-ui/react';
import { FiCalendar, FiUsers, FiBox, FiDollarSign, FiPlusCircle, FiUserPlus, FiFileText } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/apiService';

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
    flexGrow={{ base: 1, md: 0 }}
  >
    {label}
  </Button>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [dashboardData, setDashboardData] = useState({
    todayAppointments: 0,
    newPatientsThisWeek: 0,
    lowStockItems: 0,
    lowStockItemsNames: '',
    revenueThisMonth: '$0.00',
    revenueTarget: '$15,000', // Target might be static or from settings
    loading: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      setDashboardData(prev => ({ ...prev, loading: true }));
      try {
        const today = new Date().toISOString().split('T')[0];
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const [appointmentsResponse, patientsResponse, inventoryResponse, revenueReportResponse] = await Promise.all([
          api.get('/appointments'), // Consider backend filtering: /appointments?date=${today}
          api.get('/patients'), // Consider backend filtering: /patients?created_after=${oneWeekAgo.toISOString()}
          api.get('/inventory?low_stock=true'),
          api.get('/reports/generate?report_type=revenue') // Consider backend filtering for current month
        ]);

        let todayAppointmentsCount = 0;
        if (appointmentsResponse) {
            todayAppointmentsCount = appointmentsResponse.filter(appt => appt.appointment_datetime && appt.appointment_datetime.startsWith(today)).length;
        }

        let newPatientsThisWeekCount = 0;
        if (patientsResponse) {
            newPatientsThisWeekCount = patientsResponse.filter(p => p.created_at && new Date(p.created_at) >= oneWeekAgo).length;
        }

        let lowStockItemsCount = 0;
        let lowStockItemsNamesList = [];
        if (inventoryResponse) {
            lowStockItemsCount = inventoryResponse.length;
            lowStockItemsNamesList = inventoryResponse.slice(0, 2).map(item => item.name); 
        }

        let revenueThisMonthValue = '$0.00';
        if (revenueReportResponse && revenueReportResponse.data?.total_revenue) {
            revenueThisMonthValue = `$${parseFloat(revenueReportResponse.data.total_revenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        setDashboardData(prev => ({
          ...prev,
          todayAppointments: todayAppointmentsCount,
          newPatientsThisWeek: newPatientsThisWeekCount,
          lowStockItems: lowStockItemsCount,
          lowStockItemsNames: lowStockItemsNamesList.join(', ') || (lowStockItemsCount > 0 ? 'Various items' : 'None'),
          revenueThisMonth: revenueThisMonthValue,
          loading: false,
        }));

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({
          title: 'Error fetching dashboard data',
          description: error.response?.data?.message || error.message || 'Could not load dashboard statistics.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setDashboardData(prev => ({ ...prev, loading: false }));
      }
    };
    fetchData();
  }, [toast]);

  if (dashboardData.loading) {
    return <Box p={4} textAlign="center"><Spinner size="xl" /> <Text mt={2}>Loading dashboard data...</Text></Box>;
  }

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
          // change={`${dashboardData.upcomingAppointmentsNextHour} upcoming`} // This data point is not fetched
          linkTo="/appointments"
          accentColor="blue"
        />
        <StatCard 
          title="New Patients (Week)"
          value={dashboardData.newPatientsThisWeek}
          icon={FiUsers}
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
        <Flex wrap="wrap" gap={4} direction={{ base: 'column', sm: 'row' }} > 
            <QuickActionButton 
              label="New Appointment"
              icon={FiPlusCircle}
              linkTo="/appointments?action=new" 
              colorScheme="brand"
            />
            <QuickActionButton 
              label="Add New Patient"
              icon={FiUserPlus}
              linkTo="/patients?action=new" 
              colorScheme="green"
            />
            <QuickActionButton 
              label="Create Bill"
              icon={FiFileText}
              linkTo="/billing?action=new" 
              colorScheme="teal"
            />
        </Flex>
      </Box>
    </Box>
  );
};

export default DashboardPage;
