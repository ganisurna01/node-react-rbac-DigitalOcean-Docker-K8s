import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import Login from './components/Login';
import Register from './components/Register';
import Home from './pages/Home';
import UserPage from './pages/UserPage';
import ManagerPage from './pages/ManagerPage';
import AdminPage from './pages/AdminPage';
import Unauthorized from './pages/Unauthorized';
import NoAuthRoute from './components/NoAuthRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          {/* Navigation is shown only when user is authenticated */}
          <Navigation />
          
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<NoAuthRoute><Login /></NoAuthRoute>} />
            <Route path="/register" element={<NoAuthRoute><Register /></NoAuthRoute>} />
            
            {/* Protected Routes - Authentication Required */}
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            
            {/* User Route - All authenticated users can access */}
            <Route
              path="/user"
              element={
                <ProtectedRoute>
                  <UserPage />
                </ProtectedRoute>
              }
            />
            
            {/* Manager Route - Only managers and admins can access */}
            <Route
              path="/manager"
              element={
                <RoleProtectedRoute allowedRoles={['manager', 'admin']}>
                  <ManagerPage />
                </RoleProtectedRoute>
              }
            />
            
            {/* Admin Route - Only admins can access */}
            <Route
              path="/admin"
              element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <AdminPage />
                </RoleProtectedRoute>
              }
            />
            
            {/* Unauthorized Page */}
            <Route
              path="/unauthorized"
              element={
                <ProtectedRoute>
                  <Unauthorized />
                </ProtectedRoute>
              }
            />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/home" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

