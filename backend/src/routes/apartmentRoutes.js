const express = require('express');
const router = express.Router();
const ApartmentController = require('../controllers/apartmentController');
const { authenticate } = require('../middleware/auth');
const { apartmentRules, validate } = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

// Apartment routes
router.post('/', apartmentRules, validate, ApartmentController.create);
router.get('/', ApartmentController.getAll);
router.get('/:id', ApartmentController.getById);
router.put('/:id', ApartmentController.update);
router.delete('/:id', ApartmentController.delete);
router.get('/:id/stats', ApartmentController.getStats);

module.exports = router;