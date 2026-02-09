import React from 'react';
import { useAuth } from '../context/AuthContext';
import './Page.css';

const Home = () => {
  const { user } = useAuth();

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return '#e74c3c';
      case 'manager':
        return '#f39c12';
      case 'user':
        return '#3498db';
      default:
        return '#95a5a6';
    }
  };

  return (
    <div className="page-container">
      <div className="page-content">
        <h1>Welcome to RBAC Application</h1>
        <div className="welcome-card">
          <p className="welcome-text">Hello, <strong>{user?.name}</strong>!</p>
          <div className="role-info">
            <span 
              className="role-badge-large" 
              style={{ backgroundColor: getRoleColor(user?.role) }}
            >
              {user?.role?.toUpperCase()}
            </span>
          </div>
          <p className="info-text">You are logged in as: <strong>{user?.email}</strong></p>
        </div>

        <div className="info-section">
          <h2>Available Pages Based on Your Role:</h2>
          <ul className="page-list">
            <li>✅ <strong>Home</strong> - Accessible to all authenticated users</li>
            <li>✅ <strong>User Page</strong> - Accessible to all authenticated users</li>
            {user?.role === 'manager' || user?.role === 'admin' ? (
              <li>✅ <strong>Manager Page</strong> - Accessible to managers and admins</li>
            ) : (
              <li>❌ <strong>Manager Page</strong> - Not accessible (requires manager/admin role)</li>
            )}
            {user?.role === 'admin' ? (
              <li>✅ <strong>Admin Page</strong> - Accessible to admins only</li>
            ) : (
              <li>❌ <strong>Admin Page</strong> - Not accessible (requires admin role)</li>
            )}
          </ul>
        </div>

        <div className="info-section">
          <h2>How Route Protection Works:</h2>
          <p>
            Route protection is implemented in <code>App.js</code> using the <code>RoleProtectedRoute</code> component.
            When you try to access a page you don't have permission for, you'll be redirected to an unauthorized page.
            The navigation menu also hides links to pages you can't access.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;

