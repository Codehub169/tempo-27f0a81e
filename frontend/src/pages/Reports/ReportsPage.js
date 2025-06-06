import React, { useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  Text,
  Select,
  Button,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
  FormControl,
  FormLabel,
  HStack,
  InputGroup,
  InputLeftAddon,
  Input
} from '@chakra-ui/react';
import { FiBarChart2, FiDollarSign, FiUsers, FiCalendar } from 'react-icons/fi';

// Mock data - in a real app, this would come from API based on filters
const mockReportData = {
  revenue: {
    currentMonth: 12450,
    previousMonth: 11800,
    target: 15000,
  },
  appointments: {
    totalThisMonth: 152,
    completed: 140,
    cancelled: 12,
  },
  patients: {
    newThisMonth: 25,
    totalActive: 350,
  },
};

function ReportsPage() {
  const [reportType, setReportType] = useState('revenue');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [generatedReport, setGeneratedReport] = useState(null);
  const cardBg = useColorModeValue('white', 'gray.700');

  const handleGenerateReport = () => {
    // In a real app, fetch data based on reportType and dateRange
    console.log('Generating report for:', reportType, dateRange);
    setGeneratedReport(mockReportData); // Use mock data for now
  };

  const renderReportContent = () => {
    if (!generatedReport) {
      return <Text>Select report type and date range, then click "Generate Report".</Text>;
    }

    switch (reportType) {
      case 'revenue':
        return (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
            <Stat p={5} shadow="md" borderWidth="1px" borderRadius="md" bg={cardBg}>
              <StatLabel display="flex" alignItems="center"><FiDollarSign style={{marginRight: '8px'}} />Current Month Revenue</StatLabel>
              <StatNumber>${generatedReport.revenue.currentMonth.toLocaleString()}</StatNumber>
              <StatHelpText>
                <StatArrow type={generatedReport.revenue.currentMonth >= generatedReport.revenue.previousMonth ? 'increase' : 'decrease'} />
                vs Previous Month (${generatedReport.revenue.previousMonth.toLocaleString()})
              </StatHelpText>
            </Stat>
            <Stat p={5} shadow="md" borderWidth="1px" borderRadius="md" bg={cardBg}>
              <StatLabel display="flex" alignItems="center"><FiDollarSign style={{marginRight: '8px'}} />Monthly Target</StatLabel>
              <StatNumber>${generatedReport.revenue.target.toLocaleString()}</StatNumber>
              <StatHelpText>
                Progress: {((generatedReport.revenue.currentMonth / generatedReport.revenue.target) * 100).toFixed(1)}%
              </StatHelpText>
            </Stat>
          </SimpleGrid>
        );
      case 'appointments':
        return (
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
            <Stat p={5} shadow="md" borderWidth="1px" borderRadius="md" bg={cardBg}>
              <StatLabel display="flex" alignItems="center"><FiCalendar style={{marginRight: '8px'}} />Total Appointments (Month)</StatLabel>
              <StatNumber>{generatedReport.appointments.totalThisMonth}</StatNumber>
            </Stat>
            <Stat p={5} shadow="md" borderWidth="1px" borderRadius="md" bg={cardBg}>
              <StatLabel>Completed</StatLabel>
              <StatNumber>{generatedReport.appointments.completed}</StatNumber>
            </Stat>
            <Stat p={5} shadow="md" borderWidth="1px" borderRadius="md" bg={cardBg}>
              <StatLabel>Cancelled</StatLabel>
              <StatNumber>{generatedReport.appointments.cancelled}</StatNumber>
            </Stat>
          </SimpleGrid>
        );
      case 'patients':
        return (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
            <Stat p={5} shadow="md" borderWidth="1px" borderRadius="md" bg={cardBg}>
              <StatLabel display="flex" alignItems="center"><FiUsers style={{marginRight: '8px'}} />New Patients (Month)</StatLabel>
              <StatNumber>{generatedReport.patients.newThisMonth}</StatNumber>
            </Stat>
            <Stat p={5} shadow="md" borderWidth="1px" borderRadius="md" bg={cardBg}>
              <StatLabel>Total Active Patients</StatLabel>
              <StatNumber>{generatedReport.patients.totalActive}</StatNumber>
            </Stat>
          </SimpleGrid>
        );
      default:
        return <Text>Selected report type is not available.</Text>;
    }
  };

  return (
    <Box p={5}>
      <VStack spacing={6} align="stretch">
        <Heading as="h1" size="xl">Reports</Heading>
        
        <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg={cardBg}>
            <VStack spacing={4} align="stretch">
                <Heading as="h3" size="md">Report Filters</Heading>
                <FormControl id="reportType">
                    <FormLabel>Report Type</FormLabel>
                    <Select 
                        placeholder="Select report type"
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                    >
                        <option value="revenue">Revenue Report</option>
                        <option value="appointments">Appointments Summary</option>
                        <option value="patients">Patient Statistics</option>
                        {/* <option value="inventory">Inventory Levels</option> */}
                    </Select>
                </FormControl>
                <HStack spacing={4}>
                    <FormControl id="startDate">
                        <FormLabel>Start Date</FormLabel>
                        <Input 
                            type="date" 
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
                        />
                    </FormControl>
                    <FormControl id="endDate">
                        <FormLabel>End Date</FormLabel>
                        <Input 
                            type="date" 
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))}
                        />
                    </FormControl>
                </HStack>
                <Button 
                    leftIcon={<FiBarChart2 />} 
                    colorScheme="blue" 
                    onClick={handleGenerateReport}
                    alignSelf="flex-start"
                >
                    Generate Report
                </Button>
            </VStack>
        </Box>

        <Box mt={8}>
          <Heading as="h2" size="lg" mb={4}>Report Results</Heading>
          {renderReportContent()}
        </Box>

      </VStack>
    </Box>
  );
}

export default ReportsPage;
