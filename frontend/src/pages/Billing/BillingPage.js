import React, { useState, useEffect, useCallback } from 'react';
import { 
    Box, Heading, Button, Text, VStack, useToast, Table, Thead, Tbody, Tr, Th, Td, 
    TableContainer, Tag, HStack, IconButton, useDisclosure, Spinner, Alert, AlertIcon, Flex
} from '@chakra-ui/react';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiFileText } from 'react-icons/fi';
import BillModal from '../../components/Billing/BillModal';
import api from '../../services/apiService';

function BillingPage() {
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [billsRes, patientsRes, inventoryRes] = await Promise.all([
        api.get('/bills'),
        api.get('/patients'),
        api.get('/inventory')
      ]);
      setBills(billsRes || []);
      setPatients(patientsRes || []);
      setInventoryItems(inventoryRes || []);
    } catch (err) {
      console.error("Error fetching billing page data:", err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch billing data');
      toast({ title: 'Error Fetching Data', description: err.response?.data?.message || err.message, status: 'error', duration: 5000, isClosable: true });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (bill = null) => {
    setSelectedBill(bill);
    onModalOpen();
  };

  const handleSaveBill = async (billData) => {
    try {
      const payload = {
        ...billData,
        patient_id: parseInt(billData.patient_id),
      };
      payload.bill_items = payload.bill_items.map(item => ({
        ...item,
        inventory_item_id: item.inventory_item_id ? parseInt(item.inventory_item_id) : null,
        quantity: parseInt(item.quantity),
        unit_price: parseFloat(item.unit_price).toFixed(2) 
      }));

      if (selectedBill && selectedBill.id) {
        // Backend PUT for /bills currently only supports payment_status and notes.
        // Full bill edit (items, patient, date) would typically require deleting and recreating or a more complex backend endpoint.
        const updatePayload = { 
            payment_status: payload.payment_status, 
            notes: payload.notes 
            // If items or total amount were editable, they'd be included here, but backend constraints apply
        };
        await api.put(`/bills/${selectedBill.id}`, updatePayload);
        toast({ title: 'Bill Updated', description: `Bill B${String(selectedBill.id).padStart(3, '0')} status/notes updated.`, status: 'success', duration: 3000, isClosable: true });
      } else {
        await api.post('/bills', payload);
        toast({ title: 'Bill Created', status: 'success', duration: 3000, isClosable: true });
      }
      fetchData();
      onModalClose();
    } catch (err) {
      console.error("Error saving bill:", err);
      toast({ title: 'Save Failed', description: err.response?.data?.message || err.message || 'Could not save bill.', status: 'error', duration: 5000, isClosable: true });
    }
  };

  const handleDeleteBill = async (billId) => {
    try {
      await api.delete(`/bills/${billId}`);
      toast({ title: 'Bill Deleted', description: `Bill B${String(billId).padStart(3, '0')} has been deleted. Inventory (if applicable) has been restocked.`, status: 'warning', duration: 4000, isClosable: true });
      fetchData();
    } catch (err) {
      console.error("Error deleting bill:", err);
      toast({ title: 'Delete Failed', description: err.response?.data?.message || err.message, status: 'error', duration: 5000, isClosable: true });
    }
  };
  
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'green';
      case 'unpaid': return 'orange';
      case 'pending': return 'yellow'; // Pending might mean awaiting confirmation or partial payment
      case 'overdue': return 'red';
      case 'partially paid': return 'teal';
      case 'voided': return 'gray';
      default: return 'gray';
    }
  };

  if (loading && !bills.length) return <Box p={4} textAlign="center"><Spinner size="xl" /><Text mt={2}>Loading bills...</Text></Box>;
  if (error && !bills.length) return <Alert status="error" variant="subtle"><AlertIcon />{error}</Alert>;

  return (
    <Box p={{ base: 2, md: 4 }}>
      <VStack spacing={5} align="stretch">
        <Flex justifyContent="space-between" alignItems="center" direction={{ base: 'column', md: 'row' }} gap={2} mb={4}>
            <Heading as="h1" size="lg">Billing Management</Heading>
            <Button leftIcon={<FiPlus />} colorScheme="brand" onClick={() => handleOpenModal()} alignSelf={{ base: 'stretch', md: 'auto'}}>
                Create New Bill
            </Button>
        </Flex>
        
        <Text fontSize="sm" color="gray.600" mb={4}>Manage patient invoices, track payments, and generate billing statements.</Text>

        <TableContainer borderWidth="1px" borderRadius="lg" p={0} bg="white" shadow="card" overflowX="auto">
            <Table variant="simple" size={{base: "sm", md: "md"}}>
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
                            <Td>B{String(bill.id).padStart(3, '0')}</Td>
                            <Td>{patients.find(p => p.id === bill.patient_id)?.full_name || 'N/A'}</Td>
                            <Td>{new Date(bill.bill_date).toLocaleDateString()}</Td>
                            <Td isNumeric>${parseFloat(bill.total_amount).toFixed(2)}</Td>
                            <Td>
                                <Tag colorScheme={getStatusColor(bill.payment_status)} size="sm" variant="subtle">{bill.payment_status}</Tag>
                            </Td>
                            <Td>
                                <HStack spacing={1}>
                                    {/* View Bill can use the same modal but in a read-only mode if implemented, or just open edit modal */}
                                    <IconButton icon={<FiEye />} aria-label="View/Edit Bill Details" variant="ghost" size="sm" onClick={() => handleOpenModal(bill)} />
                                    {/* Edit Bill is primarily for status/notes based on current backend */}
                                    <IconButton icon={<FiEdit />} aria-label="Edit Bill Status/Notes" variant="ghost" size="sm" colorScheme="blue" onClick={() => handleOpenModal(bill)} /> 
                                    <IconButton icon={<FiTrash2 />} aria-label="Delete Bill" variant="ghost" colorScheme="red" size="sm" onClick={() => handleDeleteBill(bill.id)} />
                                </HStack>
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </TableContainer>
        {bills.length === 0 && !loading && (
            <Flex direction="column" align="center" justify="center" p={10} borderWidth="1px" borderRadius="lg" bg="white" shadow="card" mt={4}>
                <Icon as={FiFileText} boxSize="50px" color="gray.400" />
                <Text mt={4} fontSize="xl" fontWeight="medium">No Bills Found</Text>
                <Text color="gray.500">Click 'Create New Bill' to get started.</Text>
            </Flex>
        )}

        {isModalOpen && (
          <BillModal 
            isOpen={isModalOpen} 
            onClose={onModalClose} 
            onSave={handleSaveBill} 
            initialData={selectedBill} 
            patients={patients.map(p => ({ id: p.id.toString(), name: p.full_name }))}
            inventoryItems={inventoryItems.map(i => ({ 
                id: i.id.toString(), 
                name: i.name, 
                price: parseFloat(i.unit_price), 
                isService: i.category === 'Service', 
                stock: i.quantity_on_hand 
            }))}
          />
        )}
      </VStack>
    </Box>
  );
}

export default BillingPage;
