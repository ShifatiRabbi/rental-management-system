const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Report routes
router.get('/monthly', ReportController.getMonthlyReport);
router.get('/occupancy', ReportController.getOccupancyReport);
router.get('/overdue', ReportController.getOverdueReport);
router.get('/export', ReportController.exportData);

module.exports = router;