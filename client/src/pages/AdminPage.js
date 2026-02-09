import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config/api';
import './Page.css';

const AdminPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/protected/admin`); // OR --> /api/protected/admin
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
        <h1>Admin Page</h1>
        <p className="page-description">
          This page is accessible only to <strong>admins</strong>.
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
            {loading ? 'Loading...' : 'Fetch Admin Data from API'}
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
            <code>allowedRoles={['admin']}</code>.
          </p>
          <p>
            Only users with the 'admin' role can access this page. Managers and regular users will be 
            redirected if they try to access it.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;

