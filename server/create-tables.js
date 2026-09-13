const mongoose = require('mongoose');
const Table = require('./models/Table');

mongoose.connect('mongodb://localhost:27017/smartresto')
  .then(async () => {
    console.log('🗑️ Clearing old tables...');
    await Table.deleteMany({});
    
    console.log('✨ Creating 6 tables...');
    const tables = [];
    for (let i = 1; i <= 6; i++) {
      const table = new Table({
        tableId: i,
        capacity: 4,
        status: 'available',
        currentBill: 0,
        sessionStart: null,
        isActive: true
      });
      tables.push(table);
    }
    
    const created = await Table.insertMany(tables);
    console.log('✅ Tables created:');
    created.forEach(t => {
      console.log(`  T${t.tableId}: status=${t.status}, capacity=${t.capacity}, bill=₹${t.currentBill || 0}`);
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
