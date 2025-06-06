import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, VStack, useDisclosure, useToast, Heading, Text, Flex, Icon, Table, Thead, Tbody, Tr, Th, Td, Tag, IconButton, HStack } from '@chakra-ui/react';
import { FiPlus, FiEdit, FiTrash2, FiCalendar, FiClock, FiUser, FiBriefcase } from 'react-icons/fi';
import AppointmentCalendar from '../../components/Appointments/AppointmentCalendar';
import AppointmentModal from '../../components/Appointments/AppointmentModal';
import { useAuth } from '../../contexts/AuthContext'; // Assuming useAuth might be needed for user-specific data in future

// Mock data - replace with API calls
const mockAppointmentsData = [
  { id: '1', patientName: 'John Doe', patientId: 'p1', doctorName: 'Dr. Emily Carter', doctorId: 'd1', date: '2024-10-28', time: '09:00', status: 'Confirmed', notes: 'Routine check-up' },
  { id: '2', patientName: 'Alice Smith', patientId: 'p2', doctorName: 'Dr. Ben Miller', doctorId: 'd2', date: '2024-10-28', time: '11:00', status: 'Pending', notes: 'Follow-up consultation' },
  { id: '3', patientName: 'Bob Lee', patientId: 'p3', doctorName: 'Dr. Emily Carter', doctorId: 'd1', date: '2024-10-29', time: '14:00', status: 'Confirmed', notes: '' },
  { id: '4', patientName: 'Sarah Williams', patientId: 'p4', doctorName: 'Dr. Charles Brown', doctorId: 'd3', date: '2024-10-30', time: '10:30', status: 'Cancelled', notes: 'Patient rescheduled' },
];

const mockDoctors = [
  { id: 'd1', name: 'Dr. Emily Carter' },
  { id: 'd2', name: 'Dr. Ben Miller' },
  { id: 'd3', name: 'Dr. Charles Brown' },
];

const mockPatients = [
  { id: 'p1', name: 'John Doe' },
  { id: 'p2', name: 'Alice Smith' },
  { id: 'p3', name: 'Bob Lee' },
  { id: 'p4', name: 'Sarah Williams' },
];

const AppointmentsPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [appointments, setAppointments] = useState(mockAppointmentsData);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [currentMonthAppointments, setCurrentMonthAppointments] = useState([]);
  const [displayedDate, setDisplayedDate] = useState(new Date());

  // Filter appointments for the calendar based on displayed month/year
  const updateCalendarAppointments = useCallback((date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const filtered = appointments.filter(appt => {
      const apptDate = new Date(appt.date);
      return apptDate.getFullYear() === year && apptDate.getMonth() === month;
    });
    setCurrentMonthAppointments(filtered);
  }, [appointments]);

  useEffect(() => {
    updateCalendarAppointments(displayedDate);
  }, [displayedDate, updateCalendarAppointments]);

  const handleDateClick = (date) => {
    // For now, just log. Could filter table or open modal for this date.
    console.log('Date clicked:', date);
    // Open modal to add appointment for this date
    setSelectedAppointment(null); // Clear any selected appointment
    // Pre-fill date in modal if desired by modifying initialData for AppointmentModal
    onOpen();
  };

  const handleAddAppointmentClick = () => {
    setSelectedAppointment(null);
    onOpen();
  };

  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    onOpen();
  };

  const handleSaveAppointment = (appointmentData) => {
    // Mock save
    if (selectedAppointment) {
      setAppointments(appointments.map(appt => appt.id === selectedAppointment.id ? { ...selectedAppointment, ...appointmentData } : appt));
      toast({ title: 'Appointment Updated', status: 'success', duration: 3000, isClosable: true });
    } else {
      const newAppointment = { ...appointmentData, id: Date.now().toString() }; // Mock ID
      setAppointments([...appointments, newAppointment]);
      toast({ title: 'Appointment Booked', status: 'success', duration: 3000, isClosable: true });
    }
    updateCalendarAppointments(displayedDate); // Re-filter calendar appointments
    onClose();
  };

  const handleDeleteAppointment = (appointmentId) => {
    // Mock delete (or change status to Cancelled)
    setAppointments(appointments.map(appt => appt.id === appointmentId ? { ...appt, status: 'Cancelled' } : appt));
    toast({ title: 'Appointment Cancelled', status: 'warning', duration: 3000, isClosable: true });
    updateCalendarAppointments(displayedDate); // Re-filter calendar appointments
  };

  const getStatusColorScheme = (status) => {
    switch (status) {
      case 'Confirmed': return 'green';
      case 'Pending': return 'yellow';
      case 'Cancelled': return 'red';
      default: return 'gray';
    }
  };

  // Upcoming appointments (e.g., today and future, not cancelled)
  const upcomingAppointments = appointments
    .filter(appt => new Date(appt.date) >= new Date().setHours(0,0,0,0) && appt.status !== 'Cancelled')
    .sort((a, b) => new Date(a.date) - new Date(b.date) || a.time.localeCompare(b.time));

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size="lg">Appointments</Heading>
        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={handleAddAppointmentClick}>
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

      <Box mt={8} bg="white" p={6} borderRadius="lg" shadow="card">
        <Heading as="h2" size="md" mb={4}>Upcoming Appointments</Heading>
        {upcomingAppointments.length > 0 ? (
          <Table variant="simple">
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
                  <Td>{appt.patientName}</Td>
                  <Td>{appt.doctorName}</Td>
                  <Td>{new Date(appt.date).toLocaleDateString()}</Td>
                  <Td>{appt.time}</Td>
                  <Td><Tag colorScheme={getStatusColorScheme(appt.status)}>{appt.status}</Tag></Td>
                  <Td>
                    <HStack spacing={2}>
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
        ) : (
          <Text>No upcoming appointments.</Text>
        )}
      </Box>

      <AppointmentModal
        isOpen={isOpen}
        onClose={onClose}
        onSave={handleSaveAppointment}
        initialData={selectedAppointment}
        doctors={mockDoctors}
        patients={mockPatients}
      />
    </Box>
  );
};

export default AppointmentsPage;
