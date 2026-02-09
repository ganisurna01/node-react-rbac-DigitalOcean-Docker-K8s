import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Page.css';

const Unauthorized = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="unauthorized-card">
          <h1>🚫 Access Denied</h1>
          <p className="error-message-large">
            You don't have permission to access this page.
          </p>
          <p className="role-info-text">
            Your current role: <strong>{user?.role?.toUpperCase()}</strong>
          </p>
          <p className="info-text">
            This page requires a different role level. Please contact an administrator 
            if you believe you should have access.
          </p>
          <button 
            onClick={() => navigate('/home')} 
            className="btn-primary"
          >
            Go to Home
          </button>
        </div>

        <div className="info-section">
          <h3>How This Works:</h3>
          <p>
            When you try to access a route you don't have permission for (either by clicking 
            a link or typing the URL directly), the <code>RoleProtectedRoute</code> component 
            in <code>App.js</code> detects that your role doesn't match the required roles 
            and redirects you here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;

