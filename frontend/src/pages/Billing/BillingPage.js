import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Heading, 
    Button, 
    Text, 
    VStack, 
    useToast, 
    Table, 
    Thead, 
    Tbody, 
    Tr, 
    Th, 
    Td, 
    TableContainer, 
    Tag,
    HStack,
    IconButton
} from '@chakra-ui/react';
import { FiPlus, FiEdit, FiTrash2, FiEye } from 'react-icons/fi';
// import { api } from '../../services/apiService'; // Example for future API calls
// import BillModal from '../../components/Billing/BillModal'; // Example for future modal

const mockBillsData = [
  {
    id: 'B001',
    patientName: 'John Doe',
    date: '2024-10-26',
    amount: 150.00,
    status: 'Paid',
    items: [{ name: 'Consultation', price: 80 }, { name: 'Eye Drops', price: 70 }]
  },
  {
    id: 'B002',
    patientName: 'Alice Smith',
    date: '2024-10-25',
    amount: 220.50,
    status: 'Pending',
    items: [{ name: 'Full Eye Exam', price: 120 }, { name: 'Contact Lens Fitting', price: 100.50 }]
  },
  {
    id: 'B003',
    patientName: 'Bob Lee',
    date: '2024-10-24',
    amount: 75.00,
    status: 'Overdue',
    items: [{ name: 'Follow-up Visit', price: 75 }]
  }
];

function BillingPage() {
  const [bills, setBills] = useState(mockBillsData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const toast = useToast();

  // useEffect(() => {
  //   // Fetch bills from API in a real application
  //   // api.get('/billing').then(response => setBills(response.data)).catch(err => console.error(err));
  // }, []);

  const handleOpenModal = (bill = null) => {
    setSelectedBill(bill);
    setIsModalOpen(true);
    toast({
        title: 'Info', 
        description: 'Bill creation/editing modal would open here.', 
        status: 'info', 
        duration: 3000, 
        isClosable: true
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBill(null);
  };

  const handleSaveBill = (billData) => {
    // API call to save bill
    toast({ title: 'Success', description: `Bill ${billData.id ? 'updated' : 'created'}.`, status: 'success' });
    handleCloseModal();
    // Refresh bills list
  };

  const handleDeleteBill = (billId) => {
    // API call to delete bill
    toast({ title: 'Success', description: `Bill ${billId} deleted.`, status: 'error' });
    // Refresh bills list
  };
  
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'green';
      case 'pending': return 'yellow';
      case 'overdue': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Box p={5}>
      <VStack spacing={5} align="stretch">
        <HStack justifyContent="space-between">
            <Heading as="h1" size="xl">Billing Management</Heading>
            <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={() => handleOpenModal()}>
                Create New Bill
            </Button>
        </HStack>
        
        <Text>Manage patient invoices, track payments, and generate billing statements.</Text>

        <TableContainer borderWidth="1px" borderRadius="lg" p={0}>
            <Table variant="simple">
                <Thead bg="gray.50">
                    <Tr>
                        <Th>Invoice ID</Th>
                        <Th>Patient</Th>
                        <Th>Date</Th>
                        <Th isNumeric>Amount</Th>
                        <Th>Status</Th>
                        <Th>Actions</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {bills.map((bill) => (
                        <Tr key={bill.id}>
                            <Td>{bill.id}</Td>
                            <Td>{bill.patientName}</Td>
                            <Td>{bill.date}</Td>
                            <Td isNumeric>${bill.amount.toFixed(2)}</Td>
                            <Td>
                                <Tag colorScheme={getStatusColor(bill.status)}>{bill.status}</Tag>
                            </Td>
                            <Td>
                                <HStack spacing={2}>
                                    <IconButton icon={<FiEye />} aria-label="View Bill" variant="ghost" onClick={() => handleOpenModal(bill)} />
                                    <IconButton icon={<FiEdit />} aria-label="Edit Bill" variant="ghost" onClick={() => handleOpenModal(bill)} />
                                    <IconButton icon={<FiTrash2 />} aria-label="Delete Bill" variant="ghost" colorScheme="red" onClick={() => handleDeleteBill(bill.id)} />
                                </HStack>
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </TableContainer>
        {bills.length === 0 && <Text>No bills found. Click 'Create New Bill' to get started.</Text>}

        {/* Placeholder for BillModal if it were implemented */}
        {/* isModalOpen && (
          <BillModal 
            isOpen={isModalOpen} 
            onClose={handleCloseModal} 
            onSave={handleSaveBill} 
            initialData={selectedBill} 
          />
        ) */}
      </VStack>
    </Box>
  );
}

export default BillingPage;
