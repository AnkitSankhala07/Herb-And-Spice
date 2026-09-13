const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        // Test chef login
        const chef = await User.findOne({ email: 'chef@akxton.com' });
        
        if (!chef) {
            console.log('❌ Chef not found!');
            process.exit(1);
        }
        
        console.log('✅ Chef found!');
        console.log('Name:', chef.name);
        console.log('Email:', chef.email);
        console.log('Role:', chef.role);
        
        // Test password matching
        const isPasswordCorrect = await chef.matchPassword('chef123');
        console.log('Password match (chef123):', isPasswordCorrect);
        
        // List all users
        const allUsers = await User.find({});
        console.log('\n📋 All Users:');
        allUsers.forEach(u => {
            console.log(`  - ${u.name} (${u.email}) - ${u.role}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}).catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
});
