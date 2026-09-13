const Order = require('../models/Order');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');

// @desc    Generate Daily Report (PDF)
// @route   GET /api/reports/daily?date=YYYY-MM-DD
const generateDailyReport = async (req, res) => {
    try {
        const targetDate = req.query.date ? new Date(req.query.date) : new Date();
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        const orders = await Order.find({
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            status: { $ne: 'Cancelled' }
        }).sort({ createdAt: 1 });

        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalItems = orders.reduce((sum, order) => sum + order.items.reduce((iSum, i) => iSum + i.quantity, 0), 0);

        // Generate PDF
        const doc = new PDFDocument({ margin: 50 });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=daily-report-${startOfDay.toISOString().split('T')[0]}.pdf`);
        
        doc.pipe(res);

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('AKXTON Daily Report', { align: 'center' });
        doc.fontSize(12).font('Helvetica').text(`Date: ${startOfDay.toISOString().split('T')[0]}`, { align: 'center' });
        doc.moveDown(2);

        // Summary Statistics
        doc.fontSize(14).font('Helvetica-Bold').text('Executive Summary');
        doc.fontSize(12).font('Helvetica');
        doc.text(`Total Orders: ${orders.length}`);
        doc.text(`Total Items Sold: ${totalItems}`);
        doc.text(`Total Revenue: INR ${totalRevenue.toFixed(2)}`);
        doc.moveDown(2);

        // Orders Table Header
        doc.fontSize(14).font('Helvetica-Bold').text('Order Details');
        doc.moveDown(0.5);
        
        const tableTop = doc.y;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Time', 50, tableTop);
        doc.text('Table', 150, tableTop);
        doc.text('Items', 250, tableTop);
        doc.text('Total', 450, tableTop, { width: 90, align: 'right' });
        
        // Draw line
        doc.moveTo(50, doc.y + 5).lineTo(540, doc.y + 5).stroke();
        doc.moveDown(1);

        doc.font('Helvetica');
        let currentY = doc.y;

        orders.forEach(order => {
            const time = `${order.createdAt.getHours()}:${order.createdAt.getMinutes() < 10 ? '0' : ''}${order.createdAt.getMinutes()}`;
            const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);

            // Add page if near bottom
            if (currentY > 700) {
                doc.addPage();
                currentY = 50;
            }

            doc.text(time, 50, currentY);
            doc.text(order.tableNumber, 150, currentY);
            doc.text(`${itemCount} items`, 250, currentY);
            doc.text(`INR ${order.totalAmount.toFixed(2)}`, 450, currentY, { width: 90, align: 'right' });
            
            currentY += 20;
        });

        doc.end();

    } catch (error) {
        console.error('Daily Report Error:', error);
        res.status(500).json({ message: 'Failed to generate report' });
    }
};

// @desc    Generate Monthly Report (PDF)
// @route   GET /api/reports/monthly?month=M&year=YYYY
const generateMonthlyReport = async (req, res) => {
    try {
        const now = new Date();
        const month = req.query.month ? parseInt(req.query.month) - 1 : now.getMonth();
        const year = req.query.year ? parseInt(req.query.year) : now.getFullYear();

        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

        const orders = await Order.find({
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            status: { $ne: 'Cancelled' }
        });

        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        
        // Extract top items
        const itemMap = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                if (!itemMap[item.name]) itemMap[item.name] = { quantity: 0, revenue: 0 };
                itemMap[item.name].quantity += item.quantity;
                itemMap[item.name].revenue += (item.quantity * item.price);
            });
        });

        const topItems = Object.entries(itemMap)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        // Output PDF
        const doc = new PDFDocument({ margin: 50 });
        
        const monthName = startOfMonth.toLocaleString('default', { month: 'long' });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=monthly-report-${monthName}-${year}.pdf`);
        
        doc.pipe(res);

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('AKXTON Monthly Report', { align: 'center' });
        doc.fontSize(12).font('Helvetica').text(`Period: ${monthName} ${year}`, { align: 'center' });
        doc.moveDown(2);

        // Summary Statistics
        doc.fontSize(14).font('Helvetica-Bold').text('Executive Summary');
        doc.fontSize(12).font('Helvetica');
        doc.text(`Total Orders: ${orders.length}`);
        doc.text(`Total Revenue: INR ${totalRevenue.toFixed(2)}`);
        doc.text(`Average Order Value: INR ${(orders.length > 0 ? totalRevenue / orders.length : 0).toFixed(2)}`);
        doc.moveDown(2);

        // Top Items Section
        doc.fontSize(14).font('Helvetica-Bold').text('Top Selling Items');
        doc.moveDown(0.5);
        
        const tableTop = doc.y;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Item Name', 50, tableTop);
        doc.text('Qty Sold', 300, tableTop);
        doc.text('Revenue', 400, tableTop, { width: 140, align: 'right' });
        
        doc.moveTo(50, doc.y + 5).lineTo(540, doc.y + 5).stroke();
        doc.moveDown(1);

        doc.font('Helvetica');
        let currentY = doc.y;

        topItems.forEach(item => {
            doc.text(item.name, 50, currentY);
            doc.text(item.quantity.toString(), 300, currentY);
            doc.text(`INR ${item.revenue.toFixed(2)}`, 400, currentY, { width: 140, align: 'right' });
            currentY += 20;
        });

        doc.end();

    } catch (error) {
        console.error('Monthly Report Error:', error);
        res.status(500).json({ message: 'Failed to generate report' });
    }
};

