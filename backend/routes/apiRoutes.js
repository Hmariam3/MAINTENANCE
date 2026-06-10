const express = require('express');
const router  = express.Router();

const dashboardController = require('../controllers/dashboardController');
const assetController     = require('../controllers/assetController');
const requestController   = require('../controllers/requestController');
const lookupController    = require('../controllers/lookupController');
const authController      = require('../controllers/authController');
const userController      = require('../controllers/userController');
const authMiddleware      = require('../middleware/authMiddleware');
const requireRole         = require('../middleware/roleMiddleware');
const { ROLES }           = require('../constants/roles');

// ─── Public ───────────────────────────────────────────────────────────────────
router.post('/login', authController.login);

// ─── All routes below require a valid JWT ─────────────────────────────────────
router.use(authMiddleware);

router.get('/lookups',   lookupController.getLookups);
router.get('/dashboard', dashboardController.getDashboardMetrics);

// Assets
router.get('/assets',  assetController.getAssets);
router.post('/assets', assetController.createAsset);

// ─── Maintenance Requests ─────────────────────────────────────────────────────
router.get('/requests',     requestController.getRequests);
router.post('/requests',    requestController.createRequest);
router.get('/requests/:id', requestController.getRequestById);

// Approval (Supervisor / Manager / Director)
router.patch(
  '/requests/:id/approve',
  requireRole(ROLES.SUPERVISOR, ROLES.MANAGER, ROLES.DIRECTOR),
  requestController.approveRequest
);

// Approve Closure (Supervisor / Manager / Director)
router.patch(
  '/requests/:id/close',
  requireRole(ROLES.SUPERVISOR, ROLES.MANAGER, ROLES.DIRECTOR),
  requestController.approveClosure
);

// Assign technician (Helpdesk / Manager / Director)
router.patch(
  '/requests/:id/assign',
  requireRole(ROLES.HELPDESK, ROLES.MANAGER, ROLES.DIRECTOR),
  requestController.assignRequest
);

// Status update — In Progress or Completed only (Technician / Helpdesk / Manager / Director)
router.patch(
  '/requests/:id/status',
  requireRole(ROLES.TECHNICIAN, ROLES.HELPDESK, ROLES.MANAGER, ROLES.DIRECTOR),
  requestController.updateRequestStatus
);

// On Hold sub-flow
router.post(
  '/requests/:id/hold',
  requireRole(ROLES.TECHNICIAN, ROLES.HELPDESK, ROLES.MANAGER, ROLES.DIRECTOR),
  requestController.holdRequest
);
router.patch(
  '/requests/:id/resume',
  requireRole(ROLES.TECHNICIAN, ROLES.HELPDESK, ROLES.MANAGER, ROLES.DIRECTOR),
  requestController.resumeRequest
);

// Disposal sub-flow
router.post(
  '/requests/:id/disposal',
  requireRole(ROLES.TECHNICIAN, ROLES.HELPDESK, ROLES.MANAGER, ROLES.DIRECTOR),
  requestController.disposalRequest
);
router.patch(
  '/requests/:id/disposal/approve',
  requireRole(ROLES.MANAGER, ROLES.DIRECTOR),
  requestController.approveDisposal
);

// ─── Users ────────────────────────────────────────────────────────────────────
router.get('/users/ad-search', userController.searchAdUser);
router.get('/users',  userController.getUsers);
router.post('/users', userController.createUser);

module.exports = router;
