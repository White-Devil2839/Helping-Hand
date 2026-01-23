const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { authenticate, requireAdmin, validateBody } = require('../middleware');
const { schemas } = require('../utils/validators');

/**
 * @route   GET /api/services
 * @desc    List active services
 * @access  Public
 */
router.get(
    '/',
    serviceController.listServices
);

/**
 * @route   GET /api/services/:id
 * @desc    Get service details
 * @access  Public
 */
router.get(
    '/:id',
    serviceController.getService
);

// Admin routes for service management are in admin.js

module.exports = router;
