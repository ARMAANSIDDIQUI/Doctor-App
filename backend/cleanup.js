require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./Model/Order'); // Make sure this path is correct
const readline = require('readline');

// --- CONFIGURATION ---
const DB_CONNECTION_STRING = process.env.MONGODB_URI;

// The *exact* list of test addresses to find
const testAddresses = [
    '123, Main Street, Delhi',
    '456, Gandhi Nagar, Mumbai',
    '789, Park Avenue, Bangalore',
    '101, Bada Bazar, Kolkata',
    '202, Model Town, Chennai',
];

// We will target all of October 2025
const year = 2025;
const month = 9; // 0-indexed, so 9 is October
const startDate = new Date(year, month, 1);
const endDate = new Date(year, month + 1, 1); // This is Nov 1, 00:00:00

// --- SCRIPT LOGIC ---
const cleanupProductionData = async () => {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mongoose.connect(DB_CONNECTION_STRING);
        console.log('✅ Connected to PRODUCTION database.');

        // Define the query to find the bad data
        const query = {
            address: { $in: testAddresses },
            createdAt: {
                $gte: startDate,
                $lt: endDate
            }
        };

        // --- STEP 1: FIND AND VERIFY ---
        console.log(`\nSearching for test orders with matching addresses created in October 2025...`);
        const foundOrders = await Order.find(query).select('serialNo name address createdAt');

        if (foundOrders.length === 0) {
            console.log('✅ No matching test orders found. Your production data seems clean.');
            await mongoose.disconnect();
            console.log('Disconnected from database.');
            return;
        }

        console.log(`\n--- WARNING: FOUND ${foundOrders.length} TEST ORDERS ---`);
        foundOrders.forEach(order => {
            console.log(`  - Serial: ${order.serialNo}, Name: ${order.name}, Address: ${order.address}`);
        });
        console.log('---------------------------------\n');

        // --- STEP 2: CONFIRM DELETION ---
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        rl.question(`Are you SURE you want to permanently delete these ${foundOrders.length} orders? This cannot be undone. (yes/no): `, async (answer) => {
            rl.close();
            if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
                console.log('❌ Aborted. No data was deleted.');
                await mongoose.disconnect();
                console.log('Disconnected from database.');
                return;
            }

            // --- STEP 3: EXECUTE DELETION ---
            console.log('\nProceeding with deletion...');
            const deletionResult = await Order.deleteMany(query);
            
            console.log(`\n--- SUCCESS ---`);
            console.log(`✅ Successfully deleted ${deletionResult.deletedCount} orders.`);

            await mongoose.disconnect();
            console.log('Disconnected from database.');
        });

    } catch (error) {
        console.error('Error during cleanup script:', error);
        if (connection) {
            await mongoose.disconnect();
            console.log('Disconnected from database due to error.');
        }
    }
};

// --- RUN THE SCRIPT ---
// **BEFORE YOU RUN THIS:** Take a backup of your database if you can.
console.log('*** PRODUCTION CLEANUP SCRIPT ***');
console.log('This script will find and delete test data.\n');

cleanupProductionData();