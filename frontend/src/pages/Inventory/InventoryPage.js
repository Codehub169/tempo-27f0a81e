import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, useDisclosure, useToast, Heading, Icon, Table, Thead, Tbody, Tr, Th, Td, IconButton, HStack, Text, Flex, Tag,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, Input, VStack, Select, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, Textarea,
  Spinner, Alert, AlertIcon, FormErrorMessage
} from '@chakra-ui/react';
import { FiPlus, FiEdit, FiTrash2, FiPackage, FiDollarSign, FiAlertTriangle, FiTag, FiFilter } from 'react-icons/fi';
import api from '../../services/apiService';

const itemCategories = ['Lens Care', 'Medication', 'Eyewear', 'Accessories', 'Consumables', 'Equipment', 'Service', 'Other'];

const InventoryPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [inventory, setInventory] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentItemData, setCurrentItemData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const initialFormState = useCallback(() => ({
    name: '', 
    category: '', 
    description: '',
    quantity_on_hand: 0, 
    unit_price: 0.00, 
    reorder_level: 5, 
    supplier_info: ''
  }), []);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/inventory');
      setInventory(data || []);
    } catch (err) {
      console.error("Error fetching inventory:", err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch inventory');
      toast({ title: 'Error Fetching Inventory', description: err.response?.data?.message || err.message, status: 'error', duration: 5000, isClosable: true });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleAddItemClick = () => {
    setSelectedItem(null);
    setCurrentItemData(initialFormState());
    setFormErrors({});
    setIsEditing(false);
    onOpen();
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setCurrentItemData({ ...initialFormState(), ...item });
    setFormErrors({});
    setIsEditing(true);
    onOpen();
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentItemData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleNumericFormChange = (name, valueAsString, valueAsNumber) => {
    setCurrentItemData(prev => ({ ...prev, [name]: isNaN(valueAsNumber) ? 0 : valueAsNumber }));
    if (formErrors[name]) {
        setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!currentItemData.name?.trim()) errors.name = 'Item Name is required.';
    if (!currentItemData.category?.trim()) errors.category = 'Category is required.';
    if (currentItemData.quantity_on_hand === null || currentItemData.quantity_on_hand < 0) errors.quantity_on_hand = 'Stock Level must be 0 or greater.';
    if (currentItemData.unit_price === null || currentItemData.unit_price <= 0) errors.unit_price = 'Unit Price must be greater than 0.';
    if (currentItemData.reorder_level !== null && currentItemData.reorder_level < 0) errors.reorder_level = 'Reorder Level must be 0 or greater.';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveItem = async () => {
    if (!validateForm()) {
        toast({ title: 'Validation Error', description: 'Please correct the errors in the form.', status: 'error', duration: 3000, isClosable: true });
        return;
    }

    const payload = {
        name: currentItemData.name.trim(),
        category: currentItemData.category.trim(),
        description: currentItemData.description?.trim() || '',
        quantity_on_hand: parseInt(currentItemData.quantity_on_hand) || 0,
        reorder_level: parseInt(currentItemData.reorder_level) || 0,
        unit_price: parseFloat(currentItemData.unit_price) || 0.00,
        supplier_info: currentItemData.supplier_info?.trim() || '',
    };

    try {
      if (isEditing && selectedItem) {
        await api.put(`/inventory/${selectedItem.id}`, payload);
        toast({ title: 'Item Updated', status: 'success', duration: 3000, isClosable: true });
      } else {
        await api.post('/inventory', payload);
        toast({ title: 'Item Added', status: 'success', duration: 3000, isClosable: true });
      }
      fetchInventory();
      onClose();
    } catch (err) {
      console.error("Error saving inventory item:", err);
      toast({ title: 'Save Failed', description: err.response?.data?.message || err.message || 'Could not save item.', status: 'error', duration: 5000, isClosable: true });
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await api.delete(`/inventory/${itemId}`);
      toast({ title: 'Item Deleted', status: 'warning', duration: 3000, isClosable: true });
      fetchInventory();
    } catch (err) {
      console.error("Error deleting inventory item:", err);
      toast({ title: 'Delete Failed', description: err.response?.data?.message || err.message, status: 'error', duration: 5000, isClosable: true });
    }
  };

  const isLowStock = (item) => {
    return item.quantity_on_hand <= item.reorder_level;
  };

  if (loading && !inventory.length) return <Box p={4} textAlign="center"><Spinner size="xl" /><Text mt={2}>Loading inventory...</Text></Box>;
  if (error && !inventory.length) return <Alert status="error" variant="subtle"><AlertIcon />{error}</Alert>;

  return (
    <Box p={{ base: 2, md: 4 }}>
      <Flex justify="space-between" align="center" mb={6} direction={{ base: 'column', md: 'row' }} gap={2}>
        <Heading as="h1" size="lg">Inventory Management</Heading>
        <Button leftIcon={<FiPlus />} colorScheme="brand" onClick={handleAddItemClick} alignSelf={{ base: 'stretch', md: 'auto' }}>
          Add New Item
        </Button>
      </Flex>

      <Box bg="white" p={0} borderRadius="lg" shadow="card" overflowX="auto">
        {loading && inventory.length > 0 && <Box textAlign="center" py={4}><Spinner /></Box>}
        {!loading && inventory.length === 0 && (
          <Box p={6} textAlign="center">
            <Text>No inventory items found. Add an item to get started.</Text>
          </Box>
        )}
        {!loading && inventory.length > 0 && (
          <Table variant="simple" size={{base: "sm", md: "md"}}>
            <Thead>
              <Tr>
                <Th><Icon as={FiPackage} mr={2} />Item Name</Th>
                <Th><Icon as={FiTag} mr={2} />Category</Th>
                <Th isNumeric><Icon as={FiFilter} mr={2} />Stock</Th>
                <Th isNumeric><Icon as={FiDollarSign} mr={2} />Price</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {inventory.map((item) => (
                <Tr key={item.id}>
                  <Td fontWeight="medium">{item.name}</Td>
                  <Td>{item.category}</Td>
                  <Td isNumeric>{item.quantity_on_hand}</Td>
                  <Td isNumeric>${parseFloat(item.unit_price).toFixed(2)}</Td>
                  <Td>
                    {isLowStock(item) && (
                      <Tag colorScheme="orange" size="sm">
                        <Icon as={FiAlertTriangle} mr={1} /> Low Stock
                      </Tag>
                    )}
                  </Td>
                  <Td>
                    <HStack spacing={1}>
                      <IconButton icon={<FiEdit />} aria-label="Edit Item" size="sm" variant="ghost" colorScheme="blue" onClick={() => handleEditItem(item)} />
                      <IconButton icon={<FiTrash2 />} aria-label="Delete Item" size="sm" variant="ghost" colorScheme="red" onClick={() => handleDeleteItem(item.id)} />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>

      {isOpen && <Modal isOpen={isOpen} onClose={onClose} scrollBehavior="inside" isCentered>
        <ModalOverlay />
        <ModalContent as="form" onSubmit={(e) => { e.preventDefault(); handleSaveItem(); }}>
          <ModalHeader borderBottomWidth="1px">{isEditing ? 'Edit Inventory Item' : 'Add New Inventory Item'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={!!formErrors.name}>
                <FormLabel>Item Name</FormLabel>
                <Input name="name" value={currentItemData.name || ''} onChange={handleFormChange} placeholder="e.g., Eye Drops Model X" />
                {formErrors.name && <FormErrorMessage>{formErrors.name}</FormErrorMessage>}
              </FormControl>
              <FormControl isRequired isInvalid={!!formErrors.category}>
                <FormLabel>Category</FormLabel>
                <Select name="category" value={currentItemData.category || ''} onChange={handleFormChange} placeholder="Select category">
                  {itemCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </Select>
                {formErrors.category && <FormErrorMessage>{formErrors.category}</FormErrorMessage>}
              </FormControl>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea name="description" value={currentItemData.description || ''} onChange={handleFormChange} placeholder="Item description" />
              </FormControl>
              <FormControl isRequired isInvalid={!!formErrors.quantity_on_hand}>
                <FormLabel>Stock Level</FormLabel>
                <NumberInput name="quantity_on_hand" value={currentItemData.quantity_on_hand || 0} min={0} onChange={(valStr, valNum) => handleNumericFormChange('quantity_on_hand', valStr, valNum)}>
                  <NumberInputField />
                  <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                </NumberInput>
                {formErrors.quantity_on_hand && <FormErrorMessage>{formErrors.quantity_on_hand}</FormErrorMessage>}
              </FormControl>
              <FormControl isRequired isInvalid={!!formErrors.unit_price}>
                <FormLabel>Unit Price</FormLabel>
                <NumberInput name="unit_price" value={currentItemData.unit_price || 0.00} min={0.01} precision={2} step={0.01} onChange={(valStr, valNum) => handleNumericFormChange('unit_price', valStr, valNum)}>
                  <NumberInputField placeholder="e.g., 10.99" />
                  <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                </NumberInput>
                {formErrors.unit_price && <FormErrorMessage>{formErrors.unit_price}</FormErrorMessage>}
              </FormControl>
              <FormControl isInvalid={!!formErrors.reorder_level}>
                <FormLabel>Reorder Level</FormLabel>
                 <NumberInput name="reorder_level" value={currentItemData.reorder_level || 0} min={0} onChange={(valStr, valNum) => handleNumericFormChange('reorder_level', valStr, valNum)}>
                  <NumberInputField />
                  <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                </NumberInput>
                {formErrors.reorder_level && <FormErrorMessage>{formErrors.reorder_level}</FormErrorMessage>}
              </FormControl>
              <FormControl>
                <FormLabel>Supplier Info</FormLabel>
                <Input name="supplier_info" value={currentItemData.supplier_info || ''} onChange={handleFormChange} placeholder="Supplier name or ID" />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px">
            <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
            <Button type="submit" colorScheme="brand">
              {isEditing ? 'Save Changes' : 'Add Item'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>}
    </Box>
  );
};

export default InventoryPage;
