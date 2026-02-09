import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config/api';
import './Page.css';

const ManagerPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/protected/manager`); // OR --> /api/protected/manager
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-content">
        <h1>Manager Page</h1>
        <p className="page-description">
          This page is accessible only to <strong>managers</strong> and <strong>admins</strong>.
        </p>
        <p className="current-role">
          Your current role: <strong>{user?.role?.toUpperCase()}</strong>
        </p>

        <div className="action-card">
          <button 
            onClick={fetchData} 
            disabled={loading}
            className="btn-fetch"
          >
            {loading ? 'Loading...' : 'Fetch Manager Data from API'}
          </button>

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          {data && (
            <div className="response-box">
              <h3>API Response:</h3>
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="info-section">
          <h3>Route Protection:</h3>
          <p>
            This route is protected in <code>App.js</code> using <code>RoleProtectedRoute</code> with 
            <code>allowedRoles={['manager', 'admin']}</code>.
          </p>
          <p>
            If a regular user tries to access this page (by typing the URL), they will be redirected 
            to the unauthorized page.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ManagerPage;

