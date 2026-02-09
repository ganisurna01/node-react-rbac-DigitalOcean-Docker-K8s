import React, { useState } from 'react';
import axios from 'axios';
import API_URL from '../config/api';
import './Page.css';

const UserPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/protected/user`); // OR --> /api/protected/user
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
        <h1>User Page</h1>
        <p className="page-description">
          This page is accessible to all authenticated users (user, manager, admin).
        </p>

        <div className="action-card">
          <button 
            onClick={fetchData} 
            disabled={loading}
            className="btn-fetch"
          >
            {loading ? 'Loading...' : 'Fetch User Data from API'}
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
            This route is protected in <code>App.js</code> using <code>ProtectedRoute</code>.
            It only checks if the user is authenticated, not their role.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserPage;

