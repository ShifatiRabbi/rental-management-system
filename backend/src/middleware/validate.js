const { check, validationResult } = require('express-validator');

/**
 * Middleware to validate request data
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

/**
 * Validation rules for user registration
 */
const registerRules = [
  check('name').notEmpty().withMessage('Name is required'),
  check('username').notEmpty().withMessage('Username is required'),
  check('email').isEmail().withMessage('Valid email is required'),
  check('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  check('phone').notEmpty().withMessage('Phone number is required')
];

/**
 * Validation rules for apartment creation
 */
const apartmentRules = [
  check('name').notEmpty().withMessage('Apartment name is required'),
  check('address').notEmpty().withMessage('Address is required'),
  check('floors_count').isInt({ min: 1 }).withMessage('At least 1 floor is required'),
  check('units_per_floor').isInt({ min: 1 }).withMessage('At least 1 unit per floor is required')
];

module.exports = {
  validate,
  registerRules,
  apartmentRules
};