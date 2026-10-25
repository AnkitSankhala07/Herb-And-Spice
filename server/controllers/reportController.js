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
        doc.fontSize(24).font('Helvetica-Bold').text('Herb and Spice', { align: 'center' });
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

// Helper for neat receipt table rows
const drawReceiptRow = (doc, label, value, isBold = false, fontSize = 9) => {
    const y = doc.y;
    doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(fontSize);
    doc.text(label, 25, y, { width: 145, align: 'left' });
    doc.text(value, 170, y, { width: 105, align: 'right' });
    doc.y = y + fontSize + 4;
};

const drawDivider = (doc) => {
    const y = doc.y + 2;
    doc.moveTo(25, y).lineTo(275, y).strokeColor('#D1D5DB').lineWidth(0.5).stroke();
    doc.y = y + 6;
};

// @desc    Generate Single Order Customer Bill (PDF)
// @route   GET /api/reports/bill/:id
const generateCustomerBill = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const doc = new PDFDocument({ margin: 25, size: [300, 600] });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=bill-table-${order.tableNumber}-${order._id.toString().slice(-6)}.pdf`);
        doc.pipe(res);

        // Header
        doc.fontSize(18).font('Helvetica-Bold').text('Herb & Spice', { align: 'center' });
        doc.fontSize(9).font('Helvetica').text('Artisan Dining Experience', { align: 'center' });
        doc.moveDown(0.3);
        drawDivider(doc);

        // Metadata
        drawReceiptRow(doc, `Table: ${order.tableNumber}`, `Order: #${order._id.toString().slice(-6).toUpperCase()}`);
        drawReceiptRow(doc, 'Date:', order.createdAt ? order.createdAt.toLocaleString() : new Date().toLocaleString());
        drawDivider(doc);

        // Items Header
        drawReceiptRow(doc, 'ITEM', 'AMOUNT', true, 9);
        doc.y += 2;

        let subtotal = 0;
        order.items.forEach(item => {
            const qty = Number(item.quantity) || 1;
            const price = Number(item.price) || 0;
            const itemTotal = price * qty;
            subtotal += itemTotal;
            drawReceiptRow(doc, `${item.name.substring(0, 18)} x ${qty}`, `INR ${itemTotal.toFixed(2)}`, false, 9);
        });

        drawDivider(doc);

        const tax = subtotal * 0.05;
        const tip = Number(order.tip) || 0;
        const grandTotal = Number(order.totalAmount) || (subtotal + tax + tip);

        drawReceiptRow(doc, 'Subtotal:', `INR ${subtotal.toFixed(2)}`);
        drawReceiptRow(doc, 'GST (5%):', `INR ${tax.toFixed(2)}`);
        if (tip > 0) {
            drawReceiptRow(doc, 'Tip:', `INR ${tip.toFixed(2)}`);
        }
        doc.y += 3;
        drawReceiptRow(doc, 'TOTAL AMOUNT:', `INR ${grandTotal.toFixed(2)}`, true, 12);
        drawDivider(doc);

        doc.moveDown(0.5);
        doc.fontSize(8.5).font('Helvetica').text('Thank you for dining with us!', { align: 'center' });
        doc.fontSize(8).font('Helvetica').text('Herb & Spice Operating System', { align: 'center' });

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
        const tableId = parseInt(req.params.tableId, 10);
        const orders = await Order.find({
            tableNumber: tableId,
            status: { $nin: ['Paid', 'Cancelled'] }
        });

        if (!orders || orders.length === 0) {
            return res.status(404).json({ message: 'No active orders found for this table' });
        }

        const doc = new PDFDocument({ margin: 25, size: [300, 600] });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=table-${tableId}-bill.pdf`);
        doc.pipe(res);

        // Header
        doc.fontSize(18).font('Helvetica-Bold').text('Herb & Spice', { align: 'center' });
        doc.fontSize(9).font('Helvetica').text('Artisan Dining Experience', { align: 'center' });
        doc.moveDown(0.3);
        drawDivider(doc);

        // Metadata
        drawReceiptRow(doc, `Table: ${tableId}`, `Orders: ${orders.length}`);
        drawReceiptRow(doc, 'Generated:', new Date().toLocaleString());
        drawDivider(doc);

        // Items Header
        drawReceiptRow(doc, 'ITEM', 'AMOUNT', true, 9);
        doc.y += 2;

        let rawTotal = 0;
        let totalTips = 0;
        let totalAmountRecorded = 0;

        orders.forEach(o => {
            totalTips += Number(o.tip) || 0;
            totalAmountRecorded += Number(o.totalAmount) || 0;
            o.items.forEach(item => {
                const qty = Number(item.quantity) || 1;
                const price = Number(item.price) || 0;
                const itemTotal = price * qty;
                rawTotal += itemTotal;
                drawReceiptRow(doc, `${item.name.substring(0, 18)} x ${qty}`, `INR ${itemTotal.toFixed(2)}`, false, 9);
            });
        });

        drawDivider(doc);

        const tax = rawTotal * 0.05;
        const grandTotal = totalAmountRecorded > 0 ? totalAmountRecorded : (rawTotal + tax + totalTips);

        drawReceiptRow(doc, 'Subtotal:', `INR ${rawTotal.toFixed(2)}`);
        drawReceiptRow(doc, 'GST (5%):', `INR ${tax.toFixed(2)}`);
        if (totalTips > 0) {
            drawReceiptRow(doc, 'Tips:', `INR ${totalTips.toFixed(2)}`);
        }
        doc.y += 3;
        drawReceiptRow(doc, 'TOTAL AMOUNT:', `INR ${grandTotal.toFixed(2)}`, true, 12);
        drawDivider(doc);

        doc.moveDown(0.5);
        doc.fontSize(8.5).font('Helvetica').text('Thank you for dining with us!', { align: 'center' });
        doc.fontSize(8).font('Helvetica').text('Herb & Spice Operating System', { align: 'center' });

        doc.end();

    } catch (error) {
        console.error('Table bill error:', error);
        res.status(500).json({ message: 'Failed to generate table bill' });
    }
};

module.exports = { generateDailyReport, generateMonthlyReport, exportOrders, generateCustomerBill, generateTableBill };
