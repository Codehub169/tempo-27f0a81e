import React, { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Input, Button, VStack, Select, Textarea, useToast, Avatar, HStack, Text
} from '@chakra-ui/react';

// Mock patient data - replace with API call in a real app
const mockPatients = [
  { id: '1', name: 'John Doe', email: 'john.doe@example.com', phone: '555-1234', dob: '1980-01-15', avatarUrl: 'https://i.pravatar.cc/40?u=john' },
  { id: '2', name: 'Alice Smith', email: 'alice.smith@example.com', phone: '555-5678', dob: '1992-07-22', avatarUrl: 'https://i.pravatar.cc/40?u=alice' },
];

const PatientModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    address: '',
    medicalHistory: '',
    // ... other patient fields
  });
  const toast = useToast();

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        dob: initialData.dob ? initialData.dob.split('T')[0] : '', // Assuming ISO string date
        address: initialData.address || '',
        medicalHistory: initialData.medicalHistory || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        dob: '',
        address: '',
        medicalHistory: '',
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.dob) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields (Name, Email, Phone, DOB).',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    // Add more validation as needed (e.g., email format, phone format)
    onSave({ ...formData, id: initialData?.id }); // Pass ID if editing
    onClose(); // Close modal after save
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color="brand.700">{initialData ? 'Edit Patient' : 'Add New Patient'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              {initialData && (
                <HStack mb={4}>
                  <Avatar name={initialData.name} src={initialData.avatarUrl || `https://i.pravatar.cc/40?u=${initialData.email}`} size="lg" />
                  <Text fontSize="xl" fontWeight="bold" color="brand.800">{initialData.name}</Text>
                </HStack>
              )}
              <FormControl isRequired>
                <FormLabel>Full Name</FormLabel>
                <Input name="name" value={formData.name} onChange={handleChange} placeholder="Enter patient's full name" />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Email Address</FormLabel>
                <Input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Phone Number</FormLabel>
                <Input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="(555) 123-4567" />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Date of Birth</FormLabel>
                <Input type="date" name="dob" value={formData.dob} onChange={handleChange} />
              </FormControl>

              <FormControl>
                <FormLabel>Address</FormLabel>
                <Textarea name="address" value={formData.address} onChange={handleChange} placeholder="123 Main St, Anytown, USA" />
              </FormControl>

              <FormControl>
                <FormLabel>Medical History (Brief)</FormLabel>
                <Textarea name="medicalHistory" value={formData.medicalHistory} onChange={handleChange} placeholder="Relevant medical conditions, allergies, etc." />
              </FormControl>

              {/* Add more fields as per your data model for patients */}
            </VStack>
          </form>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="brand" onClick={handleSubmit}>
            {initialData ? 'Save Changes' : 'Add Patient'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PatientModal;
