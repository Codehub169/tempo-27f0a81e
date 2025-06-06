import React, { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Input, Button, VStack, Select, Textarea, useToast, 
  NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
  Text, HStack, IconButton, SimpleGrid, Box, Heading // Added Heading
} from '@chakra-ui/react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

// Mock data - replace with props or API calls
const mockPatients = [
  { id: 'p1', name: 'John Doe' },
  { id: 'p2', name: 'Alice Smith' },
];
const mockInventoryItems = [
  { id: 'i1', name: 'Consultation Service', price: 80.00, isService: true, stock: 0 }, // Services might not have stock or it's irrelevant
  { id: 'i2', name: 'Eye Drops (Brand X)', price: 15.50, isService: false, stock: 50 },
  { id: 'i3', name: 'Contact Lens Solution', price: 12.00, isService: false, stock: 30 },
];

const BillModal = ({ isOpen, onClose, onSave, initialData, patients = mockPatients, inventoryItems = mockInventoryItems }) => {
  const [formData, setFormData] = useState({});
  const [billItems, setBillItems] = useState([]);
  const toast = useToast();

  const defaultFormState = {
    patient_id: '',
    bill_date: new Date().toISOString().split('T')[0],
    payment_status: 'Unpaid',
    notes: '',
  };

  const defaultBillItemState = {
    // Using a more robust temporary ID for React keys, especially if items can be added quickly
    id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    inventory_item_id: '',
    service_description: '',
    quantity: 1,
    unit_price: 0.00,
  };

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          patient_id: initialData.patient_id || '',
          bill_date: initialData.bill_date ? new Date(initialData.bill_date).toISOString().split('T')[0] : defaultFormState.bill_date,
          payment_status: initialData.payment_status || 'Unpaid',
          notes: initialData.notes || '',
        });
        // Ensure bill items from initialData have temporary client-side IDs
        setBillItems((initialData.bill_items || []).map((item, index) => ({
          ...item, 
          id: item.id || `temp-init-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}` 
        })));
      } else {
        setFormData(defaultFormState);
        setBillItems([{
            ...defaultBillItemState, 
            id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }]);
      }
    }
  }, [initialData, isOpen]); // defaultFormState.bill_date removed as it's stable

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...billItems];
    newItems[index][field] = value;

    if (field === 'inventory_item_id' && value) {
      const selectedInventoryItem = inventoryItems.find(invItem => invItem.id === value);
      if (selectedInventoryItem) {
        newItems[index].unit_price = selectedInventoryItem.price;
        newItems[index].service_description = selectedInventoryItem.isService ? selectedInventoryItem.name : '';
        // If it's an inventory item (product or service), custom description might be cleared or disabled.
        // Current logic: service_description is set to item name if it's a service, else cleared.
      }
    } else if (field === 'inventory_item_id' && !value) {
        // Clear unit price if inventory item is deselected, allowing manual entry
        newItems[index].unit_price = 0.00;
    }
    setBillItems(newItems);
  };

  const handleNumericItemChange = (index, field, valueAsString, valueAsNumber) => {
    const newItems = [...billItems];
    // Ensure valueAsNumber is used, or fallback to 0 if NaN (e.g. empty input)
    newItems[index][field] = isNaN(valueAsNumber) ? 0 : valueAsNumber;
    setBillItems(newItems);
  };

  const addItem = () => {
    setBillItems([...billItems, {
        ...defaultBillItemState, 
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }]);
  };

  const removeItem = (index) => {
    const newItems = billItems.filter((_, i) => i !== index);
    setBillItems(newItems);
  };

  const calculateTotal = () => {
    return billItems.reduce((acc, item) => {
        const price = parseFloat(item.unit_price) || 0;
        const qty = parseInt(item.quantity) || 0;
        return acc + (price * qty);
    }, 0).toFixed(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.patient_id) {
      toast({ title: 'Missing Information', description: 'Please select a patient.', status: 'error', duration: 3000, isClosable: true });
      return;
    }
    if (billItems.length === 0 || billItems.some(item => (!item.inventory_item_id && !item.service_description))) {
        toast({ title: 'Invalid Bill Item', description: 'Each bill item must have a service/product selected or a custom description.', status: 'error', duration: 4000, isClosable: true });
        return;
    }
    if (billItems.some(item => (item.quantity <= 0 || item.unit_price < 0))) {
        toast({ title: 'Invalid Item Value', description: 'Item quantity must be positive and unit price non-negative.', status: 'error', duration: 4000, isClosable: true });
        return;
    }

    // Remove temporary client-side ID and ensure correct data types before saving
    const itemsToSave = billItems.map(({ id, ...rest }) => ({
        ...rest,
        quantity: parseInt(rest.quantity) || 1,
        unit_price: parseFloat(rest.unit_price) || 0,
        // Ensure inventory_item_id is null if empty string, or actual ID
        inventory_item_id: rest.inventory_item_id || null,
    }));

    onSave({ ...formData, bill_items: itemsToSave, total_amount: parseFloat(calculateTotal()) });
    // onClose will be called by parent page typically after successful save
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontFamily="secondary">
          {initialData?.id ? 'Edit Bill' : 'Create New Bill'}
        </ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <SimpleGrid columns={{base: 1, md: 2}} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Patient</FormLabel>
                  <Select name="patient_id" value={formData.patient_id || ''} onChange={handleFormChange} placeholder="Select patient">
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Bill Date</FormLabel>
                  <Input type="date" name="bill_date" value={formData.bill_date || ''} onChange={handleFormChange} />
                </FormControl>
              </SimpleGrid>

              <Heading size="sm" mt={4} mb={2} fontFamily="heading">Bill Items</Heading>
              <VStack spacing={4} align="stretch" maxHeight="40vh" overflowY="auto" pr={2}>
                {billItems.map((item, index) => (
                  <Box key={item.id} p={3} borderWidth="1px" borderRadius="md" bg="gray.50">
                    <HStack spacing={2} mb={2} justifyContent="space-between">
                       <Text fontWeight="medium">Item #{index + 1}</Text>
                       {billItems.length > 1 && (
                        <IconButton icon={<FiTrash2 />} size="sm" colorScheme="red" variant="ghost" aria-label="Remove item" onClick={() => removeItem(index)} />
                       )}
                    </HStack>
                    <SimpleGrid columns={{base: 1, md: 2, lg:4}} spacing={3}>
                        <FormControl>
                            <FormLabel fontSize="sm">Service/Product</FormLabel>
                            <Select 
                                placeholder="Select item"
                                size="sm"
                                value={item.inventory_item_id || ''}
                                onChange={(e) => handleItemChange(index, 'inventory_item_id', e.target.value)}
                            >
                                {inventoryItems.map(inv => (
                                    <option key={inv.id} value={inv.id}>{inv.name} {inv.isService ? '(Service)' : `(Stock: ${inv.stock})`}</option>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl>
                            <FormLabel fontSize="sm">Custom Service</FormLabel>
                            <Input 
                                placeholder="Or describe service"
                                size="sm"
                                value={item.service_description || ''}
                                onChange={(e) => handleItemChange(index, 'service_description', e.target.value)}
                                isDisabled={!!item.inventory_item_id}
                            />
                        </FormControl>
                        <FormControl isRequired>
                            <FormLabel fontSize="sm">Quantity</FormLabel>
                            <NumberInput 
                                min={1} 
                                size="sm"
                                value={item.quantity || 1}
                                onChange={(valStr, valNum) => handleNumericItemChange(index, 'quantity', valStr, valNum)}
                            >
                                <NumberInputField />
                                <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                            </NumberInput>
                        </FormControl>
                        <FormControl isRequired>
                            <FormLabel fontSize="sm">Unit Price</FormLabel>
                            <NumberInput 
                                precision={2} 
                                step={0.01} 
                                min={0}
                                size="sm"
                                value={item.unit_price || 0.00}
                                onChange={(valStr, valNum) => handleNumericItemChange(index, 'unit_price', valStr, valNum)}
                                isDisabled={!!item.inventory_item_id} // Corrected: Price from inventory is fixed
                            >
                                <NumberInputField />
                                <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                            </NumberInput>
                        </FormControl>
                    </SimpleGrid>
                  </Box>
                ))}
              </VStack>
              <Button leftIcon={<FiPlus />} size="sm" onClick={addItem} mt={2} alignSelf="flex-start">
                Add Item
              </Button>

              <FormControl mt={4}>
                <FormLabel>Payment Status</FormLabel>
                <Select name="payment_status" value={formData.payment_status || 'Unpaid'} onChange={handleFormChange}>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Voided">Voided</option>
                </Select>
              </FormControl>

              <FormControl mt={4}>
                <FormLabel>Notes (Optional)</FormLabel>
                <Textarea name="notes" value={formData.notes || ''} onChange={handleFormChange} placeholder="Any notes for this bill..." />
              </FormControl>

              <HStack justifyContent="flex-end" mt={6} fontWeight="bold" fontSize="lg">
                <Text>Total Amount:</Text>
                <Text color="brand.500">${calculateTotal()}</Text>
              </HStack>

            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>Cancel</Button>
            <Button type="submit" colorScheme="blue">
              {initialData?.id ? 'Save Changes' : 'Create Bill'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default BillModal;
