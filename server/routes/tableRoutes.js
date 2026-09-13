const express = require('express');
const router = express.Router();
const Table = require('../models/Table');

// @desc    Get all tables
// @route   GET /api/tables
router.get('/', async (req, res) => {
    try {
        const tables = await Table.find({ isActive: true });
        res.json(tables);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get table status by tableId number
// @route   GET /api/tables/status/:tableId
router.get('/status/:tableId', async (req, res) => {
    try {
        const table = await Table.findOne({ tableId: req.params.tableId, isActive: true });
        if (!table) {
            return res.status(404).json({ message: 'Table not found', exists: false });
        }
        res.json({ exists: true, status: table.status, tableId: table.tableId, currentBill: table.currentBill });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Add a new table
// @route   POST /api/tables
router.post('/', async (req, res) => {
    try {
        const { tableId, capacity } = req.body;
        const table = new Table({ tableId, capacity });
        const savedTable = await table.save();
        res.status(201).json(savedTable);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update table status/capacity
// @route   PATCH /api/tables/:id
router.patch('/:id', async (req, res) => {
    try {
        const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(table);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Soft delete table
// @route   DELETE /api/tables/:id
router.delete('/:id', async (req, res) => {
    try {
        await Table.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ message: 'Table removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
