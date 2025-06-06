import React, { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Input, Button, VStack, Select, Textarea, useToast, 
  NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
  Text, HStack, IconButton, SimpleGrid, Box, Heading, FormErrorMessage
} from '@chakra-ui/react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

const BillModal = ({ isOpen, onClose, onSave, initialData, patients = [], inventoryItems = [] }) => {
  const [formData, setFormData] = useState({});
  const [billItems, setBillItems] = useState([]);
  const [errors, setErrors] = useState({}); // For top-level form errors
  const toast = useToast();

  // Wrapped in useMemo to ensure stable references if defined inside component, though defining outside is also fine.
  const defaultFormState = React.useMemo(() => ({
    patient_id: '',
    bill_date: new Date().toISOString().split('T')[0],
    payment_status: 'Unpaid',
    notes: '',
  }), []);

  const createDefaultBillItemState = React.useCallback(() => ({
    id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    inventory_item_id: '',
    service_description: '',
    quantity: 1,
    unit_price: '0.00', // Store as string to match input and backend expectations
    itemError: null, // For item-specific errors
  }), []);

  useEffect(() => {
    if (isOpen) {
      setErrors({}); // Clear general form errors
      if (initialData) {
        setFormData({
          patient_id: initialData.patient_id?.toString() || '',
          bill_date: initialData.bill_date ? new Date(initialData.bill_date).toISOString().split('T')[0] : defaultFormState.bill_date,
          payment_status: initialData.payment_status || 'Unpaid',
          notes: initialData.notes || '',
        });
        setBillItems((initialData.bill_items || []).map((item, index) => ({
          ...item,
          id: item.id?.toString() || `temp-init-${Date.now()}-${index}`,
          inventory_item_id: item.inventory_item_id?.toString() || '',
          unit_price: parseFloat(item.unit_price || 0).toFixed(2),
          quantity: parseInt(item.quantity || 1),
          itemError: null,
        })));
      } else {
        setFormData(defaultFormState);
        setBillItems([createDefaultBillItemState()]);
      }
    }
  }, [initialData, isOpen, defaultFormState, createDefaultBillItemState]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...billItems];
    newItems[index][field] = value;
    newItems[index].itemError = null; // Clear item error on change

    if (field === 'inventory_item_id' && value) {
      const selectedInventoryItem = inventoryItems.find(invItem => invItem.id === value);
      if (selectedInventoryItem) {
        newItems[index].unit_price = parseFloat(selectedInventoryItem.price).toFixed(2);
        newItems[index].service_description = selectedInventoryItem.isService ? selectedInventoryItem.name : '';
      } else {
        newItems[index].unit_price = '0.00'; // Reset if item not found
      }
    } else if (field === 'inventory_item_id' && !value) {
        newItems[index].unit_price = '0.00'; // Reset unit price if inventory item is deselected
    }
    setBillItems(newItems);
  };

  const handleNumericItemChange = (index, field, valueAsString, valueAsNumber) => {
    const newItems = [...billItems];
    newItems[index].itemError = null; // Clear item error on change
    if (field === 'unit_price') {
        newItems[index][field] = isNaN(valueAsNumber) ? '0.00' : parseFloat(valueAsNumber).toFixed(2);
    } else { // quantity
        newItems[index][field] = isNaN(valueAsNumber) ? 1 : parseInt(valueAsNumber);
    }
    setBillItems(newItems);
  };

  const addItem = () => {
    setBillItems([...billItems, createDefaultBillItemState()]);
  };

  const removeItem = (index) => {
    // Prevent removing the last item if you want to enforce at least one item, or handle validation differently.
    // For now, allows removing all items, validation will catch it on submit.
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

  const validateBill = () => {
    let isValid = true;
    const newErrors = {};
    if (!formData.patient_id) {
      newErrors.patient_id = 'Patient is required.';
      isValid = false;
    }

    if (billItems.length === 0) {
        toast({ title: 'No Bill Items', description: 'Please add at least one item to the bill.', status: 'error', duration: 4000, isClosable: true });
        isValid = false;
        return isValid; // Early exit if no items
    }

    const updatedBillItems = billItems.map(item => {
        let itemError = null;
        if (!item.inventory_item_id && !item.service_description?.trim()) {
            itemError = 'Select a product/service or enter a description.';
            isValid = false;
        }
        if (parseInt(item.quantity) <= 0) {
            itemError = (itemError ? itemError + ' ' : '') + 'Quantity must be positive.';
            isValid = false;
        }
        if (parseFloat(item.unit_price) < 0) {
            itemError = (itemError ? itemError + ' ' : '') + 'Unit price cannot be negative.';
            isValid = false;
        }
        return { ...item, itemError };
    });
    setBillItems(updatedBillItems);
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateBill()) {
      toast({ title: 'Validation Error', description: 'Please correct the errors in the form.', status: 'warning', duration: 3000, isClosable: true });
      return;
    }

    const itemsToSave = billItems.map(({ id, itemError, ...rest }) => ({
        ...rest,
        inventory_item_id: rest.inventory_item_id || null,
        quantity: parseInt(rest.quantity),
        unit_price: parseFloat(rest.unit_price).toFixed(2),
        service_description: rest.inventory_item_id ? null : rest.service_description?.trim()
    }));    

    onSave({ ...formData, bill_items: itemsToSave, total_amount: parseFloat(calculateTotal()) });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside" isCentered>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit}>
        <ModalHeader fontFamily="heading" borderBottomWidth="1px">
          {initialData?.id ? 'Edit Bill' : 'Create New Bill'}
        </ModalHeader>
        <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <SimpleGrid columns={{base: 1, md: 2}} spacing={4}>
                <FormControl isRequired isInvalid={!!errors.patient_id}>
                  <FormLabel>Patient</FormLabel>
                  <Select name="patient_id" value={formData.patient_id || ''} onChange={handleFormChange} placeholder="Select patient">
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Select>
                  {errors.patient_id && <FormErrorMessage>{errors.patient_id}</FormErrorMessage>}
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Bill Date</FormLabel>
                  <Input type="date" name="bill_date" value={formData.bill_date || ''} onChange={handleFormChange} max={new Date().toISOString().split('T')[0]} />
                </FormControl>
              </SimpleGrid>

              <Heading size="sm" mt={4} mb={2} fontFamily="heading">Bill Items</Heading>
              <VStack spacing={4} align="stretch" maxHeight="40vh" overflowY="auto" pr={2}>
                {billItems.map((item, index) => (
                  <Box key={item.id} p={3} borderWidth="1px" borderRadius="md" bg={item.itemError ? "red.50" : "gray.50"} borderColor={item.itemError ? "red.300" : "gray.200"}>
                    <HStack spacing={2} mb={2} justifyContent="space-between">
                       <Text fontWeight="medium">Item #{index + 1}</Text>
                       {billItems.length > 0 && (
                        <IconButton icon={<FiTrash2 />} size="sm" colorScheme="red" variant="ghost" aria-label="Remove item" onClick={() => removeItem(index)} />
                       )}
                    </HStack>
                    <SimpleGrid columns={{base: 1, md: 2, lg:4}} spacing={3}>
                        <FormControl>
                            <FormLabel fontSize="sm">Service/Product</FormLabel>
                            <Select 
                                placeholder="Select item (optional)"
                                size="sm"
                                value={item.inventory_item_id || ''}
                                onChange={(e) => handleItemChange(index, 'inventory_item_id', e.target.value)}
                            >
                                {inventoryItems.map(inv => (
                                    <option key={inv.id} value={inv.id}>{inv.name} {inv.isService ? '(Service)' : `(Stock: ${inv.stock ?? 'N/A'})`}</option>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl>
                            <FormLabel fontSize="sm">Custom Service/Item</FormLabel>
                            <Input 
                                placeholder="Or describe service/item"
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
                                value={item.unit_price || '0.00'}
                                onChange={(valStr, valNum) => handleNumericItemChange(index, 'unit_price', valStr, valNum)}
                                isDisabled={!!item.inventory_item_id && !inventoryItems.find(inv=>inv.id === item.inventory_item_id)?.isService} 
                            >
                                <NumberInputField />
                                <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                            </NumberInput>
                        </FormControl>
                    </SimpleGrid>
                    {item.itemError && <Text color="red.500" fontSize="sm" mt={2}>{item.itemError}</Text>}
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
          <ModalFooter borderTopWidth="1px">
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" colorScheme="brand">
              {initialData?.id ? 'Save Changes' : 'Create Bill'}
            </Button>
          </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BillModal;
