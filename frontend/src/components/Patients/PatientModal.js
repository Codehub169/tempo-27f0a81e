import React, { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Input, Button, VStack, Textarea, useToast, Avatar, HStack, Text, FormErrorMessage
} from '@chakra-ui/react';

const PatientModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    name: '', // Corresponds to full_name in backend
    email: '',
    phone: '',
    dob: '', // Corresponds to date_of_birth in backend
    address: '',
    medicalHistory: '', // Corresponds to medical_history_summary
    avatarUrl: '',
  });
  const [errors, setErrors] = useState({});
  const toast = useToast();

  const defaultFormState = React.useMemo(() => ({
    name: '', email: '', phone: '', dob: '', address: '', medicalHistory: '', avatarUrl: ''
  }), []);

  useEffect(() => {
    if (isOpen) { 
      setErrors({}); // Clear errors when modal opens
      if (initialData) {
        setFormData({
          name: initialData.name || initialData.full_name || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          dob: initialData.dob || (initialData.date_of_birth ? new Date(initialData.date_of_birth).toISOString().split('T')[0] : ''),
          address: initialData.address || '',
          medicalHistory: initialData.medicalHistory || initialData.medical_history_summary || '',
          avatarUrl: initialData.avatarUrl || '' 
        });
      } else {
        setFormData(defaultFormState);
      }
    }
  }, [initialData, isOpen, defaultFormState]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({...prev, [name]: null}));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full Name is required.';
    if (!formData.email.trim()) {
      newErrors.email = 'Email Address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format.';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone Number is required.';
    // Basic phone validation (example: at least 7 digits)
    else if (!/^\+?[\d\s-()]{7,}$/.test(formData.phone)) {
        newErrors.phone = 'Invalid phone number format.';
    }
    if (!formData.dob) newErrors.dob = 'Date of Birth is required.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields correctly.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    onSave({ ...formData, id: initialData?.id }); 
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside" isCentered>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit}>
        <ModalHeader color="brand.700" borderBottomWidth="1px">
            {initialData?.id ? 'Edit Patient' : 'Add New Patient'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
            <VStack spacing={4} align="stretch" mt={4}>
              {initialData?.id && (
                <HStack mb={4} justifyContent="center">
                  <Avatar name={formData.name} src={formData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`} size="xl" />
                </HStack>
              )}
              {initialData?.id && formData.name && (
                 <Text fontSize="2xl" fontWeight="bold" color="brand.800" textAlign="center" mb={2}>{formData.name}</Text>
              )}
              <FormControl isRequired isInvalid={!!errors.name}>
                <FormLabel>Full Name</FormLabel>
                <Input name="name" value={formData.name} onChange={handleChange} placeholder="Enter patient's full name" />
                {errors.name && <FormErrorMessage>{errors.name}</FormErrorMessage>}
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.email}>
                <FormLabel>Email Address</FormLabel>
                <Input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" />
                {errors.email && <FormErrorMessage>{errors.email}</FormErrorMessage>}
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.phone}>
                <FormLabel>Phone Number</FormLabel>
                <Input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="(555) 123-4567" />
                {errors.phone && <FormErrorMessage>{errors.phone}</FormErrorMessage>}
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.dob}>
                <FormLabel>Date of Birth</FormLabel>
                <Input type="date" name="dob" value={formData.dob} onChange={handleChange} max={new Date().toISOString().split("T")[0]}/>
                {errors.dob && <FormErrorMessage>{errors.dob}</FormErrorMessage>}
              </FormControl>

              <FormControl>
                <FormLabel>Address</FormLabel>
                <Textarea name="address" value={formData.address} onChange={handleChange} placeholder="123 Main St, Anytown, USA" />
              </FormControl>

              <FormControl>
                <FormLabel>Medical History (Brief)</FormLabel>
                <Textarea name="medicalHistory" value={formData.medicalHistory} onChange={handleChange} placeholder="Relevant medical conditions, allergies, etc." />
              </FormControl>
            </VStack>
        </ModalBody>

        <ModalFooter borderTopWidth="1px">
          <Button variant="outline" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" colorScheme="brand">
            {initialData?.id ? 'Save Changes' : 'Add Patient'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PatientModal;
