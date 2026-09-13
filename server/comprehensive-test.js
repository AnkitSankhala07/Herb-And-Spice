const axios = require('axios');
const mongoose = require('mongoose');

const API_URL = 'http://localhost:5000/api';

// Color codes for output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    blue: '\x1b[34m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    section: (msg) => console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n${colors.cyan}${msg}${colors.reset}\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`)
};

let testResults = {
    passed: 0,
    failed: 0,
    warnings: 0
};

const test = async (name, fn) => {
    try {
        await fn();
        log.success(name);
        testResults.passed++;
    } catch (err) {
        log.error(`${name} - ${err.message}`);
        testResults.failed++;
    }
};

const testWarn = (name, fn) => {
    try {
        fn();
        log.warn(name);
        testResults.warnings++;
    } catch (err) {
        log.error(`${name} - ${err.message}`);
        testResults.failed++;
    }
};

(async () => {
    log.section('🧪 COMPREHENSIVE PROJECT TEST SUITE');

    // TEST 1: Database Connection
    log.section('1️⃣  DATABASE CONNECTIVITY');
    await test('MongoDB connection', async () => {
        const conn = await mongoose.connect('mongodb://localhost:27017/smartresto');
        if (!conn) throw new Error('Failed to connect');
    });

    // TEST 2: Check Models
    log.section('2️⃣  DATABASE MODELS');
    const User = require('./models/User');
    const MenuItem = require('./models/MenuItem');
    const Order = require('./models/Order');
    const Table = require('./models/Table');
    const Inventory = require('./models/Inventory');

    await test('User model schema validation', async () => {
        const count = await User.countDocuments();
        if (count < 4) throw new Error(`Expected at least 4 demo users, found ${count}`);
    });

    await test('Table model exists with correct structure', async () => {
        const table = await Table.findOne({});
        if (!table) throw new Error('No tables found');
        if (!table.tableId || !table.capacity) throw new Error('Table missing required fields');
    });

    await test('MenuItem model has description field', async () => {
        const item = await MenuItem.findOne({});
        if (item && !item.description) throw new Error('MenuItem missing description field');
    });

    await test('Order model has tip field', async () => {
        const order = await Order.findOne({});
        if (order && typeof order.tip === 'undefined') throw new Error('Order missing tip field');
    });

    await test('Inventory model uses name field (not ingredientName)', async () => {
        const inv = await Inventory.findOne({});
        if (inv && inv.ingredientName) throw new Error('Inventory still using old ingredientName field');
    });

    // TEST 3: Authentication
    log.section('3️⃣  AUTHENTICATION SYSTEM');

    let authToken = null;
    let waiterToken = null;
    let chefToken = null;

    await test('Admin login: admin@akxton.com / admin123', async () => {
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@akxton.com',
            password: 'admin123'
        });
        if (!res.data.token) throw new Error('No token returned');
        if (res.data.role !== 'admin') throw new Error(`Expected role 'admin', got '${res.data.role}'`);
        authToken = res.data.token;
    });

    await test('Waiter login: waiter@akxton.com / waiter123', async () => {
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: 'waiter@akxton.com',
            password: 'waiter123'
        });
        if (!res.data.token) throw new Error('No token returned');
        if (res.data.role !== 'waiter') throw new Error(`Expected role 'waiter', got '${res.data.role}'`);
        waiterToken = res.data.token;
    });

    await test('Chef/Kitchen login: chef@akxton.com / chef123', async () => {
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: 'chef@akxton.com',
            password: 'chef123'
        });
        if (!res.data.token) throw new Error('No token returned');
        if (res.data.role !== 'kitchen') throw new Error(`Expected role 'kitchen', got '${res.data.role}'`);
        chefToken = res.data.token;
    });

    await test('Failed login with wrong password returns 401', async () => {
        try {
            await axios.post(`${API_URL}/auth/login`, {
                email: 'admin@akxton.com',
                password: 'wrongpassword'
            });
            throw new Error('Should have failed');
        } catch (err) {
            if (err.response?.status !== 401) throw new Error(`Expected 401, got ${err.response?.status}`);
        }
    });

    // TEST 4: API Endpoints
    log.section('4️⃣  API ENDPOINTS');

    await test('GET /api/menu - Fetch menu', async () => {
        const res = await axios.get(`${API_URL}/menu`);
        if (!Array.isArray(res.data)) throw new Error('Menu should be an array');
        if (res.data.length === 0) throw new Error('Menu is empty');
    });

    await test('GET /api/tables - Fetch all tables', async () => {
        const res = await axios.get(`${API_URL}/tables`, {
            headers: { Authorization: `Bearer ${waiterToken}` }
        });
        if (!Array.isArray(res.data)) throw new Error('Tables should be an array');
        if (res.data.length === 0) throw new Error('No tables found');
    });

    await test('GET /api/orders - Fetch orders', async () => {
        const res = await axios.get(`${API_URL}/orders`, {
            headers: { Authorization: `Bearer ${chefToken}` }
        });
        if (!Array.isArray(res.data)) throw new Error('Orders should be an array');
    });

    // TEST 5: Order Management
    log.section('5️⃣  ORDER MANAGEMENT');

    let orderId = null;

    await test('POST /api/orders - Create order', async () => {
        const res = await axios.post(`${API_URL}/orders`, {
            tableNumber: 1,
            items: [{
                menuItem: 'test-item',
                name: 'Test Pizza',
                quantity: 1,
                price: 299
            }],
            totalAmount: 299
        }, {
            headers: { Authorization: `Bearer ${waiterToken}` }
        });
        if (!res.data._id) throw new Error('Order not created');
        orderId = res.data._id;
        if (res.data.status !== 'Pending') throw new Error(`Expected Pending, got ${res.data.status}`);
    });

    await test('PUT /api/orders/:id/status - Update to Preparing', async () => {
        const res = await axios.put(`${API_URL}/orders/${orderId}/status`, 
            { status: 'Preparing' },
            { headers: { Authorization: `Bearer ${chefToken}` } }
        );
        if (res.data.status !== 'Preparing') throw new Error(`Expected Preparing, got ${res.data.status}`);
    });

    await test('PUT /api/orders/:id/status - Update to Ready', async () => {
        const res = await axios.put(`${API_URL}/orders/${orderId}/status`, 
            { status: 'Ready' },
            { headers: { Authorization: `Bearer ${chefToken}` } }
        );
        if (res.data.status !== 'Ready') throw new Error(`Expected Ready, got ${res.data.status}`);
    });

    // TEST 6: Table Management
    log.section('6️⃣  TABLE MANAGEMENT');

    await test('PATCH /api/tables/:id - Start session', async () => {
        const tables = await Table.find({ tableId: 2 });
        if (!tables[0]) throw new Error('Table 2 not found');
        const res = await axios.patch(`${API_URL}/tables/${tables[0]._id}`, 
            { status: 'occupied', sessionStart: new Date() },
            { headers: { Authorization: `Bearer ${waiterToken}` } }
        );
        if (res.data.status !== 'occupied') throw new Error('Failed to start session');
    });

    // TEST 7: Inventory
    log.section('7️⃣  INVENTORY MANAGEMENT');

    await test('GET /api/inventory - Fetch inventory', async () => {
        const res = await axios.get(`${API_URL}/inventory`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (!Array.isArray(res.data)) throw new Error('Inventory should be an array');
    });

    // TEST 8: Analytics
    log.section('8️⃣  ANALYTICS & REPORTS');

    await test('GET /api/analytics/daily-sales - Fetch daily sales', async () => {
        const res = await axios.get(`${API_URL}/analytics/daily-sales`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (typeof res.data !== 'object') throw new Error('Daily sales should return object');
    });

    // TEST 9: Data Integrity
    log.section('9️⃣  DATA INTEGRITY CHECKS');

    await test('All 4 user roles exist', async () => {
        const roles = ['admin', 'waiter', 'kitchen', 'customer'];
        for (const role of roles) {
            const user = await User.findOne({ role });
            if (!user) throw new Error(`No user with role '${role}'`);
        }
    });

    await test('All tables are available', async () => {
        const tables = await Table.find({});
        if (tables.length !== 6) throw new Error(`Expected 6 tables, found ${tables.length}`);
        tables.forEach((t, i) => {
            if (!t.tableId) throw new Error(`Table ${i} missing tableId`);
        });
    });

    await test('Password hashing works correctly', async () => {
        const user = await User.findOne({ email: 'admin@akxton.com' });
        const isValid = await user.matchPassword('admin123');
        if (!isValid) throw new Error('Password validation failed');
    });

    // TEST 10: Frontend Configuration
    log.section('🔟  FRONTEND CONFIGURATION');

    testWarn('Check if .env file exists', () => {
        const fs = require('fs');
        if (!fs.existsSync('.env')) throw new Error('.env file missing');
    });

    // SUMMARY
    log.section('📊 TEST SUMMARY');
    console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
    console.log(`${colors.yellow}Warnings: ${testResults.warnings}${colors.reset}`);

    const totalTests = testResults.passed + testResults.failed;
    const passPercentage = ((testResults.passed / totalTests) * 100).toFixed(1);
    
    if (testResults.failed === 0) {
        log.success(`All tests passed! (${passPercentage}%)`);
    } else {
        log.warn(`${testResults.failed} test(s) failed. (${passPercentage}% pass rate)`);
    }

    await mongoose.disconnect();
    process.exit(testResults.failed > 0 ? 1 : 0);
})();
