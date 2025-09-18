// // const mongoose = require('mongoose');
// // const { ObjectId } = mongoose.Types;

// // // Import your Mongoose models
// // const Order = require('./Model/Order');
// // const DoctorDB = require('./Model/Doctor');
// // const SubCategoryDB = require('./Model/SubCategory');
// // const Counter = require('./Model/Counter');

// // // IMPORTANT: Replace with your actual database connection string
// // const DB_CONNECTION_STRING = 'mongodb+srv://armaandoctorapp:armaan123@cluster0.pojwcqp.mongodb.net/DoctorApp';

// // // --- Helper Data for Generation ---
// // const firstNames = ['Amit', 'Priya', 'Rajesh', 'Suman', 'Vikram', 'Meera', 'Rahul', 'Anjali', 'Kunal', 'Neha'];
// // const lastNames = ['Sharma', 'Verma', 'Singh', 'Gupta', 'Kumar', 'Jain', 'Patel', 'Reddy', 'Das', 'Malik'];
// // const genders = ['Male', 'Female'];
// // const addresses = [
// //     '123, Main Street, Delhi',
// //     '456, Gandhi Nagar, Mumbai',
// //     '789, Park Avenue, Bangalore',
// //     '101, Bada Bazar, Kolkata',
// //     '202, Model Town, Chennai',
// // ];
// // const paymentModes = ['Cash', 'Online', 'Online + Cash'];
// // const placedByOptions = ['Armaan'];

// // // Helper function to get a random item from an array
// // const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// // // Main script to create orders
// // const createOrders = async () => {
// //     let connection;
// //     try {
// //         connection = await mongoose.connect(DB_CONNECTION_STRING);
// //         console.log('Connected to MongoDB for order creation.');

// //         // Fetch all doctors and subcategories to use for random assignment
// //         const doctors = await DoctorDB.find();
// //         const subcategories = await SubCategoryDB.find();

// //         if (doctors.length === 0 || subcategories.length === 0) {
// //             console.error('No doctors or subcategories found. Please add them first.');
// //             return;
// //         }

// //         const newOrders = [];

// //         for (let i = 0; i < 100; i++) {
// //             // Generate random patient data
// //             const name = `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`;
// //             const age = `${Math.floor(Math.random() * 60) + 18}YR`; // Age between 18 and 77
// //             const gender = getRandomItem(genders);
// //             const address = getRandomItem(addresses);
// //             const phoneNo = Math.floor(Math.random() * 9000000000) + 1000000000; // Random 10-digit number
            
// //             // Randomly select doctor and subcategory
// //             const randomDoctor = getRandomItem(doctors);
// //             const randomSubcategory = getRandomItem(subcategories);
            
// //             // Use subcategory info
// //             const category = randomSubcategory.category;
// //             const subcategory = randomSubcategory.name;
// //             const fees = randomSubcategory.price;
// //             const referralFee = randomSubcategory.referralFee;
            
// //             // Generate random financial data
// //             const discount = Math.random() < 0.3 ? Math.floor(Math.random() * 100) + 10 : 0; // 30% chance of a discount
// //             const finalPayment = fees - discount;
// //             const paymentMode = getRandomItem(paymentModes);
// //             const placedBy = getRandomItem(placedByOptions);
            
// //             let online = 0;
// //             let cash = 0;
// //             if (paymentMode === 'Online') {
// //                 online = finalPayment;
// //             } else if (paymentMode === 'Cash') {
// //                 cash = finalPayment;
// //             } else { // 'Online + Cash'
// //                 const onlinePortion = Math.floor(Math.random() * finalPayment);
// //                 online = onlinePortion;
// //                 cash = finalPayment - onlinePortion;
// //             }
            
// //             // Get today's date for serial number
// //             const today = new Date();
// //             const day = String(today.getDate()).padStart(2, '0');
// //             const month = String(today.getMonth() + 1).padStart(2, '0');
// //             const year = today.getFullYear();
// //             const todayString = `${day}${month}${year}`;

// //             // Find and update the counter (similar to your controller)
// //             let counter = await Counter.findOneAndUpdate(
// //                 { date: todayString },
// //                 { $inc: { count: 1 } },
// //                 { upsert: true, new: true }
// //             );
// //             const serialNo = `${todayString}${String(counter.count).padStart(2, '0')}`;

// //             // Create the new order document
// //             const newOrder = new Order({
// //                 serialNo,
// //                 name,
// //                 age,
// //                 gender,
// //                 address,
// //                 phoneNo,
// //                 referredBy: randomDoctor._id,
// //                 category,
// //                 subcategory,
// //                 fees,
// //                 discount,
// //                 finalPayment,
// //                 paymentMode,
// //                 referralFee,
// //                 placedBy,
// //                 online,
// //                 cash,
// //             });

// //             newOrders.push(newOrder);
            
