const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, validateBody } = require('../middleware');
const { schemas } = require('../utils/validators');

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
    '/me',
    authenticate,
    userController.getMe
);

/**
 * @route   PATCH /api/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.patch(
    '/me',
    authenticate,
    validateBody(schemas.updateProfile),
    userController.updateMe
);

module.exports = router;

