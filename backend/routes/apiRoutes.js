const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');
const assetController = require('../controllers/assetController');
const requestController = require('../controllers/requestController');
const lookupController = require('../controllers/lookupController');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Auth
router.post('/login', authController.login);

// Apply auth middleware to all routes below
router.use(authMiddleware);

// Lookups (for dropdowns)
router.get('/lookups', lookupController.getLookups);

// Dashboard
router.get('/dashboard', dashboardController.getDashboardMetrics);

// Assets
router.get('/assets', assetController.getAssets);
router.post('/assets', assetController.createAsset);

// Requests
router.get('/requests', requestController.getRequests);
router.post('/requests', requestController.createRequest);

// Users
const userController = require('../controllers/userController');
router.get('/users/ad-search', userController.searchAdUser);
router.get('/users', userController.getUsers);
router.post('/users', userController.createUser);

module.exports = router;
