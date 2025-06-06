import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  GridItem,
  Button,
  Text,
  Flex,
  Heading,
  Icon,
  Tag,
} from '@chakra-ui/react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

// Helper to get days in a month (1-indexed for day)
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
// Helper to get the first day of the month (0 for Sunday, 1 for Monday, etc.)
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const AppointmentCalendar = ({ appointments = [], onDateClick, onAddAppointmentClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarGrid, setCalendarGrid] = useState([]);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const generateCalendarGrid = useCallback(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const grid = [];

    // Add padding days from previous month
    for (let i = 0; i < firstDay; i++) {
      grid.push({ key: `prev-${i}`, day: null, isCurrentMonth: false });
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(currentYear, currentMonth, day);
      const dateStr = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
      const dayAppointments = appointments.filter(app => app.date === dateStr);
      grid.push({ 
        key: `current-${day}`,
        day,
        date: dateObj,
        isCurrentMonth: true,
        appointments: dayAppointments 
      });
    }

    // Add padding days for next month to fill grid (e.g., to 35 or 42 cells)
    const totalCells = grid.length > 35 ? 42 : (grid.length > 28 ? 35 : 28); // Adjust for shorter months too
    let nextMonthDay = 1;
    while (grid.length < totalCells) {
      grid.push({ key: `next-${nextMonthDay}`, day: null, isCurrentMonth: false, isNextMonthPadding: true, dayNum: nextMonthDay++ });
    }
    setCalendarGrid(grid);
  }, [currentMonth, currentYear, appointments]);

  useEffect(() => {
    generateCalendarGrid();
  }, [generateCalendarGrid]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleDayClick = (dayData) => {
    if (dayData.isCurrentMonth && onDateClick) {
      onDateClick(dayData.date);
    }
  };

  return (
    <Box p={5} bg="white" borderRadius="lg" shadow="card" mb={6}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md" fontFamily="secondary">
          {monthNames[currentMonth]} {currentYear}
        </Heading>
        <Flex>
          <Button onClick={handlePrevMonth} leftIcon={<Icon as={FiChevronLeft} />} size="sm" mr={2} variant="outline">
            Prev
          </Button>
          <Button onClick={handleNextMonth} rightIcon={<Icon as={FiChevronRight} />} size="sm" variant="outline">
            Next
          </Button>
        </Flex>
      </Flex>

      <Grid templateColumns="repeat(7, 1fr)" gap="1px" border="1px solid" borderColor="border">
        {dayNames.map((dayName) => (
          <GridItem key={dayName} p={2} textAlign="center" fontWeight="semibold" bg="neutral.lightGray" borderBottom="1px solid" borderColor="border">
            {dayName}
          </GridItem>
        ))}
        {calendarGrid.map((cell) => (
          <GridItem
            key={cell.key}
            p={2}
            minH="100px"
            border="1px solid" 
            borderColor="border"
            bg={cell.isCurrentMonth ? 'white' : 'gray.50'}
            opacity={cell.isCurrentMonth ? 1 : 0.5}
            cursor={cell.isCurrentMonth ? 'pointer' : 'default'}
            onClick={() => cell.isCurrentMonth && handleDayClick(cell)}
            _hover={cell.isCurrentMonth ? { bg: 'primary.50' } : {}}
            position="relative"
            overflowY="auto"
            maxHeight="120px"
          >
            {cell.isCurrentMonth && <Text fontWeight="medium">{cell.day}</Text>}
            {cell.isNextMonthPadding && <Text color="gray.400">{cell.dayNum}</Text>}
            {cell.appointments && cell.appointments.map((app, index) => (
              <Tag 
                key={index} 
                size="sm" 
                variant="solid" 
                colorScheme={app.status === 'Confirmed' ? 'primary' : (app.status === 'Pending' ? 'yellow' : 'gray')} // Example: Differentiate appointments by status
                mt={1} 
                isTruncated
                title={`${app.patientName} - ${app.doctorName} (${app.time}) - ${app.status}`}
                w="full"
              >
                {app.patientName} ({app.time})
              </Tag>
            ))}
          </GridItem>
        ))}
      </Grid>
      {onAddAppointmentClick && (
         <Button mt={4} colorScheme="primary" onClick={onAddAppointmentClick} leftIcon={<Icon as={FiCalendar}/>}>
           Book New Appointment
          </Button>
      )}
    </Box>
  );
};

export default AppointmentCalendar;
