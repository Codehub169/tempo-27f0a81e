import React, { useState } from 'react';
import {
  Box, Heading, VStack, Text, Select, Button, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText, StatArrow,
  useColorModeValue, FormControl, FormLabel, HStack, Input, Spinner, Alert, AlertIcon, useToast, Icon as ChakraIcon
} from '@chakra-ui/react';
import { FiBarChart2, FiDollarSign, FiUsers, FiCalendar, FiPackage } from 'react-icons/fi';
import api from '../../services/apiService';

function ReportsPage() {
  const [reportType, setReportType] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [generatedReport, setGeneratedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cardBg = useColorModeValue('white', 'gray.700');
  const toast = useToast();

  const handleGenerateReport = async () => {
    if (!reportType) {
      toast({ title: 'Select Report Type', description: 'Please choose a type of report to generate.', status: 'warning', duration: 3000, isClosable: true });
      return;
    }
    setLoading(true);
    setError(null);
    setGeneratedReport(null);
    try {
      const params = {
        report_type: reportType,
        start_date: dateRange.start || undefined,
        end_date: dateRange.end || undefined,
      };
      const response = await api.get('/reports/generate', params);
      setGeneratedReport(response);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to generate report';
      setError(errorMessage);
      toast({ title: 'Report Generation Failed', description: errorMessage, status: 'error', duration: 5000, isClosable: true });
    }
    setLoading(false);
  };

  const renderReportContent = () => {
    if (loading) return <Spinner size="xl" />;
    if (error) return <Alert status="error" variant="subtle"><AlertIcon />{error}</Alert>;
    if (!generatedReport || !generatedReport.data) {
      return <Text color="gray.500">Select report type and date range, then click "Generate Report". Or no data for selected criteria.</Text>;
    }

    const { data, report_type } = generatedReport;
    const titleCase = (str) => str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    switch (report_type) {
      case 'revenue':
        return (
          <Stat p={5} shadow="md" borderWidth="1px" borderRadius="md" bg={cardBg}>
            <StatLabel display="flex" alignItems="center"><ChakraIcon as={FiDollarSign} mr={2} />Total Revenue (Paid)</StatLabel>
            <StatNumber>${parseFloat(data.total_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</StatNumber>
            <StatHelpText>For selected period.</StatHelpText>
          </Stat>
        );
      case 'appointments_summary':
        return (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
            {Object.entries(data).map(([key, value]) => {
              if (key === 'upcoming_appointments_sample') return null; // Handle separately if needed or display differently
              return (
                <Stat key={key} p={5} shadow="md" borderWidth="1px" borderRadius="md" bg={cardBg}>
                  <StatLabel display="flex" alignItems="center"><ChakraIcon as={FiCalendar} mr={2} />{titleCase(key)}</StatLabel>
                  <StatNumber>{typeof value === 'number' ? value.toLocaleString() : value}</StatNumber>
                </Stat>
              );
            })}
          </SimpleGrid>
        );
      case 'patient_demographics':
        return (
          <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" bg={cardBg}>
            <Heading size="md" mb={3} display="flex" alignItems="center"><ChakraIcon as={FiUsers} mr={2} />Patient Demographics</Heading>
            <Text>Total Patients: {data.total_patients?.toLocaleString() || 'N/A'}</Text>
            <Text>Average Age: {data.average_age ? parseFloat(data.average_age).toFixed(1) + ' years' : 'N/A'}</Text>
            {/* Add more demographic details as available from backend */}
          </Box>
        );
      case 'inventory_status':
        return (
          <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" bg={cardBg}>
            <Heading size="md" mb={3} display="flex" alignItems="center"><ChakraIcon as={FiPackage} mr={2} />Inventory Status</Heading>
            <Text>Total Items: {data.total_items?.toLocaleString() || 'N/A'}</Text>
            <Text>Items Low in Stock: {data.low_stock_items_count?.toLocaleString() || 'N/A'}</Text>
            <Text>Most Stocked Item: {data.most_stocked_item?.name || 'N/A'} ({data.most_stocked_item?.quantity_on_hand?.toLocaleString() || 'N/A'})</Text>
            <Text>Least Stocked Item: {data.least_stocked_item?.name || 'N/A'} ({data.least_stocked_item?.quantity_on_hand?.toLocaleString() || 'N/A'})</Text>
            {data.low_stock_items_list && data.low_stock_items_list.length > 0 && (
                <VStack align="start" mt={3} pt={3} borderTopWidth="1px" borderColor="gray.200">
                    <Text fontWeight="bold">Low Stock Items:</Text>
                    {data.low_stock_items_list.map(item => 
                        <Text key={item.id}>- {item.name} (Qty: {item.quantity_on_hand?.toLocaleString()}, Reorder at: {item.reorder_level?.toLocaleString()})</Text>
                    )}
                </VStack>
            )}
          </Box>
        );
      default:
        return <Text>Report type "{report_type}" not recognized or data format is unexpected.</Text>;
    }
  };

  return (
    <Box p={{ base: 4, md: 6 }}>
      <Heading as="h1" size="lg" mb={6} color="brand.700" fontFamily="heading">Reports & Analytics</Heading>

      <VStack spacing={6} align="stretch" bg={cardBg} p={6} borderRadius="lg" shadow="card" mb={8}>
        <FormControl>
          <FormLabel htmlFor="reportType">Report Type</FormLabel>
          <Select 
            id="reportType" 
            placeholder="Select report type" 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
            focusBorderColor="brand.500"
          >
            <option value="revenue">Revenue Report</option>
            <option value="appointments_summary">Appointments Summary</option>
            <option value="patient_demographics">Patient Demographics</option>
            <option value="inventory_status">Inventory Status</option>
          </Select>
        </FormControl>

        <HStack spacing={4} direction={{ base: 'column', md: 'row' }} align="flex-end">
          <FormControl>
            <FormLabel htmlFor="startDate">Start Date (Optional)</FormLabel>
            <Input 
              id="startDate" 
              type="date" 
              value={dateRange.start} 
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              focusBorderColor="brand.500"
              max={dateRange.end || undefined} // Prevent start date after end date
            />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="endDate">End Date (Optional)</FormLabel>
            <Input 
              id="endDate" 
              type="date" 
              value={dateRange.end} 
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              focusBorderColor="brand.500"
              min={dateRange.start || undefined} // Prevent end date before start date
            />
          </FormControl>
        </HStack>

        <Button 
          leftIcon={<ChakraIcon as={FiBarChart2} />}
          colorScheme="brand" 
          onClick={handleGenerateReport}
          isLoading={loading}
          loadingText="Generating..."
          alignSelf={{ base: "stretch", md: "flex-start" }}
        >
          Generate Report
        </Button>
      </VStack>

      {(generatedReport || loading || error) && (
        <Box mt={8} p={6} bg={cardBg} borderRadius="lg" shadow="card">
          {generatedReport && <Heading as="h2" size="md" mb={4} color="brand.600">Generated Report: {generatedReport.report_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Heading>}
          {renderReportContent()}
        </Box>
      )}
      {!generatedReport && !loading && !error && (
         <Box mt={8} p={6} bg={cardBg} borderRadius="lg" shadow="card" textAlign="center">
            <Text color="gray.500">Your generated report will appear here.</Text>
        </Box>
      )}
    </Box>
  );
}

export default ReportsPage;
