import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Button,
  VStack,
  useToast,
} from '@chakra-ui/react';

const AppointmentModal = ({ isOpen, onClose, onSave, initialData, doctors = [], patients = [] }) => {
  const [formData, setFormData] = useState({});
  const toast = useToast();

  const defaultFormState = {
    patientId: '', // Changed from patientName to patientId for better data handling
    patientName: '', // Keep for display or quick add, can be resolved to ID on save
    doctorId: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    notes: '',
    status: 'Pending', // Default status
  };

  useEffect(() => {
    if (isOpen) { // Reset form only when modal becomes visible
      if (initialData) {
        const formattedData = {
          ...initialData,
          date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
          // Assuming initialData might have patientName if patientId is not directly available
          patientName: initialData.patientName || (patients.find(p => p.id === initialData.patientId)?.name || '')
        };
        setFormData(formattedData);
      } else {
        setFormData(defaultFormState);
      }
    }
  }, [initialData, isOpen, patients]); // Added patients to dependency array

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedFormData = { ...formData, [name]: value };

    if (name === "patientId" && value) {
      const selectedPatient = patients.find(p => p.id === value);
      if (selectedPatient) {
        updatedFormData.patientName = selectedPatient.name;
      }
    }
    setFormData(updatedFormData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((!formData.patientId && !formData.patientName) || !formData.doctorId || !formData.date || !formData.time) {
        toast({
            title: "Missing Fields",
            description: "Please select or enter Patient, select Doctor, and set Date & Time.",
            status: "error",
            duration: 5000,
            isClosable: true,
        });
        return;
    }
    // If patientId is not set but patientName is, this could be a new patient scenario
    // Or the backend can handle resolving patientName to an ID or creating a new patient
    onSave(formData);
  };

  const doctorOptions = doctors.length > 0 ? doctors : [
    { id: 'dr_carter', name: 'Dr. Emily Carter' },
    { id: 'dr_miller', name: 'Dr. Ben Miller' },
    { id: 'dr_brown', name: 'Dr. Charles Brown' },
  ];

  const patientOptions = patients.length > 0 ? patients : [
    { id: 'patient_1', name: 'John Doe (Existing)' },
    { id: 'patient_2', name: 'Alice Smith (Existing)' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontFamily="secondary">
          {initialData?.id ? 'Edit Appointment' : 'Book New Appointment'}
        </ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Patient</FormLabel>
                <Select 
                  name="patientId" 
                  value={formData.patientId || ''} 
                  onChange={handleChange}
                  placeholder="Select existing patient"
                >
                   {patientOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>
                <Input
                  mt={2}
                  name="patientName"
                  value={formData.patientName || ''}
                  onChange={handleChange}
                  placeholder="Or type new patient name"
                  isDisabled={!!formData.patientId} // Disable if existing patient is selected
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Doctor</FormLabel>
                <Select
                  name="doctorId"
                  value={formData.doctorId || ''}
                  onChange={handleChange}
                  placeholder="Select Doctor"
                >
                  {doctorOptions.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  name="date"
                  value={formData.date || ''}
                  onChange={handleChange}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Time</FormLabel>
                <Input
                  type="time"
                  name="time"
                  value={formData.time || ''}
                  onChange={handleChange}
                />
              </FormControl>
               <FormControl>
                <FormLabel>Status</FormLabel>
                <Select name="status" value={formData.status || 'Pending'} onChange={handleChange}>
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Completed">Completed</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Notes (Optional)</FormLabel>
                <Textarea
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleChange}
                  placeholder="Any specific notes for this appointment..."
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" colorScheme="primary">
              {initialData?.id ? 'Save Changes' : 'Book Appointment'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default AppointmentModal;
