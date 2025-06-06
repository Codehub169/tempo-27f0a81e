import React, { useState, useMemo } from 'react';
import { Box, Button, VStack, useDisclosure, useToast, Heading, InputGroup, InputLeftElement, Input, Icon, Table, Thead, Tbody, Tr, Th, Td, Avatar, IconButton, HStack, Text, Flex } from '@chakra-ui/react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiUser, FiMail, FiPhone, FiCalendar } from 'react-icons/fi';
import PatientModal from '../../components/Patients/PatientModal';
// import { useAuth } from '../../contexts/AuthContext'; // If needed for role-based access or user info

// Mock data - replace with API calls
const mockPatientsData = [
  { id: 'p1', fullName: 'Johnathan Doe', email: 'john.doe@example.com', phone: '555-0101', dob: '1985-03-15', address: '123 Main St, Anytown, USA', medicalHistory: 'Mild myopia. No allergies.', avatarUrl: 'https://i.pravatar.cc/150?u=john.doe' },
  { id: 'p2', fullName: 'Alice Wonderland', email: 'alice.smith@example.com', phone: '555-0102', dob: '1992-07-22', address: '456 Oak Ave, Anytown, USA', medicalHistory: 'Astigmatism. Penicillin allergy.', avatarUrl: 'https://i.pravatar.cc/150?u=alice.smith' },
  { id: 'p3', fullName: 'Robert Lee', email: 'bob.lee@example.com', phone: '555-0103', dob: '1978-11-05', address: '789 Pine Ln, Anytown, USA', medicalHistory: 'Presbyopia. Regular check-ups.', avatarUrl: 'https://i.pravatar.cc/150?u=bob.lee' },
  { id: 'p4', fullName: 'Sarah Connor', email: 'sarah.williams@example.com', phone: '555-0104', dob: '1995-01-30', address: '101 Sky Rd, Anytown, USA', medicalHistory: 'Wears contact lenses.', avatarUrl: 'https://i.pravatar.cc/150?u=sarah.williams' },
];

const PatientsPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [patients, setPatients] = useState(mockPatientsData);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddPatientClick = () => {
    setSelectedPatient(null);
    onOpen();
  };

  const handleEditPatient = (patient) => {
    setSelectedPatient(patient);
    onOpen();
  };

  const handleSavePatient = (patientData) => {
    // Mock save
    if (selectedPatient) {
      setPatients(patients.map(p => p.id === selectedPatient.id ? { ...selectedPatient, ...patientData } : p));
      toast({ title: 'Patient Updated', description: `${patientData.fullName}'s details have been updated.`, status: 'success', duration: 3000, isClosable: true });
    } else {
      const newPatient = { ...patientData, id: Date.now().toString(), avatarUrl: `https://i.pravatar.cc/150?u=${Date.now()}` }; // Mock ID and avatar
      setPatients([...patients, newPatient]);
      toast({ title: 'Patient Added', description: `${patientData.fullName} has been added to the system.`, status: 'success', duration: 3000, isClosable: true });
    }
    onClose();
  };

  const handleDeletePatient = (patientId) => {
    // Mock delete
    setPatients(patients.filter(p => p.id !== patientId));
    toast({ title: 'Patient Deleted', status: 'warning', duration: 3000, isClosable: true });
  };

  const filteredPatients = useMemo(() => 
    patients.filter(patient => 
      patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm)
    ), [patients, searchTerm]);

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size="lg">Patient Management</Heading>
        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={handleAddPatientClick}>
          Add New Patient
        </Button>
      </Flex>

      <Box bg="white" p={6} borderRadius="lg" shadow="card" mb={6}>
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
          />
        </InputGroup>
      </Box>

      <Box bg="white" p={0} borderRadius="lg" shadow="card" overflowX="auto">
        {filteredPatients.length > 0 ? (
          <Table variant="simple">
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
              {filteredPatients.map((patient) => (
                <Tr key={patient.id}>
                  <Td>
                    <HStack spacing={3}>
                      <Avatar size="sm" name={patient.fullName} src={patient.avatarUrl} />
                      <Text fontWeight="medium">{patient.fullName}</Text>
                    </HStack>
                  </Td>
                  <Td>{patient.email}</Td>
                  <Td>{patient.phone}</Td>
                  <Td>{new Date(patient.dob).toLocaleDateString()}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton icon={<FiEdit />} aria-label="Edit Patient" size="sm" variant="ghost" colorScheme="blue" onClick={() => handleEditPatient(patient)} />
                      <IconButton icon={<FiTrash2 />} aria-label="Delete Patient" size="sm" variant="ghost" colorScheme="red" onClick={() => handleDeletePatient(patient.id)} />
                      {/* Add View Details button later if a dedicated patient profile page is planned */}
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <Box p={6} textAlign="center">
            <Text>No patients found matching your search criteria.</Text>
          </Box>
        )}
      </Box>

      <PatientModal
        isOpen={isOpen}
        onClose={onClose}
        onSave={handleSavePatient}
        initialData={selectedPatient}
      />
    </Box>
  );
};

export default PatientsPage;
