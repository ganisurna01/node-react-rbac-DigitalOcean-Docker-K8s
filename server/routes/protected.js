const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const router = express.Router();

// @route   GET /api/protected/user
// @desc    Protected route for all authenticated users
// @access  Private (user, manager, admin)
router.get('/user', protect, (req, res) => {
  res.json({
    message: 'User route - accessible to all authenticated users',
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    },
    data: {
      userProfile: 'User profile data',
      settings: 'User settings'
    }
  });
});

// @route   GET /api/protected/manager
// @desc    Protected route for managers and admins only
// @access  Private (manager, admin)
router.get('/manager', protect, authorize('manager', 'admin'), (req, res) => {
  res.json({
    message: 'Manager route - accessible to managers and admins',
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    },
    data: {
      reports: ['Sales Report', 'User Activity Report'],
      analytics: 'Manager-level analytics data',
      teamManagement: 'Team management features'
    }
  });
});

// @route   GET /api/protected/admin
// @desc    Protected route for admins only
// @access  Private (admin only)
router.get('/admin', protect, authorize('admin'), (req, res) => {
  res.json({
    message: 'Admin route - accessible only to admins',
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    },
    data: {
      systemSettings: 'Admin system settings',
      userManagement: 'User management data',
      allReports: ['All system reports'],
      sensitiveData: 'This is sensitive admin-only data'
    }
  });
});

module.exports = router;

