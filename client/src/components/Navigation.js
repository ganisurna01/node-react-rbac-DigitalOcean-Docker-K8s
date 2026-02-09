import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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

  // Determine which links to show based on user role
  const canAccess = (requiredRole) => {
    if (!user) return false;
    if (requiredRole === 'user') return true; // All authenticated users
    if (requiredRole === 'manager') return user.role === 'manager' || user.role === 'admin';
    if (requiredRole === 'admin') return user.role === 'admin';
    return false;
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <h2>RBAC App</h2>
        </div>
        
        <div className="nav-links">
          <Link 
            to="/home" 
            className={location.pathname === '/home' ? 'active' : ''}
          >
            Home
          </Link>
          
          <Link 
            to="/user" 
            className={location.pathname === '/user' ? 'active' : ''}
          >
            User Page
          </Link>
          
          {canAccess('manager') && (
            <Link 
              to="/manager" 
              className={location.pathname === '/manager' ? 'active' : ''}
            >
              Manager Page
            </Link>
          )}
          
          {canAccess('admin') && (
            <Link 
              to="/admin" 
              className={location.pathname === '/admin' ? 'active' : ''}
            >
              Admin Page
            </Link>
          )}
        </div>

        <div className="nav-user">
          <span 
            className="role-badge" 
            style={{ backgroundColor: getRoleColor(user.role) }}
          >
            {user.role?.toUpperCase()}
          </span>
          <span className="user-name">{user.name}</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