// //             // Log to confirm creation
// //             console.log(`Order ${i + 1} created for patient: ${name}, referred by: ${randomDoctor.name}`);
// //         }

// //         await Order.insertMany(newOrders);
// //         console.log(`Successfully created and inserted ${newOrders.length} orders.`);
        
// //         // Update total commission for the referred doctors
// //         for (const order of newOrders) {
// //             const doctor = await DoctorDB.findById(order.referredBy);
// //             if (doctor) {
// //                 const commission = order.referralFee - order.discount;
// //                 if (commission > 0) {
// //                     doctor.totalCommission += commission;
// //                     await doctor.save();
// //                 }
// //             }
// //         }
// //         console.log('Successfully updated doctor commissions.');

// //     } catch (error) {
// //         console.error('Error in creating orders:', error);
// //     } finally {
// //         if (connection) {
// //             await mongoose.disconnect();
// //             console.log('Disconnected from MongoDB.');
// //         }
// //     }
// // };

// // createOrders();







// const mongoose = require('mongoose');
// const { ObjectId } = mongoose.Types;

// // Import your Mongoose models
// const Order = require('./Model/Order');
// const DoctorDB = require('./Model/Doctor');
// const SubCategoryDB = require('./Model/SubCategory');
// const Counter = require('./Model/Counter');

// // IMPORTANT: Replace with your actual database connection string
// const DB_CONNECTION_STRING = 'mongodb+srv://armaandoctorapp:armaan123@cluster0.pojwcqp.mongodb.net/DoctorApp';

// // --- Helper Data for Generation ---
// const firstNames = ['Amit', 'Priya', 'Rajesh', 'Suman', 'Vikram', 'Meera', 'Rahul', 'Anjali', 'Kunal', 'Neha'];
// const lastNames = ['Sharma', 'Verma', 'Singh', 'Gupta', 'Kumar', 'Jain', 'Patel', 'Reddy', 'Das', 'Malik'];
// const genders = ['Male', 'Female'];
// const addresses = [
//     '123, Main Street, Delhi',
//     '456, Gandhi Nagar, Mumbai',
//     '789, Park Avenue, Bangalore',
//     '101, Bada Bazar, Kolkata',
//     '202, Model Town, Chennai',
// ];
// const paymentModes = ['Cash', 'Online', 'Online + Cash'];
// const placedByOptions = ['Armaan'];

// // Helper function to get a random item from an array
// const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// // Main script to create orders
// const createOrdersForMonth = async () => {
//     let connection;
//     try {
//         await mongoose.connect(DB_CONNECTION_STRING);
//         console.log('Connected to MongoDB for bulk order creation.');

//         // Fetch all doctors and subcategories to use for random assignment
//         const doctors = await DoctorDB.find();
//         const subcategories = await SubCategoryDB.find();

//         if (doctors.length === 0 || subcategories.length === 0) {
//             console.error('No doctors or subcategories found. Please add them first.');
//             return;
//         }

//         // Define the month and year for which to create data
//         const year = 2025;
//         const month = 7; // August is month 7 (0-indexed)
//         const daysInMonth = 31;
//         const ordersPerDay = 100;

//         for (let day = 1; day <= daysInMonth; day++) {
//             const targetDate = new Date(year, month, day);
//             const newOrders = [];
//             const doctorCommissionUpdates = {}; // Track commissions per doctor per day

//             console.log(`\n--- Creating ${ordersPerDay} orders for ${targetDate.toDateString()} ---`);

//             // Format the target date for the counter
//             const dayStr = String(day).padStart(2, '0');
//             const monthStr = String(month + 1).padStart(2, '0');
//             const yearStr = String(year);
//             const todayString = `${dayStr}${monthStr}${yearStr}`;

//             // Find and update the counter in a single operation
//             let counter = await Counter.findOneAndUpdate(
//                 { date: todayString },
//                 { $inc: { count: ordersPerDay } },
//                 { upsert: true, new: true }
//             );
//             let currentCount = counter.count - ordersPerDay;

//             for (let i = 0; i < ordersPerDay; i++) {
//                 // Generate random patient data
//                 const name = `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`;
//                 const age = `${Math.floor(Math.random() * 60) + 18}YR`;
//                 const gender = getRandomItem(genders);
//                 const address = getRandomItem(addresses);
//                 const phoneNo = Math.floor(Math.random() * 9000000000) + 1000000000;

//                 // Randomly select doctor and subcategory
//                 const randomDoctor = getRandomItem(doctors);
//                 const randomSubcategory = getRandomItem(subcategories);
                
//                 // Use subcategory info
//                 const category = randomSubcategory.category;
//                 const subcategory = randomSubcategory.name;
//                 const fees = randomSubcategory.price;
//                 const referralFee = randomSubcategory.referralFee;
                
