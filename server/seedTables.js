const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Table = require('./models/Table');

dotenv.config();

const seedTables = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/akxton_restaurant');
        
        const count = await Table.countDocuments();
        if (count === 0) {
            const tables = Array.from({ length: 14 }, (_, i) => ({
                tableId: String(i + 1),
                capacity: i % 3 === 0 ? 6 : i % 2 === 0 ? 4 : 2,
                status: 'available'
            }));
            await Table.insertMany(tables);
            console.log('Tables seeded successfully');
        } else {
            console.log('Tables already exist');
        }
        process.exit();
    } catch (error) {
        console.error('Error seeding tables:', error);
        process.exit(1);
    }
};

seedTables();
