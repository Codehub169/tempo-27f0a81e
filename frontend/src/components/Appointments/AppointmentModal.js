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
  FormErrorMessage
} from '@chakra-ui/react';

const AppointmentModal = ({ isOpen, onClose, onSave, initialData, doctors = [], patients = [] }) => {
  const [formData, setFormData] = useState({});
  const toast = useToast();
  const [errors, setErrors] = useState({});

  const defaultFormState = React.useMemo(() => ({
    patientId: '', 
    patientName: '',
    doctorId: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    notes: '',
    status: 'Scheduled',
  }), []);

  useEffect(() => {
    if (isOpen) {
      setErrors({}); // Clear errors when modal opens
      if (initialData) {
        const patient = patients.find(p => p.id === (initialData.patient_id || initialData.patientId)?.toString());
        const formattedData = {
          ...defaultFormState,
          ...initialData,
          patientId: (initialData.patient_id || initialData.patientId)?.toString() || '',
          doctorId: (initialData.doctor_id || initialData.doctorId)?.toString() || '',
          date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : defaultFormState.date,
          time: initialData.time || '', 
          patientName: initialData.patientName || patient?.name || '',
          status: initialData.status || defaultFormState.status,
        };
        setFormData(formattedData);
      } else {
        setFormData(defaultFormState);
      }
    }
  }, [initialData, isOpen, patients, defaultFormState]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }

    if (name === "patientId" && value) {
      const selectedPatient = patients.find(p => p.id === value);
      if (selectedPatient) {
        setFormData(prev => ({ ...prev, patientName: selectedPatient.name }));
      }
    } else if (name === "patientId" && !value) {
        setFormData(prev => ({ ...prev, patientName: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.patientId) newErrors.patientId = "Patient is required.";
    if (!formData.doctorId) newErrors.doctorId = "Doctor is required.";
    if (!formData.date) newErrors.date = "Date is required.";
    if (!formData.time) newErrors.time = "Time is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
        toast({
            title: "Missing Fields",
            description: "Please fill all required fields.",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        return;
    }
    onSave(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside" isCentered>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit}>
        <ModalHeader fontFamily="heading" borderBottomWidth="1px">
          {initialData?.id ? 'Edit Appointment' : 'Book New Appointment'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            <FormControl isRequired isInvalid={!!errors.patientId}>
              <FormLabel>Patient</FormLabel>
              <Select 
                name="patientId" 
                value={formData.patientId || ''} 
                onChange={handleChange}
                placeholder="Select existing patient"
              >
                 {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
              {errors.patientId && <FormErrorMessage>{errors.patientId}</FormErrorMessage>}
            </FormControl>
            <FormControl isRequired isInvalid={!!errors.doctorId}>
              <FormLabel>Doctor</FormLabel>
              <Select
                name="doctorId"
                value={formData.doctorId || ''}
                onChange={handleChange}
                placeholder="Select Doctor"
              >
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name}
                  </option>
                ))}
              </Select>
              {errors.doctorId && <FormErrorMessage>{errors.doctorId}</FormErrorMessage>}
            </FormControl>
            <FormControl isRequired isInvalid={!!errors.date}>
              <FormLabel>Date</FormLabel>
              <Input
                type="date"
                name="date"
                value={formData.date || ''}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]} // Prevent selecting past dates for new appointments
              />
              {errors.date && <FormErrorMessage>{errors.date}</FormErrorMessage>}
            </FormControl>
            <FormControl isRequired isInvalid={!!errors.time}>
              <FormLabel>Time</FormLabel>
              <Input
                type="time"
                name="time"
                value={formData.time || ''}
                onChange={handleChange}
              />
              {errors.time && <FormErrorMessage>{errors.time}</FormErrorMessage>}
            </FormControl>
             <FormControl>
              <FormLabel>Status</FormLabel>
              <Select name="status" value={formData.status || 'Scheduled'} onChange={handleChange}>
                  <option value="Scheduled">Scheduled</option>
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
        <ModalFooter borderTopWidth="1px">
          <Button variant="outline" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" colorScheme="brand">
            {initialData?.id ? 'Save Changes' : 'Book Appointment'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AppointmentModal;
