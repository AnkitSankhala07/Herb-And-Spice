const mongoose = require('mongoose');
const Table = require('./models/Table');

mongoose.connect('mongodb://localhost:27017/smartresto')
  .then(async () => {
    console.log('🔄 Resetting Table 2...');
    const result = await Table.findOneAndUpdate(
      { tableId: 2 },
      { 
        status: 'available',
        currentBill: 0,
        sessionStart: null,
        isActive: true
      },
      { new: true }
    );
    console.log('✅ Table 2 reset:', result);
    
    // Show all tables
    const allTables = await Table.find({});
    console.log('\n📋 All tables:');
    allTables.forEach(t => {
      console.log(`  T${t.tableId}: status=${t.status}, bill=₹${t.currentBill || 0}`);
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
