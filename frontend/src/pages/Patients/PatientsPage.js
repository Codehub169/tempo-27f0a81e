import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, useDisclosure, useToast, Heading, InputGroup, InputLeftElement, Input, Icon, Table, Thead, Tbody, Tr, Th, Td, Avatar, IconButton, HStack, Text, Flex, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiUser, FiMail, FiPhone, FiCalendar } from 'react-icons/fi';
import PatientModal from '../../components/Patients/PatientModal';
import api from '../../services/apiService';

const PatientsPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPatients = useCallback(async (currentSearchTerm) => {
    setLoading(true);
    setError(null);
    try {
      const params = currentSearchTerm ? { search: currentSearchTerm } : {};
      const data = await api.get('/patients', params);
      setPatients(data || []);
    } catch (err) {
      console.error("Error fetching patients:", err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch patients';
      setError(errorMessage);
      // Only show general fetch error toast if it's not a search context that might validly return empty or specific errors handled by UI
      if (!currentSearchTerm) { 
        toast({ title: 'Error Fetching Patients', description: errorMessage, status: 'error', duration: 5000, isClosable: true });
      }
    }
    setLoading(false);
  }, [toast]); 

  useEffect(() => {
    fetchPatients(searchTerm);
  }, [searchTerm, fetchPatients]);

  const handleAddPatientClick = () => {
    setSelectedPatient(null);
    onOpen();
  };

  const handleEditPatient = (patient) => {
    const formattedPatient = {
        ...patient,
        dob: patient.date_of_birth ? new Date(patient.date_of_birth).toISOString().split('T')[0] : '',
        name: patient.full_name 
    };
    setSelectedPatient(formattedPatient);
    onOpen();
  };

  const handleSavePatient = async (patientData) => {
    try {
      const payload = {
        full_name: patientData.name,
        email: patientData.email,
        phone: patientData.phone,
        date_of_birth: patientData.dob || null,
        address: patientData.address,
        medical_history_summary: patientData.medicalHistory,
      };

      if (selectedPatient && selectedPatient.id) {
        await api.put(`/patients/${selectedPatient.id}`, payload);
        toast({ title: 'Patient Updated', description: `${payload.full_name}'s details have been updated.`, status: 'success', duration: 3000, isClosable: true });
      } else {
        await api.post('/patients', payload);
        toast({ title: 'Patient Added', description: `${payload.full_name} has been added to the system.`, status: 'success', duration: 3000, isClosable: true });
      }
      fetchPatients(searchTerm); 
      onClose();
    } catch (err) {
      console.error("Error saving patient:", err);
      toast({ title: 'Save Failed', description: err.response?.data?.msg || err.message || 'Could not save patient details.', status: 'error', duration: 5000, isClosable: true });
    }
  };

  const handleDeletePatient = async (patientId) => {
    try {
      await api.delete(`/patients/${patientId}`);
      toast({ title: 'Patient Deleted', description: 'Patient record has been removed.', status: 'warning', duration: 3000, isClosable: true });
      fetchPatients(searchTerm); 
    } catch (err) {
      console.error("Error deleting patient:", err);
      toast({ title: 'Delete Failed', description: err.response?.data?.msg || err.message, status: 'error', duration: 5000, isClosable: true });
    }
  };
  
  const displayedPatients = patients;

  if (loading && !displayedPatients.length && !searchTerm) return <Box p={4} textAlign="center"><Spinner size="xl" /><Text mt={2}>Loading patients...</Text></Box>;
  if (error && !displayedPatients.length && !searchTerm) return <Alert status="error" variant="subtle"><AlertIcon />{error}</Alert>; 

  return (
    <Box p={{ base: 2, md: 4 }}>
      <Flex justify="space-between" align="center" mb={6} direction={{ base: 'column', md: 'row' }} gap={2}>
        <Heading as="h1" size="lg">Patient Management</Heading>
        <Button leftIcon={<FiPlus />} colorScheme="brand" onClick={handleAddPatientClick} alignSelf={{ base: 'stretch', md: 'auto' }}>
          Add New Patient
        </Button>
      </Flex>

      <Box bg="white" p={{base:3, md:6}} borderRadius="lg" shadow="card" mb={6}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <Icon as={FiSearch} color="gray.400" />
          </InputLeftElement>
          <Input 
            type="text" 
            placeholder="Search patients by name, email, or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            borderRadius="md"
            focusBorderColor="brand.500"
          />
        </InputGroup>
      </Box>

      <Box bg="white" p={{base: 0, md: 0}} borderRadius="lg" shadow="card" overflowX="auto">
        {loading && <Box textAlign="center" p={4}><Spinner size="md" /></Box>}
        {!loading && displayedPatients.length > 0 ? (
          <Table variant="simple" size={{ base: "sm", md: "md" }}>
            <Thead>
              <Tr>
                <Th><Icon as={FiUser} mr={2} />Name</Th>
                <Th><Icon as={FiMail} mr={2} />Email</Th>
                <Th><Icon as={FiPhone} mr={2} />Phone</Th>
                <Th><Icon as={FiCalendar} mr={2} />Date of Birth</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {displayedPatients.map((patient) => (
                <Tr key={patient.id}>
                  <Td>
                    <HStack spacing={3}>
                      <Avatar size="sm" name={patient.full_name} src={patient.avatarUrl /* Placeholder if backend provides */ } />
                      <Text fontWeight="medium">{patient.full_name}</Text>
                    </HStack>
                  </Td>
                  <Td>{patient.email || 'N/A'}</Td>
                  <Td>{patient.phone || 'N/A'}</Td>
                  <Td>{patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}</Td>
                  <Td>
                    <HStack spacing={1}>
                      <IconButton icon={<FiEdit />} aria-label="Edit Patient" size="sm" variant="ghost" colorScheme="blue" onClick={() => handleEditPatient(patient)} />
                      <IconButton icon={<FiTrash2 />} aria-label="Delete Patient" size="sm" variant="ghost" colorScheme="red" onClick={() => handleDeletePatient(patient.id)} />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          !loading && <Box p={6} textAlign="center"><Text>No patients found{searchTerm ? ' matching your search.' : '.'}</Text></Box>
        )}
      </Box>

      {isOpen && <PatientModal
        isOpen={isOpen}
        onClose={onClose}
        onSave={handleSavePatient}
        initialData={selectedPatient}
      />}
    </Box>
  );
};

export default PatientsPage;
