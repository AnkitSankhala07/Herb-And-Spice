const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const Table = require('../models/Table');
const os = require('os');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Get the machine's actual LAN IP address (not localhost)
// so QR codes are always scannable by phones on the same network
const getLocalNetworkIP = () => {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip loopback & IPv6, pick the first real IPv4 address
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost'; // absolute fallback
};

// Build QR-safe frontend URL — prioritizes configured FRONTEND_URL, fallback to local network IP
const getFrontendUrl = () => {
    if (process.env.FRONTEND_URL) {
        return process.env.FRONTEND_URL.replace(/\/+$/, '');
    }
    const ip = getLocalNetworkIP();
    return `http://${ip}:5173`;
};

// QR Code styling — dark green on parchment to match AKXTON brand
const QR_OPTIONS = {
    width: 400,
    margin: 2,
    color: {
        dark: '#1C2B1A',
        light: '#F0E8D5'
    }
};

// @desc    Generate QR code for a single table
// @route   GET /api/qr/:tableId
const generateSingleQR = async (req, res) => {
    try {
        const { tableId } = req.params;

        // Verify table exists
        const table = await Table.findOne({ tableId, isActive: true });
        if (!table) {
            return res.status(404).json({ message: 'Table not found' });
        }

        const frontendUrl = getFrontendUrl();
        const url = `${frontendUrl}/table/${tableId}/menu`;
        const qrImage = await QRCode.toDataURL(url, QR_OPTIONS);

        res.json({
            qrImage,
            tableId,
            url
        });
    } catch (error) {
        console.error('QR generation error:', error);
        res.status(500).json({ message: 'Failed to generate QR code' });
    }
};

// @desc    Generate QR codes for all active tables
// @route   GET /api/qr/all
const generateAllQRs = async (req, res) => {
    try {
        const tables = await Table.find({ isActive: true }).sort({ tableId: 1 });

        const qrCodes = await Promise.all(
            tables.map(async (table) => {
                const url = `${getFrontendUrl()}/table/${table.tableId}/menu`;
                const qrImage = await QRCode.toDataURL(url, QR_OPTIONS);
                return {
                    qrImage,
                    tableId: table.tableId,
                    url
                };
            })
        );

        res.json(qrCodes);
    } catch (error) {
        console.error('Bulk QR generation error:', error);
        res.status(500).json({ message: 'Failed to generate QR codes' });
    }
};

// @desc    Download PDF with all QR codes in a printable grid
// @route   GET /api/qr/download-pdf
const downloadQRPdf = async (req, res) => {
    try {
        const tables = await Table.find({ isActive: true }).sort({ tableId: 1 });

        if (tables.length === 0) {
            return res.status(404).json({ message: 'No active tables found' });
        }

        // Generate QR code buffers for all tables
        const qrData = await Promise.all(
            tables.map(async (table) => {
                const url = `${getFrontendUrl()}/table/${table.tableId}/menu`;
                const buffer = await QRCode.toBuffer(url, {
                    ...QR_OPTIONS,
                    type: 'png',
                    width: 300
                });
                return { tableId: table.tableId, buffer };
            })
        );

        // Create PDF
        const doc = new PDFDocument({
            size: 'A4',
            margin: 40,
            info: {
                Title: 'AKXTON POS — Table QR Codes',
                Author: 'AKXTON POS System'
            }
        });

        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=AKXTON_Table_QR_Codes.pdf');
        doc.pipe(res);

        // PDF Layout Constants
        const pageWidth = doc.page.width - 80; // margins
        const colCount = 3;
        const qrSize = 140;
        const cellWidth = pageWidth / colCount;
        const cellHeight = 200;
        const startX = 40;
        const startY = 120;

        // Title page header
        const addHeader = () => {
            doc.fontSize(28)
                .font('Helvetica-Bold')
                .fillColor('#1C2B1A')
                .text('AKXTON POS', 40, 40, { align: 'center' });
            doc.fontSize(12)
                .font('Helvetica')
                .fillColor('#666666')
                .text('Table QR Codes — Scan to Open Digital Menu', 40, 75, { align: 'center' });
            doc.moveTo(40, 105)
                .lineTo(doc.page.width - 40, 105)
                .strokeColor('#E0D5C0')
                .lineWidth(1)
                .stroke();
        };

        addHeader();

        let currentRow = 0;
        let currentCol = 0;

        for (let i = 0; i < qrData.length; i++) {
            const { tableId, buffer } = qrData[i];

            // Check if we need a new page
            if (currentRow > 0 && currentCol === 0) {
                const yPos = startY + currentRow * cellHeight;
                if (yPos + cellHeight > doc.page.height - 40) {
                    doc.addPage();
                    addHeader();
                    currentRow = 0;
                }
            }

            const x = startX + currentCol * cellWidth;
            const y = startY + currentRow * cellHeight;
            const qrX = x + (cellWidth - qrSize) / 2;

            // Draw card background
            doc.roundedRect(x + 8, y + 5, cellWidth - 16, cellHeight - 15, 8)
                .fillAndStroke('#FAFAF5', '#E0D5C0');

            // Draw QR code
            doc.image(buffer, qrX, y + 15, { width: qrSize, height: qrSize });

            // Table label
            doc.fontSize(14)
                .font('Helvetica-Bold')
                .fillColor('#1C2B1A')
                .text(`Table ${tableId}`, x + 8, y + qrSize + 22, {
                    width: cellWidth - 16,
                    align: 'center'
                });

            // "Scan for menu" subtitle
            doc.fontSize(7)
                .font('Helvetica')
                .fillColor('#999999')
                .text('Scan to open menu', x + 8, y + qrSize + 40, {
                    width: cellWidth - 16,
                    align: 'center'
                });

            // Move to next position
            currentCol++;
            if (currentCol >= colCount) {
                currentCol = 0;
                currentRow++;
            }
        }

        // Footer
        const footerY = doc.page.height - 30;
        doc.fontSize(8)
            .font('Helvetica')
            .fillColor('#AAAAAA')
            .text('Generated by AKXTON POS • Print and place on tables', 40, footerY, {
                align: 'center',
                width: pageWidth
            });

        doc.end();
    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ message: 'Failed to generate QR PDF' });
    }
};

module.exports = {
    generateSingleQR,
    generateAllQRs,
    downloadQRPdf
};
