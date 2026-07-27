require('dotenv').config();
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// Import your Mongoose models
const Order = require('./Model/Order');
const DoctorDB = require('./Model/Doctor');
const SubCategoryDB = require('./Model/SubCategory');
const Counter = require('./Model/Counter');

// Connection string from environment variable
const DB_CONNECTION_STRING = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/DoctorApp';

// --- Helper Data for Generation ---
const firstNames = ['Amit', 'Priya', 'Rajesh', 'Suman', 'Vikram', 'Meera', 'Rahul', 'Anjali', 'Kunal', 'Neha'];
const lastNames = ['Sharma', 'Verma', 'Singh', 'Gupta', 'Kumar', 'Jain', 'Patel', 'Reddy', 'Das', 'Malik'];
const genders = ['Male', 'Female'];
const addresses = [
    '123, Main Street, Delhi',
    '456, Gandhi Nagar, Mumbai',
    '789, Park Avenue, Bangalore',
    '101, Bada Bazar, Kolkata',
    '202, Model Town, Chennai',
];
const paymentModes = ['Cash', 'Online', 'Online + Cash'];
const placedByOptions = ['Armaan'];

// --- Configuration for Data Generation ---
// Define your date range and orders per day here
const START_DATE = '2026-07-01'; // Format: YYYY-MM-DD
const END_DATE = '2026-07-28';   // Format: YYYY-MM-DD
const ORDERS_PER_DAY = 100;     // Number of orders to create for each day

// Helper function to get a random item from an array
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Main script to create orders
const createOrdersForRange = async () => {
    let connection;
    try {
        connection = await mongoose.connect(DB_CONNECTION_STRING);
        console.log('Connected to MongoDB for bulk order creation.');

        // Fetch all doctors and subcategories to use for random assignment
        const doctors = await DoctorDB.find();
        const subcategories = await SubCategoryDB.find();

        if (doctors.length === 0 || subcategories.length === 0) {
            console.error('No doctors or subcategories found. Please add them first.');
            return;
        }

        // --- Date Range Loop ---
        let currentDate = new Date(START_DATE);
        const endDate = new Date(END_DATE);

        // Adjust currentDate to be at the start of the day in local time
        // This avoids any potential timezone-related "off-by-one-day" errors
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

        while (currentDate <= endDate) {
            const newOrders = [];
            const doctorCommissionUpdates = {}; // Track commissions per doctor per day

            console.log(`\n--- Creating ${ORDERS_PER_DAY} orders for ${currentDate.toDateString()} ---`);

            // Format the target date for the counter
            const dayStr = String(currentDate.getDate()).padStart(2, '0');
            const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0'); // getMonth() is 0-indexed
            const yearStr = String(currentDate.getFullYear());
            const todayString = `${dayStr}${monthStr}${yearStr}`;

            // Find and update the counter in a single operation
            let counter = await Counter.findOneAndUpdate(
                { date: todayString },
                { $inc: { count: ORDERS_PER_DAY } },
                { upsert: true, new: true }
            );
            let currentCount = counter.count - ORDERS_PER_DAY;

            for (let i = 0; i < ORDERS_PER_DAY; i++) {
                // Generate random patient data
                const name = `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`;
                const age = `${Math.floor(Math.random() * 60) + 18}YR`;
                const gender = getRandomItem(genders);
                const address = getRandomItem(addresses);
                const phoneNo = Math.floor(Math.random() * 9000000000) + 1000000000;

                // Randomly select doctor and subcategory
                const randomDoctor = getRandomItem(doctors);
                const randomSubcategory = getRandomItem(subcategories);
                
                // Use subcategory info
                const category = randomSubcategory.category;
                const subcategory = randomSubcategory.name;
                const fees = randomSubcategory.price;
                const referralFee = randomSubcategory.referralFee;
                
                // Generate random financial data
                const discount = Math.random() < 0.3 ? Math.floor(Math.random() * 100) + 10 : 0;
                const finalPayment = fees - discount;
                const paymentMode = getRandomItem(paymentModes);
                const placedBy = getRandomItem(placedByOptions);
                
                let online = 0;
                let cash = 0;
                if (paymentMode === 'Online') {
                    online = finalPayment;
                } else if (paymentMode === 'Cash') {
                    cash = finalPayment;
                } else {
                    const onlinePortion = Math.floor(Math.random() * finalPayment);
                    online = onlinePortion;
                    cash = finalPayment - onlinePortion;
                }
                
                // Generate the serial number
                currentCount++;
                const serialNo = `${todayString}${String(currentCount).padStart(2, '0')}`;
                
                const newOrder = new Order({
                    serialNo,
                    name,
                    age,
                    gender,
                    address,
                    phoneNo,
                    referredBy: randomDoctor._id,
                    category,
                    subcategory,
                    fees,
                    discount,
                    finalPayment,
                    paymentMode,
                    referralFee,
                    placedBy,
                    online,
                    cash,
                    createdAt: currentDate, // Explicitly set the timestamp
                    updatedAt: currentDate,
                });

                newOrders.push(newOrder);

                // Add to commission updates
                const commission = newOrder.referralFee - newOrder.discount;
                if (commission > 0) {
                    const doctorId = newOrder.referredBy.toString();
                    doctorCommissionUpdates[doctorId] = (doctorCommissionUpdates[doctorId] || 0) + commission;
                }
            }

            // Insert all orders for the day at once
            await Order.insertMany(newOrders);
            console.log(`Successfully inserted ${newOrders.length} orders.`);

            // Update commissions for the doctors for this day
            const commissionUpdatePromises = Object.entries(doctorCommissionUpdates).map(([doctorId, commission]) => {
                return DoctorDB.findByIdAndUpdate(doctorId, { $inc: { totalCommission: commission } });
            });
            await Promise.all(commissionUpdatePromises);
            console.log('Successfully updated doctor commissions for the day.');

            // Move to the next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        console.log('\n--- Bulk data creation for the specified date range is complete. ---');

    } catch (error) {
        console.error('Error in creating orders:', error);
    } finally {
        if (connection) {
            await mongoose.disconnect();
            console.log('Disconnected from MongoDB.');
        }
    }
};

createOrdersForRange();