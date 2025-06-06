import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, useDisclosure, useToast, Heading, Text, Flex, Icon, Table, Thead, Tbody, Tr, Th, Td, Tag, IconButton, HStack, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import { FiPlus, FiEdit, FiTrash2, FiCalendar, FiClock, FiUser, FiBriefcase } from 'react-icons/fi';
import AppointmentCalendar from '../../components/Appointments/AppointmentCalendar';
import AppointmentModal from '../../components/Appointments/AppointmentModal';
import api from '../../services/apiService';

const AppointmentsPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [currentMonthAppointments, setCurrentMonthAppointments] = useState([]);
  const [displayedDate, setDisplayedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [appointmentsRes, doctorsRes, patientsRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/doctors'),
        api.get('/patients'),
      ]);
      setAppointments(appointmentsRes || []);
      setDoctors(doctorsRes || []);
      setPatients(patientsRes || []);
    } catch (err) {
      console.error("Error fetching appointments page data:", err);
      setError(err.message || 'Failed to fetch data');
      toast({ title: 'Error fetching data', description: err.response?.data?.message || err.message, status: 'error', duration: 5000, isClosable: true });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateCalendarAppointments = useCallback((date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const filtered = appointments.filter(appt => {
      if (!appt.appointment_datetime) return false;
      const apptDate = new Date(appt.appointment_datetime.split('T')[0]);
      return apptDate.getFullYear() === year && apptDate.getMonth() === month;
    }).map(appt => ({
        ...appt,
        date: appt.appointment_datetime.split('T')[0],
        time: new Date(appt.appointment_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        patientName: patients.find(p=>p.id === appt.patient_id)?.full_name || 'N/A',
        doctorName: doctors.find(d=>d.id === appt.doctor_id)?.full_name || 'N/A',
    }));
    setCurrentMonthAppointments(filtered);
  }, [appointments, patients, doctors]);

  useEffect(() => {
    updateCalendarAppointments(displayedDate);
  }, [displayedDate, updateCalendarAppointments]);

  const handleDateClick = (date) => {
    setSelectedAppointment({ date: date.toISOString().split('T')[0], time: '' }); // Pre-fill date for new appointment
    onOpen();
  };

  const handleAddAppointmentClick = () => {
    setSelectedAppointment(null); // Clear selection for new appointment
    onOpen();
  };

  const handleEditAppointment = (appointment) => {
    const formattedAppointment = {
        ...appointment,
        date: appointment.appointment_datetime ? new Date(appointment.appointment_datetime).toISOString().split('T')[0] : '',
        time: appointment.appointment_datetime ? new Date(appointment.appointment_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
    };
    setSelectedAppointment(formattedAppointment);
    onOpen();
  };

  const handleSaveAppointment = async (appointmentData) => {
    try {
      let patientId = appointmentData.patientId;
      if (!patientId && appointmentData.patientName) {
        toast({ title: 'Patient Handling', description: 'Selecting an existing patient by ID is required for now. New patient creation via this form is not yet supported.', status: 'info', duration: 5000, isClosable: true });
        return; 
      }
      if (!patientId) {
        toast({ title: 'Missing Patient', description: 'Please select a patient for the appointment.', status: 'error', duration: 4000, isClosable: true });
        return;
      }

      const payload = {
        patient_id: parseInt(patientId),
        doctor_id: parseInt(appointmentData.doctorId),
        appointment_datetime: `${appointmentData.date}T${appointmentData.time}:00`, 
        status: appointmentData.status || 'Scheduled',
        notes: appointmentData.notes || '',
      };

      if (selectedAppointment && selectedAppointment.id) {
        await api.put(`/appointments/${selectedAppointment.id}`, payload);
        toast({ title: 'Appointment Updated', status: 'success', duration: 3000, isClosable: true });
      } else {
        await api.post('/appointments', payload);
        toast({ title: 'Appointment Booked', status: 'success', duration: 3000, isClosable: true });
      }
      fetchData(); 
      onClose();
    } catch (err) {
      console.error("Error saving appointment:", err);
      toast({ title: 'Save Failed', description: err.response?.data?.message || err.message || 'Could not save appointment.', status: 'error', duration: 5000, isClosable: true });
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    try {
      await api.delete(`/appointments/${appointmentId}`);
      toast({ title: 'Appointment Deleted', status: 'warning', duration: 3000, isClosable: true });
      fetchData();
    } catch (err) {
      console.error("Error deleting appointment:", err);
      toast({ title: 'Delete Failed', description: err.response?.data?.message || err.message, status: 'error', duration: 5000, isClosable: true });
    }
  };

  const getStatusColorScheme = (status) => {
    switch (status) {
      case 'Confirmed': case 'Scheduled': return 'green';
      case 'Pending': return 'yellow';
      case 'Cancelled': return 'red';
      case 'Completed': return 'blue';
      default: return 'gray';
    }
  };

  const upcomingAppointments = appointments
    .filter(appt => appt.appointment_datetime && new Date(appt.appointment_datetime) >= new Date().setHours(0,0,0,0) && appt.status !== 'Cancelled')
    .sort((a, b) => new Date(a.appointment_datetime) - new Date(b.appointment_datetime));

  if (loading && !appointments.length) return <Box p={4} textAlign="center"><Spinner size="xl" /><Text mt={2}>Loading appointments...</Text></Box>;
  if (error && !appointments.length) return <Alert status="error" variant="subtle"><AlertIcon />{error}</Alert>;

  return (
    <Box p={{ base: 2, md: 4 }}>
      <Flex justify="space-between" align="center" mb={6} direction={{ base: 'column', md: 'row' }} gap={2}>
        <Heading as="h1" size="lg">Appointments</Heading>
        <Button leftIcon={<FiPlus />} colorScheme="brand" onClick={handleAddAppointmentClick} alignSelf={{ base: 'stretch', md: 'auto' }}>
          Book Appointment
        </Button>
      </Flex>

      <AppointmentCalendar 
        appointments={currentMonthAppointments}
        onDateClick={handleDateClick}
        onAddAppointmentClick={handleAddAppointmentClick}
        displayedDate={displayedDate}
        setDisplayedDate={setDisplayedDate}
      />

      <Box mt={8} bg="white" p={{base: 3, md:6}} borderRadius="lg" shadow="card" overflowX="auto">
        <Heading as="h2" size="md" mb={4}>Upcoming Appointments</Heading>
        {loading && appointments.length > 0 && <Box textAlign="center" py={4}><Spinner /></Box>}
        {!loading && upcomingAppointments.length === 0 && <Text>No upcoming appointments.</Text>}
        {!loading && upcomingAppointments.length > 0 && (
          <Table variant="simple" size={{base: "sm", md: "md"}}>
            <Thead>
              <Tr>
                <Th><Icon as={FiUser} mr={2} />Patient</Th>
                <Th><Icon as={FiBriefcase} mr={2} />Doctor</Th>
                <Th><Icon as={FiCalendar} mr={2} />Date</Th>
                <Th><Icon as={FiClock} mr={2} />Time</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {upcomingAppointments.map((appt) => (
                <Tr key={appt.id}>
                  <Td>{patients.find(p => p.id === appt.patient_id)?.full_name || 'N/A'}</Td>
                  <Td>{doctors.find(d => d.id === appt.doctor_id)?.full_name || 'N/A'}</Td>
                  <Td>{appt.appointment_datetime ? new Date(appt.appointment_datetime).toLocaleDateString() : 'N/A'}</Td>
                  <Td>{appt.appointment_datetime ? new Date(appt.appointment_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A'}</Td>
                  <Td><Tag colorScheme={getStatusColorScheme(appt.status)} size="sm">{appt.status}</Tag></Td>
                  <Td>
                    <HStack spacing={1}>
                      <IconButton icon={<FiEdit />} aria-label="Edit Appointment" size="sm" variant="ghost" colorScheme="blue" onClick={() => handleEditAppointment(appt)} />
                      {appt.status !== 'Cancelled' && (
                        <IconButton icon={<FiTrash2 />} aria-label="Cancel Appointment" size="sm" variant="ghost" colorScheme="red" onClick={() => handleDeleteAppointment(appt.id)} />
                      )}
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>

      {isOpen && <AppointmentModal
        isOpen={isOpen}
        onClose={onClose}
        onSave={handleSaveAppointment}
        initialData={selectedAppointment}
        doctors={doctors.map(d => ({id: d.id.toString(), name: d.full_name}))} 
        patients={patients.map(p => ({id: p.id.toString(), name: p.full_name}))}
      />}
    </Box>
  );
};

export default AppointmentsPage;
