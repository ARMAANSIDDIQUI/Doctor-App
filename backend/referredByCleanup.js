const mongoose = require('mongoose');
const Order = require('./Model/Order');     // <-- IMPORTANT: Check this path
const DoctorDB = require('./Model/Doctor'); // <-- IMPORTANT: Check this path
const readline = require('readline/promises'); // <-- Use the 'promises' version

// --- CONFIGURATION ---
// This is the connection string you provided
const MONGODB_URI = 'mongodb+srv://armaansiddiquimit_db_user:Armaan_123@cluster0.bddkncp.mongodb.net/DoctorApp';

/**
 * @description: A utility script to clean up orders with invalid or non-existent 'referredBy' IDs.
 * This script finds a doctor named 'None' and uses its ID to update corrupted orders.
 */
async function cleanUpReferredBy() {
  // Create the readline interface outside the try block
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    // Remove deprecated options
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for data cleanup.');

    // Find the "None" doctor (case-insensitive) to use as the placeholder
    const noneDoctor = await DoctorDB.findOne({ name: /^None$/i });
    if (!noneDoctor) {
      console.error("Error: Could not find a doctor with the name 'None'. Please create one.");
      return; // Exit script
    }
    const unknownDoctorId = noneDoctor._id;
    console.log(`Found 'None' doctor. ID: ${unknownDoctorId}`);

    // Get a list of all valid doctor IDs from the DoctorDB collection
    const validDoctorIds = await DoctorDB.distinct('_id');

    // Define the query to find orders with invalid or non-existent referredBy IDs
    const invalidOrderQuery = {
      $or: [
        { referredBy: { $nin: validDoctorIds } }, // ID does not exist in the doctors collection
        { referredBy: { $exists: false } },     // referredBy field is missing
        { referredBy: null },                   // referredBy is null
        { referredBy: "" }                      // referredBy is an empty string
      ]
    };

    // Get the count of orders that will be affected by the cleanup
    const ordersToUpdateCount = await Order.countDocuments(invalidOrderQuery);
    console.log(`Found ${ordersToUpdateCount} orders with invalid 'referredBy' IDs.`);

    if (ordersToUpdateCount > 0) {
      // Use await to wait for the user's answer
      const answer = await rl.question('Do you want to proceed with the cleanup? (yes/no): ');

      if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        console.log('Starting cleanup...');
        // Perform the update
        const updateResult = await Order.updateMany(
          invalidOrderQuery,
          { $set: { referredBy: unknownDoctorId } }
        );

        console.log(`Cleanup complete. Successfully updated ${updateResult.modifiedCount} orders.`);
      } else {
        console.log('Cleanup aborted by user.');
      }
    } else {
      console.log('No orders found that require cleanup.');
    }

  } catch (error) {
    console.error('Error during data cleanup:', error);
  } finally {
    // This will now correctly run AFTER all await operations are complete
    rl.close(); // Close the readline interface
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

// Run the script
cleanUpReferredBy();

