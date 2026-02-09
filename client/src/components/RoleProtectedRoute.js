import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * RoleProtectedRoute - Protects routes based on user roles
 * 
 * This component checks if the user has the required role(s) to access a route.
 * If not, it redirects to an unauthorized page or home.
 * 
 * Usage:
 * <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
 *   <AdminPage />
 * </RoleProtectedRoute>
 */
const RoleProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: 'white',
        fontSize: '20px'
      }}>
        Loading...
      </div>
    );
  }

  // First check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Then check if user has required role
  if (!allowedRoles.includes(user?.role)) {
    // Redirect to unauthorized page or home
    return <Navigate to="/unauthorized" replace />;
  }

  // User is authenticated and has required role
  return children;
};

export default RoleProtectedRoute;

