const mongoose = require('mongoose');
const Order = require('./Model/Order');
const DoctorDB = require('./Model/Doctor');
const readline = require('readline'); // Module to handle user input

// IMPORTANT: Replace with your actual database connection string
const DB_CONNECTION_STRING = 'mongodb+srv://armaandoctorapp:armaan123@cluster0.pojwcqp.mongodb.net/DoctorApp';


/**
 * @description: A utility script to clean up orders with invalid or non-existent 'referredBy' IDs.
 * This script finds a doctor named 'None' and uses its ID to update corrupted orders.
 */
const cleanUpReferredBy = async () => {
    try {
        await mongoose.connect(DB_CONNECTION_STRING, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB for data cleanup.');

        // Find the "None" doctor to use as the placeholder
        const noneDoctor = await DoctorDB.findOne({ name: 'None' });
        if (!noneDoctor) {
            console.error("Error: Could not find a doctor with the name 'None'. Please create one.");
            return;
        }
        const unknownDoctorId = noneDoctor._id;

        // Get a list of all valid doctor IDs from the DoctorDB collection
        const validDoctorIds = await DoctorDB.distinct('_id');

        // Define the query to find orders with invalid or non-existent referredBy IDs
        const invalidOrderQuery = {
            $or: [
                { referredBy: { $nin: validDoctorIds } }, // ID does not exist in the doctors collection
                { referredBy: { $exists: false } },       // referredBy field is missing
                { referredBy: "" }                        // referredBy is an empty string
            ]
        };

        // Get the count of orders that will be affected by the cleanup
        const ordersToUpdateCount = await Order.countDocuments(invalidOrderQuery);
        console.log(`Found ${ordersToUpdateCount} orders with invalid 'referredBy' IDs.`);

        if (ordersToUpdateCount > 0) {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            // Prompt the user for confirmation
            rl.question('Do you want to proceed with the cleanup? (yes/no): ', async (answer) => {
                rl.close();
                if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
                    // Perform the update
                    const updateResult = await Order.updateMany(
                        invalidOrderQuery,
                        { $set: { referredBy: unknownDoctorId } }
                    );

                    console.log(`Cleanup complete. Successfully updated ${updateResult.modifiedCount} orders.`);
                } else {
                    console.log('Cleanup aborted by user.');
                }
            });
        } else {
            console.log('No orders found that require cleanup.');
        }

    } catch (error) {
        console.error('Error during data cleanup:', error);
    } finally {
        // Disconnect from Mongoose outside the try/catch, to ensure it runs
        // But only after the async operations (connect/update/disconnect) are complete
        setTimeout(() => {
             mongoose.disconnect();
             console.log('Disconnected from MongoDB.');
        }, 3000); // Wait a few seconds to ensure all logs are printed
    }
};

cleanUpReferredBy();