// @desc    Export Orders
// @route   GET /api/reports/export?start=YYYY-MM-DD&end=YYYY-MM-DD&format=csv|excel
const exportOrders = async (req, res) => {
    try {
        const format = req.query.format || 'csv';
        const start = req.query.start ? new Date(req.query.start) : new Date(new Date().setHours(0,0,0,0));
        const end = req.query.end ? new Date(new Date(req.query.end).setHours(23,59,59,999)) : new Date(new Date().setHours(23,59,59,999));

        const orders = await Order.find({
            createdAt: { $gte: start, $lte: end }
        }).sort({ createdAt: -1 });

        // Flatten data for tabular formats
        const exportData = orders.map(order => ({
            OrderID: order._id.toString(),
            Date: order.createdAt.toISOString().split('T')[0],
            Time: `${order.createdAt.getHours()}:${order.createdAt.getMinutes() < 10 ? '0' : ''}${order.createdAt.getMinutes()}`,
            Table: order.tableNumber,
            Status: order.status,
            PaymentMode: order.paymentMode,
            ItemsCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
            TotalAmount: order.totalAmount
        }));

        const dateStr = start.toISOString().split('T')[0];

        if (format === 'csv') {
            const fields = ['OrderID', 'Date', 'Time', 'Table', 'Status', 'PaymentMode', 'ItemsCount', 'TotalAmount'];
            const json2csvParser = new Parser({ fields });
            const csv = json2csvParser.parse(exportData);
            
            res.header('Content-Type', 'text/csv');
            res.attachment(`orders-export-${dateStr}.csv`);
            return res.send(csv);
        } 
        
        if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Orders');
            
            worksheet.columns = [
                { header: 'Order ID', key: 'OrderID', width: 25 },
                { header: 'Date', key: 'Date', width: 15 },
                { header: 'Time', key: 'Time', width: 10 },
                { header: 'Table', key: 'Table', width: 10 },
                { header: 'Status', key: 'Status', width: 15 },
                { header: 'Payment Mode', key: 'PaymentMode', width: 15 },
                { header: 'Items Count', key: 'ItemsCount', width: 12 },
                { header: 'Total Amount (INR)', key: 'TotalAmount', width: 18 }
            ];

            // Make headers bold
            worksheet.getRow(1).font = { bold: true };
            
            worksheet.addRows(exportData);
            
            res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.attachment(`orders-export-${dateStr}.xlsx`);
            
            await workbook.xlsx.write(res);
            res.end();
            return;
        }

        res.status(400).json({ message: 'Invalid format requested. use csv or excel.' });

    } catch (error) {
        console.error('Export Error:', error);
        res.status(500).json({ message: 'Failed to export data' });
    }
};

// @desc    Generate Single Order Customer Bill (PDF)
// @route   GET /api/reports/bill/:id
const generateCustomerBill = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const doc = new PDFDocument({ margin: 40, size: [300, 600] }); // Receipt size format
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=bill-${order.tableNumber}-${order._id.toString().slice(-6)}.pdf`);
        
        doc.pipe(res);

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('AKXTON', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text('Smart Restaurant POS', { align: 'center' });
        doc.moveDown(0.5);
        doc.text('----------------------------------------------------', { align: 'center' });
        
        // Meta data
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text(`Table: ${order.tableNumber}`);
        doc.font('Helvetica').text(`Order ID: #${order._id.toString().slice(-6).toUpperCase()}`);
        doc.text(`Date: ${order.createdAt.toLocaleString()}`);
        doc.moveDown(0.5);
        doc.text('----------------------------------------------------', { align: 'center' });
        doc.moveDown(0.5);

        // Items logic
        doc.font('Helvetica-Bold');
        doc.text('Item', 40, doc.y, { continued: true });
        doc.text('Qty', 160, doc.y, { continued: true });
        doc.text('Amount', 220, doc.y);
        doc.moveDown(0.5);
        
        doc.font('Helvetica');
        order.items.forEach(item => {
            const currentY = doc.y;
            // truncate item name to fit receipt
            doc.text(item.name.substring(0, 15), 40, currentY, { width: 110 });
            doc.text(item.quantity.toString(), 160, currentY);
            doc.text(`INR ${item.price * item.quantity}`, 220, currentY, { align: 'right', width: 40 });
            doc.moveDown(0.5);
        });

        doc.moveDown(0.5);
        doc.text('----------------------------------------------------', { align: 'center' });
        doc.moveDown(0.5);

        // Totals
        const taxRate = 0.05; // 5% example
        const subtotal = order.totalAmount / (1 + taxRate);
        const tax = order.totalAmount - subtotal;
        
        doc.font('Helvetica');
        doc.text(`Subtotal:`, 40, doc.y, { continued: true });
        doc.text(`INR ${subtotal.toFixed(2)}`, 200, doc.y, { align: 'right', width: 60 });
        doc.moveDown(0.2);
        
        doc.text(`Tax (5%):`, 40, doc.y, { continued: true });
        doc.text(`INR ${tax.toFixed(2)}`, 200, doc.y, { align: 'right', width: 60 });
        doc.moveDown(0.2);

        doc.font('Helvetica-Bold');
        doc.fontSize(14);
        doc.text(`TOTAL:`, 40, doc.y, { continued: true });
        doc.text(`INR ${order.totalAmount.toFixed(2)}`, 160, doc.y, { align: 'right', width: 100 });
        
        doc.moveDown(1);
        doc.fontSize(10).font('Helvetica').text('Thank you for dining with us!', { align: 'center' });
        doc.text('Powered by AKXTON', { align: 'center' });
        
        doc.end();

    } catch (error) {
        console.error('Bill generation error:', error);
        res.status(500).json({ message: 'Failed to generate bill' });
    }
};