//                 // Generate random financial data
//                 const discount = Math.random() < 0.3 ? Math.floor(Math.random() * 100) + 10 : 0;
//                 const finalPayment = fees - discount;
//                 const paymentMode = getRandomItem(paymentModes);
//                 const placedBy = getRandomItem(placedByOptions);
                
//                 let online = 0;
//                 let cash = 0;
//                 if (paymentMode === 'Online') {
//                     online = finalPayment;
//                 } else if (paymentMode === 'Cash') {
//                     cash = finalPayment;
//                 } else {
//                     const onlinePortion = Math.floor(Math.random() * finalPayment);
//                     online = onlinePortion;
//                     cash = finalPayment - onlinePortion;
//                 }
                
//                 // Generate the serial number
//                 currentCount++;
//                 const serialNo = `${todayString}${String(currentCount).padStart(2, '0')}`;
                
//                 const newOrder = new Order({
//                     serialNo,
//                     name,
//                     age,
//                     gender,
//                     address,
//                     phoneNo,
//                     referredBy: randomDoctor._id,
//                     category,
//                     subcategory,
//                     fees,
//                     discount,
//                     finalPayment,
//                     paymentMode,
//                     referralFee,
//                     placedBy,
//                     online,
//                     cash,
//                     createdAt: targetDate, // Explicitly set the timestamp
//                     updatedAt: targetDate,
//                 });

//                 newOrders.push(newOrder);

//                 // Add to commission updates
//                 const commission = newOrder.referralFee - newOrder.discount;
//                 if (commission > 0) {
//                     const doctorId = newOrder.referredBy.toString();
//                     doctorCommissionUpdates[doctorId] = (doctorCommissionUpdates[doctorId] || 0) + commission;
//                 }
//             }

//             // Insert all orders for the day at once
//             await Order.insertMany(newOrders);
//             console.log(`Successfully inserted ${newOrders.length} orders.`);

//             // Update commissions for the doctors for this day
//             const commissionUpdatePromises = Object.entries(doctorCommissionUpdates).map(([doctorId, commission]) => {
//                 return DoctorDB.findByIdAndUpdate(doctorId, { $inc: { totalCommission: commission } });
//             });
//             await Promise.all(commissionUpdatePromises);
//             console.log('Successfully updated doctor commissions for the day.');
//         }

//         console.log('\n--- Bulk data creation for August 2025 is complete. ---');

//     } catch (error) {
//         console.error('Error in creating orders:', error);
//     } finally {
//         if (connection) {
//             await mongoose.disconnect();
//             console.log('Disconnected from MongoDB.');
//         }
//     }
// };

// createOrdersForMonth();



const mongoose = require('mongoose');
const Order = require('./Model/Order');
const readline = require('readline');

// IMPORTANT: Replace with your actual database connection string
const DB_CONNECTION_STRING = 'mongodb+srv://armaandoctorapp:armaan123@cluster0.pojwcqp.mongodb.net/DoctorApp';

/**
 * @description: A utility script to delete a specified number of orders for each day of a given month.
 */
const deleteOrdersForMonth = async () => {
    let connection;
    try {
        connection = await mongoose.connect(DB_CONNECTION_STRING, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB.');

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        // Prompt for confirmation before running a destructive script
        rl.question('This script will delete 3000 orders for each day in August 2025. Do you want to proceed? (yes/no): ', async (answer) => {
            rl.close();
            if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
                console.log('Script aborted by user.');
                await mongoose.disconnect();
                return;
            }

            console.log('\nStarting deletion process...');

            const year = 2025;
            const month = 7; // August is month 7 (0-indexed)
            const daysInMonth = 31;
            const ordersPerDayToDelete = 150;
            let totalDeleted = 0;

            for (let day = 1; day <= daysInMonth; day++) {
                const targetDate = new Date(year, month, day);
                const nextDay = new Date(year, month, day + 1);

                // Find the IDs of the orders to delete for the current day
                const ordersToDelete = await Order.find({
                    createdAt: {
                        $gte: targetDate,
                        $lt: nextDay
                    }
                }).select('_id').limit(ordersPerDayToDelete).lean();

                if (ordersToDelete.length > 0) {
                    const orderIds = ordersToDelete.map(order => order._id);
                    const deletionResult = await Order.deleteMany({ _id: { $in: orderIds } });
                    
                    console.log(`Deleted ${deletionResult.deletedCount} orders for ${targetDate.toDateString()}`);
                    totalDeleted += deletionResult.deletedCount;
                } else {
                    console.log(`No orders found to delete for ${targetDate.toDateString()}`);
                }
            }

            console.log('\nDeletion process complete.');
            console.log(`Total orders deleted: ${totalDeleted}`);
            await mongoose.disconnect();
        });

    } catch (error) {
        console.error('Error during order deletion:', error);
        if (connection) {
            await mongoose.disconnect();
        }
    }
};

deleteOrdersForMonth();