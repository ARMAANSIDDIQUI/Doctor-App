require('dotenv').config();
const mongoose = require('mongoose');
// Assuming your models are correctly defined and can be imported:
const Order = require('./Model/Order'); 
const DoctorDB = require('./Model/Doctor'); 
const { ObjectId } = mongoose.Types; // Use Mongoose's ObjectId utility

// --- CONFIGURATION ---
const DB_CONNECTION_STRING = process.env.MONGODB_URI;

// --- HEALING LOGIC ---
const healDatabase = async () => {
    let connection;
    try {
        console.log('Connecting to database for healing...');
        connection = await mongoose.connect(DB_CONNECTION_STRING);
        console.log('✅ Connected to MongoDB.');

        // 1. Find or Create the 'None' Doctor Placeholder
        const NONE_DOCTOR_NAME = 'None';
        let noneDoctor = await DoctorDB.findOne({ name: /^None$/i });
        
        if (!noneDoctor) {
            console.log(`Placeholder doctor 'None' not found. Creating a new one...`);
            noneDoctor = await DoctorDB.create({
                name: NONE_DOCTOR_NAME, phoneNo: '0000000000', address: 'N/A', 
                referralFee: 0, totalCommission: 0,
            });
            console.log(`✅ Created 'None' doctor with ID: ${noneDoctor._id}`);
        }
        const noneDoctorId = noneDoctor._id;
        console.log(`Using 'None' Doctor ID: ${noneDoctorId}`);
        
        // 2. Identify and Update Corrupt Orders
        const invalidValues = ["none", "0", ""]; // Common string errors

        // Find orders where referredBy is not a valid ObjectId OR is one of the known invalid strings
        const corruptQuery = {
            $or: [
                { referredBy: { $in: invalidValues } }, // Orders where referredBy is the string 'none', '0', or empty
                { referredBy: { $exists: false } },    // Orders where referredBy is missing
                { referredBy: null },                   // Orders where referredBy is explicitly null
            ]
        };

        // Get the list of orders we are about to fix for logging (optional, but helpful)
        const ordersToFix = await Order.countDocuments(corruptQuery);

        console.log(`\n🔍 Found ${ordersToFix} orders with corrupt/missing 'referredBy' values.`);
        
        if (ordersToFix === 0) {
            console.log("✅ No database corruption found in the 'referredBy' field. Exiting.");
            return;
        }

        // Execute the update
        const updateResult = await Order.updateMany(
            corruptQuery,
            { $set: { referredBy: noneDoctorId } }
        );

        console.log(`\n--- HEALING COMPLETE ---`);
        console.log(`✅ Successfully fixed and reassigned ${updateResult.modifiedCount} orders to the 'None' doctor.`);
        
    } catch (error) {
        console.error('\n❌ Error during database healing script:', error);
    } finally {
        if (connection) {
            await mongoose.disconnect();
            console.log('Disconnected from database.');
        }
    }
};

// --- RUN THE SCRIPT ---
healDatabase();