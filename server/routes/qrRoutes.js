const express = require('express');
const router = express.Router();
const {
    generateSingleQR,
    generateAllQRs,
    downloadQRPdf
} = require('../controllers/qrController');

// @route   GET /api/qr/all
// @desc    Generate QR codes for all active tables
// NOTE: This must come BEFORE /:tableId to avoid "all" being treated as a tableId
router.get('/all', generateAllQRs);

// @route   GET /api/qr/download-pdf
// @desc    Download printable PDF with all QR codes
router.get('/download-pdf', downloadQRPdf);

// @route   GET /api/qr/:tableId
// @desc    Generate QR code for a single table
router.get('/:tableId', generateSingleQR);

module.exports = router;
