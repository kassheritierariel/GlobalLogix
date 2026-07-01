import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Shipments from './pages/Shipments';
import AdminManagement from './pages/AdminManagement';
import Tracking from './pages/Tracking';
import Analytics from './pages/Analytics';
import Customers from './pages/Customers';
import AgencyManagement from './pages/AgencyManagement';
import Settings from './pages/Settings';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AgencyProvider } from './contexts/AgencyContext';
import './i18n/config';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // Redirect unauthorized to dashboard
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <AgencyProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Layout />}>
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/shipments" element={<ProtectedRoute><Shipments /></ProtectedRoute>} />
              <Route path="/admin-management" element={<ProtectedRoute allowedRoles={['super_admin']}><AdminManagement /></ProtectedRoute>} />
              <Route path="/tracking" element={<ProtectedRoute><Tracking /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
              <Route path="/agencies" element={<ProtectedRoute allowedRoles={['super_admin']}><AgencyManagement /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AgencyProvider>
    </AuthProvider>
  );
}
