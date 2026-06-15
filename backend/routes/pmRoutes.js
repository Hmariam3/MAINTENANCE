const express = require('express');
const router = express.Router();
const pmController = require('../controllers/pmController');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { ROLES } = require('../constants/roles');

router.use(authMiddleware);

// Technician routes
router.get('/schedules', requireRole(ROLES.TECHNICIAN), pmController.getSchedules);
router.post('/schedules', requireRole(ROLES.TECHNICIAN), pmController.createSchedule);
router.post('/logs', requireRole(ROLES.TECHNICIAN), pmController.createLog);

// Shared / Supervisor routes
// Both can see logs (controller filters based on role)
router.get('/logs', requireRole(ROLES.TECHNICIAN, ROLES.SUPERVISOR, ROLES.MANAGER, ROLES.DIRECTOR), pmController.getLogs);

// Supervisor approves/rejects logs
router.put('/logs/:id/approve', requireRole(ROLES.SUPERVISOR, ROLES.MANAGER, ROLES.DIRECTOR), pmController.approveLog);

module.exports = router;
