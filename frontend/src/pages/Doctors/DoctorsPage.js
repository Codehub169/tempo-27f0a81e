import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, useDisclosure, useToast, Heading, Icon, Table, Thead, Tbody, Tr, Th, Td, IconButton, HStack, Text, Flex, 
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, Input, VStack, Select,
  Spinner, Alert, AlertIcon, FormErrorMessage
} from '@chakra-ui/react';
import { FiPlus, FiEdit, FiTrash2, FiUserCheck, FiMail, FiPhone, FiBriefcase } from 'react-icons/fi';
import api from '../../services/apiService';

const doctorSpecialties = [
  'Ophthalmologist',
  'Optometrist',
  'Pediatric Ophthalmologist',
  'Retina Specialist',
  'Glaucoma Specialist',
  'Cornea Specialist',
  'Neuro-Ophthalmologist',
  'Oculoplastic Surgeon',
  'General Eye Care'
];

const DoctorsPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [currentDoctorData, setCurrentDoctorData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const initialFormState = useCallback(() => ({
    full_name: '', 
    specialty: '', 
    email: '', 
    phone: '', 
    availability_notes: ''
  }), []);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/doctors');
      setDoctors(data || []);
    } catch (err) {
      console.error("Error fetching doctors:", err);
      setError(err.response?.data?.msg || err.message || 'Failed to fetch doctors');
      toast({ title: 'Error Fetching Doctors', description: err.response?.data?.msg || err.message, status: 'error', duration: 5000, isClosable: true });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleAddDoctorClick = () => {
    setSelectedDoctor(null);
    setCurrentDoctorData(initialFormState());
    setFormErrors({});
    setIsEditing(false);
    onOpen();
  };

  const handleEditDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setCurrentDoctorData({ ...initialFormState(), ...doctor });
    setFormErrors({});
    setIsEditing(true);
    onOpen();
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentDoctorData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!currentDoctorData.full_name?.trim()) errors.full_name = 'Full Name is required.';
    if (!currentDoctorData.specialty?.trim()) errors.specialty = 'Specialty is required.';
    if (!currentDoctorData.email?.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentDoctorData.email)) {
      errors.email = 'Invalid email format.';
    }
    if (!currentDoctorData.phone?.trim()) {
        errors.phone = 'Phone number is required.';
    } else if (!/^\+?[\d\s-()]{7,20}$/.test(currentDoctorData.phone)) {
        errors.phone = 'Invalid phone number format (7-20 digits, can include +, -, (), spaces).';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveDoctor = async () => {
    if (!validateForm()) {
      toast({ title: 'Validation Error', description: 'Please correct the errors in the form.', status: 'error', duration: 3000, isClosable: true });
      return;
    }

    const payload = {
        full_name: currentDoctorData.full_name.trim(),
        specialty: currentDoctorData.specialty.trim(),
        email: currentDoctorData.email.trim(),
        phone: currentDoctorData.phone.trim(),
        availability_notes: currentDoctorData.availability_notes?.trim() || '',
    };

    try {
      if (isEditing && selectedDoctor) {
        await api.put(`/doctors/${selectedDoctor.id}`, payload);
        toast({ title: 'Doctor Updated', status: 'success', duration: 3000, isClosable: true });
      } else {
        await api.post('/doctors', payload);
        toast({ title: 'Doctor Added', status: 'success', duration: 3000, isClosable: true });
      }
      fetchDoctors();
      onClose();
    } catch (err) {
      console.error("Error saving doctor:", err);
      toast({ title: 'Save Failed', description: err.response?.data?.msg || err.message || 'Could not save doctor details.', status: 'error', duration: 5000, isClosable: true });
    }
  };

  const handleDeleteDoctor = async (doctorId) => {
    try {
      await api.delete(`/doctors/${doctorId}`);
      toast({ title: 'Doctor Deleted', status: 'warning', duration: 3000, isClosable: true });
      fetchDoctors();
    } catch (err) {
      console.error("Error deleting doctor:", err);
      toast({ title: 'Delete Failed', description: err.response?.data?.msg || err.message, status: 'error', duration: 5000, isClosable: true });
    }
  };

  if (loading && !doctors.length) return <Box p={4} textAlign="center"><Spinner size="xl" /><Text mt={2}>Loading doctors...</Text></Box>;
  if (error && !doctors.length) return <Alert status="error" variant="subtle"><AlertIcon />{error}</Alert>;

  return (
    <Box p={{ base: 2, md: 4 }}>
      <Flex justify="space-between" align="center" mb={6} direction={{ base: 'column', md: 'row' }} gap={2}>
        <Heading as="h1" size="lg">Doctor Management</Heading>
        <Button leftIcon={<FiPlus />} colorScheme="brand" onClick={handleAddDoctorClick} alignSelf={{ base: 'stretch', md: 'auto' }}>
          Add New Doctor
        </Button>
      </Flex>

      <Box bg="white" p={0} borderRadius="lg" shadow="card" overflowX="auto">
      {loading && doctors.length > 0 && <Box textAlign="center" py={4}><Spinner /></Box>}
        {!loading && doctors.length === 0 && 
          <Box p={6} textAlign="center">
            <Text>No doctors found. Add a new doctor to get started.</Text>
          </Box>
        }
        {!loading && doctors.length > 0 && (
          <Table variant="simple" size={{base: "sm", md: "md"}}>
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
                  <Td fontWeight="medium">{doctor.full_name}</Td>
                  <Td>{doctor.specialty}</Td>
                  <Td>{doctor.email || 'N/A'}</Td>
                  <Td>{doctor.phone || 'N/A'}</Td>
                  <Td>{doctor.availability_notes || 'N/A'}</Td>
                  <Td>
                    <HStack spacing={1}>
                      <IconButton icon={<FiEdit />} aria-label="Edit Doctor" size="sm" variant="ghost" colorScheme="blue" onClick={() => handleEditDoctor(doctor)} />
                      <IconButton icon={<FiTrash2 />} aria-label="Delete Doctor" size="sm" variant="ghost" colorScheme="red" onClick={() => handleDeleteDoctor(doctor.id)} />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>

      {isOpen && <Modal isOpen={isOpen} onClose={onClose} scrollBehavior="inside" isCentered>
        <ModalOverlay />
        <ModalContent as="form" onSubmit={(e) => { e.preventDefault(); handleSaveDoctor(); }}>
          <ModalHeader borderBottomWidth="1px">{isEditing ? 'Edit Doctor' : 'Add New Doctor'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={!!formErrors.full_name}>
                <FormLabel>Full Name</FormLabel>
                <Input name="full_name" value={currentDoctorData.full_name || ''} onChange={handleFormChange} placeholder="e.g., Dr. John Smith" />
                {formErrors.full_name && <FormErrorMessage>{formErrors.full_name}</FormErrorMessage>}
              </FormControl>
              <FormControl isRequired isInvalid={!!formErrors.specialty}>
                <FormLabel>Specialty</FormLabel>
                <Select name="specialty" value={currentDoctorData.specialty || ''} onChange={handleFormChange} placeholder="Select specialty">
                  {doctorSpecialties.map(spec => <option key={spec} value={spec}>{spec}</option>)}
                </Select>
                {formErrors.specialty && <FormErrorMessage>{formErrors.specialty}</FormErrorMessage>}
              </FormControl>
              <FormControl isRequired isInvalid={!!formErrors.email}>
                <FormLabel>Email</FormLabel>
                <Input type="email" name="email" value={currentDoctorData.email || ''} onChange={handleFormChange} placeholder="e.g., doctor@clinic.com" />
                {formErrors.email && <FormErrorMessage>{formErrors.email}</FormErrorMessage>}
              </FormControl>
              <FormControl isRequired isInvalid={!!formErrors.phone}>
                <FormLabel>Phone</FormLabel>
                <Input type="tel" name="phone" value={currentDoctorData.phone || ''} onChange={handleFormChange} placeholder="e.g., (555) 123-4567" />
                {formErrors.phone && <FormErrorMessage>{formErrors.phone}</FormErrorMessage>}
              </FormControl>
              <FormControl>
                <FormLabel>Availability Notes</FormLabel>
                <Input name="availability_notes" value={currentDoctorData.availability_notes || ''} onChange={handleFormChange} placeholder="e.g., Mon, Wed (9AM-5PM)" />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px">
            <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
            <Button type="submit" colorScheme="brand">
              {isEditing ? 'Save Changes' : 'Add Doctor'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>}
    </Box>
  );
};

export default DoctorsPage;
