import React, { useState, useMemo } from 'react';
import {
  Box, Button, useDisclosure, useToast, Heading, Icon, Table, Thead, Tbody, Tr, Th, Td, IconButton, HStack, Text, Flex, 
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, Input, VStack, Select
} from '@chakra-ui/react';
import { FiPlus, FiEdit, FiTrash2, FiUserCheck, FiMail, FiPhone, FiBriefcase } from 'react-icons/fi';

// Mock data - replace with API calls
const mockDoctorsData = [
  { id: 'd1', fullName: 'Dr. Emily Carter', specialty: 'Ophthalmologist', email: 'emily.carter@clinic.com', phone: '555-0201', availability: 'Mon, Wed, Fri' },
  { id: 'd2', fullName: 'Dr. Ben Miller', specialty: 'Optometrist', email: 'ben.miller@clinic.com', phone: '555-0202', availability: 'Tue, Thu' },
  { id: 'd3', fullName: 'Dr. Charles Brown', specialty: 'Pediatric Ophthalmologist', email: 'charles.brown@clinic.com', phone: '555-0203', availability: 'Mon - Fri (PM)' },
];

const doctorSpecialties = [
  'Ophthalmologist',
  'Optometrist',
  'Pediatric Ophthalmologist',
  'Retina Specialist',
  'Glaucoma Specialist'
];

const DoctorsPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [doctors, setDoctors] = useState(mockDoctorsData);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [currentDoctorData, setCurrentDoctorData] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  const handleAddDoctorClick = () => {
    setSelectedDoctor(null);
    setCurrentDoctorData({ fullName: '', specialty: '', email: '', phone: '', availability: '' });
    setIsEditing(false);
    onOpen();
  };

  const handleEditDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setCurrentDoctorData(doctor);
    setIsEditing(true);
    onOpen();
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentDoctorData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveDoctor = () => {
    if (!currentDoctorData.fullName || !currentDoctorData.specialty || !currentDoctorData.email || !currentDoctorData.phone) {
      toast({ title: 'Error', description: 'Please fill all required fields.', status: 'error', duration: 3000, isClosable: true });
      return;
    }

    if (isEditing && selectedDoctor) {
      setDoctors(doctors.map(d => d.id === selectedDoctor.id ? { ...d, ...currentDoctorData } : d));
      toast({ title: 'Doctor Updated', status: 'success', duration: 3000, isClosable: true });
    } else {
      const newDoctor = { ...currentDoctorData, id: Date.now().toString() }; // Mock ID
      setDoctors([...doctors, newDoctor]);
      toast({ title: 'Doctor Added', status: 'success', duration: 3000, isClosable: true });
    }
    onClose();
  };

  const handleDeleteDoctor = (doctorId) => {
    setDoctors(doctors.filter(d => d.id !== doctorId));
    toast({ title: 'Doctor Deleted', status: 'warning', duration: 3000, isClosable: true });
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size="lg">Doctor Management</Heading>
        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={handleAddDoctorClick}>
          Add New Doctor
        </Button>
      </Flex>

      <Box bg="white" p={0} borderRadius="lg" shadow="card" overflowX="auto">
        {doctors.length > 0 ? (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th><Icon as={FiUserCheck} mr={2} />Name</Th>
                <Th><Icon as={FiBriefcase} mr={2} />Specialty</Th>
                <Th><Icon as={FiMail} mr={2} />Email</Th>
                <Th><Icon as={FiPhone} mr={2} />Phone</Th>
                <Th>Availability</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {doctors.map((doctor) => (
                <Tr key={doctor.id}>
                  <Td fontWeight="medium">{doctor.fullName}</Td>
                  <Td>{doctor.specialty}</Td>
                  <Td>{doctor.email}</Td>
                  <Td>{doctor.phone}</Td>
                  <Td>{doctor.availability}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton icon={<FiEdit />} aria-label="Edit Doctor" size="sm" variant="ghost" colorScheme="blue" onClick={() => handleEditDoctor(doctor)} />
                      <IconButton icon={<FiTrash2 />} aria-label="Delete Doctor" size="sm" variant="ghost" colorScheme="red" onClick={() => handleDeleteDoctor(doctor.id)} />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <Box p={6} textAlign="center">
            <Text>No doctors found. Add a new doctor to get started.</Text>
          </Box>
        )}
      </Box>

      {/* Doctor Add/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{isEditing ? 'Edit Doctor' : 'Add New Doctor'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Full Name</FormLabel>
                <Input name="fullName" value={currentDoctorData.fullName || ''} onChange={handleFormChange} placeholder="e.g., Dr. John Smith" />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Specialty</FormLabel>
                <Select name="specialty" value={currentDoctorData.specialty || ''} onChange={handleFormChange} placeholder="Select specialty">
                  {doctorSpecialties.map(spec => <option key={spec} value={spec}>{spec}</option>)}
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input type="email" name="email" value={currentDoctorData.email || ''} onChange={handleFormChange} placeholder="e.g., doctor@clinic.com" />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Phone</FormLabel>
                <Input type="tel" name="phone" value={currentDoctorData.phone || ''} onChange={handleFormChange} placeholder="e.g., 555-123-4567" />
              </FormControl>
              <FormControl>
                <FormLabel>Availability Notes</FormLabel>
                <Input name="availability" value={currentDoctorData.availability || ''} onChange={handleFormChange} placeholder="e.g., Mon, Wed (9AM-5PM)" />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
            <Button colorScheme="blue" onClick={handleSaveDoctor}>
              {isEditing ? 'Save Changes' : 'Add Doctor'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default DoctorsPage;
