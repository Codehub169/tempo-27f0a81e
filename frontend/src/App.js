import React, { createContext, useContext, useState } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ChakraProvider, Box } from '@chakra-ui/react';
import theme from './theme';
import MainLayout from './components/Layout/MainLayout';

// Placeholder Pages (to be implemented in later batches)
const LoginPagePlaceholder = () => {
  const { login } = useAuth();
  // Simulate login for dev, actual login page will have form
  React.useEffect(() => {
    // Check if we are on the login page explicitly, not from a redirect loop
    if (window.location.pathname === '/login' && !localStorage.getItem('isAuthenticated')) {
        // This is a simplified auto-login for MVP testing of protected routes.
        // In a real app, LoginPage.js would handle form submission.
        console.log("Attempting mock login from LoginPagePlaceholder...");
        login();
    }
  }, [login]);
  return <Box p={4}>Login Page - Placeholder. Attempting auto-login for dev...</Box>;
};
const DashboardPage = () => <Box p={4}>Dashboard Page - Placeholder</Box>;
const AppointmentsPage = () => <Box p={4}>Appointments Page - Placeholder</Box>;
const PatientsPage = () => <Box p={4}>Patients Page - Placeholder</Box>;
const DoctorsPage = () => <Box p={4}>Doctors Page - Placeholder</Box>;
const InventoryPage = () => <Box p={4}>Inventory Page - Placeholder</Box>;
const BillingPage = () => <Box p={4}>Billing Page - Placeholder</Box>;
const ReportsPage = () => <Box p={4}>Reports Page - Placeholder</Box>;
const SettingsPage = () => <Box p={4}>Settings Page - Placeholder</Box>; 

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('isAuthenticated') === 'true');

  const login = () => {
    localStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
    console.log("User logged in (mock)");
  };

  const logout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    console.log("User logged out (mock)");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const PrivateRoute = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

function App() {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPagePlaceholder />} />
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
          <Route path="*" element={<Navigate to="/dashboard" replace />} /> 
        </Routes>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;
