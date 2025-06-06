import React, { useState, useMemo } from 'react';
import {
  Box, Button, useDisclosure, useToast, Heading, Icon, Table, Thead, Tbody, Tr, Th, Td, IconButton, HStack, Text, Flex, Tag,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, Input, VStack, Select, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper
} from '@chakra-ui/react';
import { FiPlus, FiEdit, FiTrash2, FiPackage, FiDollarSign, FiAlertTriangle, FiTag, FiFilter } from 'react-icons/fi';

// Mock data - replace with API calls
const mockInventoryData = [
  { id: 'i1', itemName: 'Contact Lens Solution (360ml)', category: 'Lens Care', stock: 50, price: 12.99, reorderLevel: 20 },
  { id: 'i2', itemName: 'Eye Drops - Dry Eyes (10ml)', category: 'Medication', stock: 15, price: 8.50, reorderLevel: 10 },
  { id: 'i3', itemName: 'Reading Glasses (+1.5)', category: 'Eyewear', stock: 30, price: 25.00, reorderLevel: 15 },
  { id: 'i4', itemName: 'Sunglasses UV400', category: 'Eyewear', stock: 5, price: 75.00, reorderLevel: 5 },
  { id: 'i5', itemName: 'Lens Cleaning Wipes (100pcs)', category: 'Accessories', stock: 60, price: 5.99, reorderLevel: 25 },
];

const itemCategories = ['Lens Care', 'Medication', 'Eyewear', 'Accessories', 'Other'];
const LOW_STOCK_THRESHOLD_PERCENTAGE = 0.25; // Low stock if stock <= reorderLevel OR stock <= 25% of initial high stock (example logic)

const InventoryPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [inventory, setInventory] = useState(mockInventoryData);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentItemData, setCurrentItemData] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  const handleAddItemClick = () => {
    setSelectedItem(null);
    setCurrentItemData({ itemName: '', category: '', stock: 0, price: 0.00, reorderLevel: 5 });
    setIsEditing(false);
    onOpen();
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setCurrentItemData(item);
    setIsEditing(true);
    onOpen();
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentItemData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumericFormChange = (name, valueAsString, valueAsNumber) => {
    setCurrentItemData(prev => ({ ...prev, [name]: valueAsNumber }));
  };

  const handleSaveItem = () => {
    if (!currentItemData.itemName || !currentItemData.category || currentItemData.stock < 0 || currentItemData.price <= 0) {
      toast({ title: 'Error', description: 'Please fill all required fields with valid values.', status: 'error', duration: 3000, isClosable: true });
      return;
    }

    if (isEditing && selectedItem) {
      setInventory(inventory.map(item => item.id === selectedItem.id ? { ...item, ...currentItemData } : item));
      toast({ title: 'Item Updated', status: 'success', duration: 3000, isClosable: true });
    } else {
      const newItem = { ...currentItemData, id: Date.now().toString() }; // Mock ID
      setInventory([...inventory, newItem]);
      toast({ title: 'Item Added', status: 'success', duration: 3000, isClosable: true });
    }
    onClose();
  };

  const handleDeleteItem = (itemId) => {
    setInventory(inventory.filter(item => item.id !== itemId));
    toast({ title: 'Item Deleted', status: 'warning', duration: 3000, isClosable: true });
  };

  const isLowStock = (item) => {
    return item.stock <= item.reorderLevel || item.stock <= (item.reorderLevel * (1/LOW_STOCK_THRESHOLD_PERCENTAGE) * LOW_STOCK_THRESHOLD_PERCENTAGE); // Simplified logic
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size="lg">Inventory Management</Heading>
        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={handleAddItemClick}>
          Add New Item
        </Button>
      </Flex>

      <Box bg="white" p={0} borderRadius="lg" shadow="card" overflowX="auto">
        {inventory.length > 0 ? (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th><Icon as={FiPackage} mr={2} />Item Name</Th>
                <Th><Icon as={FiTag} mr={2} />Category</Th>
                <Th isNumeric><Icon as={FiFilter} mr={2} />Stock Level</Th>
                <Th isNumeric><Icon as={FiDollarSign} mr={2} />Price</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {inventory.map((item) => (
                <Tr key={item.id}>
                  <Td fontWeight="medium">{item.itemName}</Td>
                  <Td>{item.category}</Td>
                  <Td isNumeric>{item.stock}</Td>
                  <Td isNumeric>${item.price.toFixed(2)}</Td>
                  <Td>
                    {isLowStock(item) && (
                      <Tag colorScheme="orange" size="sm">
                        <Icon as={FiAlertTriangle} mr={1} /> Low Stock
                      </Tag>
                    )}
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton icon={<FiEdit />} aria-label="Edit Item" size="sm" variant="ghost" colorScheme="blue" onClick={() => handleEditItem(item)} />
                      <IconButton icon={<FiTrash2 />} aria-label="Delete Item" size="sm" variant="ghost" colorScheme="red" onClick={() => handleDeleteItem(item.id)} />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <Box p={6} textAlign="center">
            <Text>No inventory items found. Add an item to get started.</Text>
          </Box>
        )}
      </Box>

      {/* Inventory Item Add/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{isEditing ? 'Edit Inventory Item' : 'Add New Inventory Item'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Item Name</FormLabel>
                <Input name="itemName" value={currentItemData.itemName || ''} onChange={handleFormChange} placeholder="e.g., Eye Drops Model X" />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Category</FormLabel>
                <Select name="category" value={currentItemData.category || ''} onChange={handleFormChange} placeholder="Select category">
                  {itemCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Stock Level</FormLabel>
                <NumberInput name="stock" value={currentItemData.stock || 0} min={0} onChange={(valueAsString, valueAsNumber) => handleNumericFormChange('stock', valueAsString, valueAsNumber)}>
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Price</FormLabel>
                <NumberInput name="price" value={currentItemData.price || 0.00} min={0.01} precision={2} step={0.01} onChange={(valueAsString, valueAsNumber) => handleNumericFormChange('price', valueAsString, valueAsNumber)}>
                  <NumberInputField placeholder="e.g., 10.99" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Reorder Level</FormLabel>
                 <NumberInput name="reorderLevel" value={currentItemData.reorderLevel || 5} min={0} onChange={(valueAsString, valueAsNumber) => handleNumericFormChange('reorderLevel', valueAsString, valueAsNumber)}>
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
            <Button colorScheme="blue" onClick={handleSaveItem}>
              {isEditing ? 'Save Changes' : 'Add Item'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default InventoryPage;