// @desc    Generate Aggregated Table Customer Bill (PDF)
// @route   GET /api/reports/bill/table/:tableId
const generateTableBill = async (req, res) => {
    try {
        const tableId = req.params.tableId;
        const orders = await Order.find({
            tableNumber: tableId,
            status: { $nin: ['Paid', 'Cancelled'] }
        });

        if (orders.length === 0) {
            return res.status(404).json({ message: 'No active orders found for this table' });
        }

        const doc = new PDFDocument({ margin: 40, size: [300, 600] });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=table-${tableId}-bill.pdf`);
        doc.pipe(res);

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('AKXTON', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text('Smart Restaurant POS', { align: 'center' });
        doc.moveDown(0.5);
        doc.text('----------------------------------------------------', { align: 'center' });
        
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text(`Table: ${tableId}`);
        doc.font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`);
        doc.moveDown(0.5);
        doc.text('----------------------------------------------------', { align: 'center' });
        doc.moveDown(0.5);

        // Map all items from all orders into an aggregated list
        const allItems = [];
        orders.forEach(o => {
            o.items.forEach(i => allItems.push(i));
        });

        doc.font('Helvetica-Bold');
        doc.text('Item', 40, doc.y, { continued: true });
        doc.text('Qty', 160, doc.y, { continued: true });
        doc.text('Amount', 220, doc.y);
        doc.moveDown(0.5);
        
        doc.font('Helvetica');
        let rawTotal = 0;
        allItems.forEach(item => {
            const currentY = doc.y;
            const itemTotal = item.price * item.quantity;
            rawTotal += itemTotal;
            doc.text(item.name.substring(0, 15), 40, currentY, { width: 110 });
            doc.text(item.quantity.toString(), 160, currentY);
            doc.text(`INR ${itemTotal}`, 220, currentY, { align: 'right', width: 40 });
            doc.moveDown(0.5);
        });

        doc.moveDown(0.5);
        doc.text('----------------------------------------------------', { align: 'center' });
        doc.moveDown(0.5);

        // Totals
        const taxRate = 0.05; // 5%
        const tax = rawTotal * taxRate;
        const grandTotal = rawTotal + tax; // Just standardizing
        
        doc.font('Helvetica');
        doc.text(`Subtotal:`, 40, doc.y, { continued: true });
        doc.text(`INR ${rawTotal.toFixed(2)}`, 200, doc.y, { align: 'right', width: 60 });
        doc.moveDown(0.2);
        
        doc.text(`GST (5%):`, 40, doc.y, { continued: true });
        doc.text(`INR ${tax.toFixed(2)}`, 200, doc.y, { align: 'right', width: 60 });
        doc.moveDown(0.2);

        doc.font('Helvetica-Bold');
        doc.fontSize(14);
        doc.text(`TOTAL:`, 40, doc.y, { continued: true });
        doc.text(`INR ${grandTotal.toFixed(2)}`, 160, doc.y, { align: 'right', width: 100 });
        
        doc.moveDown(1);
        doc.fontSize(10).font('Helvetica').text('Thank you for dining with us!', { align: 'center' });
        doc.text('Powered by AKXTON', { align: 'center' });
        
        doc.end();

    } catch (error) {
        console.error('Table bill error:', error);
        res.status(500).json({ message: 'Failed to generate table bill' });
    }
};

module.exports = { generateDailyReport, generateMonthlyReport, exportOrders, generateCustomerBill, generateTableBill };
