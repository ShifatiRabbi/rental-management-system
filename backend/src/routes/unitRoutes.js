const express = require('express');
const router = express.Router();
const UnitController = require('../controllers/unitController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Unit routes
router.get('/:id', UnitController.getUnitDetails);
router.post('/:id/tenant', UnitController.assignTenant);
router.post('/:id/move-out', UnitController.moveOutTenant);
router.put('/:id/rent', UnitController.updateRent);
router.get('/:id/payments', UnitController.getPaymentHistory);

// Payment routes
router.post('/rent-logs/:rentLogId/pay', UnitController.makePayment);

module.exports = router;