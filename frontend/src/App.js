import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ChakraProvider, Box } from '@chakra-ui/react';
import theme from './theme';
import MainLayout from './components/Layout/MainLayout';
import { AuthProvider as MainAuthProvider, useAuth as useMainAuth } from './contexts/AuthContext';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage'; // Import the RegisterPage

// Placeholder Pages (to be implemented in later batches)
const DashboardPage = () => <Box p={4}>Dashboard Page - Placeholder</Box>;
const AppointmentsPage = () => <Box p={4}>Appointments Page - Placeholder</Box>;
const PatientsPage = () => <Box p={4}>Patients Page - Placeholder</Box>;
const DoctorsPage = () => <Box p={4}>Doctors Page - Placeholder</Box>;
const InventoryPage = () => <Box p={4}>Inventory Page - Placeholder</Box>;
const BillingPage = () => <Box p={4}>Billing Page - Placeholder</Box>;
const ReportsPage = () => <Box p={4}>Reports Page - Placeholder</Box>;
const SettingsPage = () => <Box p={4}>Settings Page - Placeholder</Box>; 

const PrivateRoute = () => {
  const { isAuthenticated, loading } = useMainAuth(); 
  const location = useLocation();

  if (loading) {
    return <Box p={4} textAlign="center" mt="20vh">Loading authentication...</Box>; 
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

const FallbackRedirect = () => {
  const { isAuthenticated, loading } = useMainAuth();

  if (loading) {
    return <Box p={4} textAlign="center" mt="20vh">Loading...</Box>; 
  }

  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
};

function App() {
  return (
    <ChakraProvider theme={theme}>
      <MainAuthProvider> 
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} /> {/* Add register route here */}
          <Route element={<PrivateRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/doctors" element={<DoctorsPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} /> 
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
          {/* Fallback route for any unmatched paths */}
          <Route path="*" element={<FallbackRedirect />} /> 
        </Routes>
      </MainAuthProvider>
    </ChakraProvider>
  );
}

export default App;
