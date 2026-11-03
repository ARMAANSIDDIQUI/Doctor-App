const mongoose = require("mongoose");
const DoctorDB = require("./Model/Doctor");
const Order = require("./Model/Order");
const Unbilled = require("./Model/Unbilled");

/**
 * Startup Integrity & Cascade Reassignment Check:
 * 1. Finds or creates the default 'None' placeholder doctor.
 * 2. Checks for Orders and Unbilled records referencing deleted, non-existent, or invalid doctors
 *    (matching both ObjectId and String representations, null, empty, 0, or 'none').
 * 3. Reassigns all associated orphan/invalid records to the 'None' placeholder doctor.
 * 4. Normalizes string representations of valid doctor ObjectIds into true ObjectIds.
 */
async function runStartupIntegrityCheck() {
  try {
    console.log("🔍 Running Startup Database Integrity & Cascade Reassignment Check...");

    // 1. Find or create the 'None' doctor placeholder
    let noneDoctor = await DoctorDB.findOne({ name: /^None$/i });
    if (!noneDoctor) {
      console.log("Placeholder doctor 'None' not found. Creating a new one...");
      noneDoctor = await DoctorDB.create({
        name: "None",
        phoneNo: 0,
        address: "N/A",
        referralFee: 0,
        totalCommission: 0,
      });
      console.log(`✅ Created 'None' placeholder doctor with ID: ${noneDoctor._id}`);
    } else {
      console.log(`✅ 'None' placeholder doctor verified (ID: ${noneDoctor._id})`);
    }

    const noneDoctorId = noneDoctor._id;

    // 2. Fetch all valid doctor IDs (both as ObjectId and String)
    const validDoctors = await DoctorDB.find({}).select("_id");
    const validDoctorIds = [];
    validDoctors.forEach((doc) => {
      validDoctorIds.push(doc._id);
      validDoctorIds.push(String(doc._id));
    });

    // 3. Reassign invalid / orphan Orders to 'None' doctor
    const invalidQuery = {
      $or: [
        { referredBy: { $exists: false } },
        { referredBy: null },
        { referredBy: "" },
        { referredBy: 0 },
        { referredBy: "0" },
        { referredBy: /^none$/i },
        { referredBy: { $nin: validDoctorIds } },
      ],
    };

    const orderReassignResult = await Order.updateMany(invalidQuery, {
      $set: { referredBy: noneDoctorId },
    });

    if (orderReassignResult.modifiedCount > 0) {
      console.log(
        `✅ Reassigned ${orderReassignResult.modifiedCount} orphan/invalid Orders to 'None' doctor.`
      );
    } else {
      console.log("✅ All Orders have valid doctor references.");
    }

    // 4. Reassign invalid / orphan Unbilled records to 'None' doctor
    const unbilledReassignResult = await Unbilled.updateMany(invalidQuery, {
      $set: { referredBy: noneDoctorId },
    });

    if (unbilledReassignResult.modifiedCount > 0) {
      console.log(
        `✅ Reassigned ${unbilledReassignResult.modifiedCount} orphan/invalid Unbilled records to 'None' doctor.`
      );
    } else {
      console.log("✅ All Unbilled records have valid doctor references.");
    }

    // 5. Normalization: ensure string ObjectIds in Order and Unbilled are converted to proper ObjectIds
    const stringOrders = await Order.find({ referredBy: { $type: "string" } }).select("_id referredBy");
    let normalizedOrdersCount = 0;
    for (const order of stringOrders) {
      if (mongoose.Types.ObjectId.isValid(order.referredBy)) {
        await Order.updateOne(
          { _id: order._id },
          { $set: { referredBy: new mongoose.Types.ObjectId(order.referredBy) } }
        );
        normalizedOrdersCount++;
      }
    }
    if (normalizedOrdersCount > 0) {
      console.log(`✅ Normalized ${normalizedOrdersCount} Orders from string ID to true ObjectId.`);
    }

    const stringUnbilled = await Unbilled.find({ referredBy: { $type: "string" } }).select("_id referredBy");
    let normalizedUnbilledCount = 0;
    for (const unb of stringUnbilled) {
      if (mongoose.Types.ObjectId.isValid(unb.referredBy)) {
        await Unbilled.updateOne(
          { _id: unb._id },
          { $set: { referredBy: new mongoose.Types.ObjectId(unb.referredBy) } }
        );
        normalizedUnbilledCount++;
      }
    }
    if (normalizedUnbilledCount > 0) {
      console.log(`✅ Normalized ${normalizedUnbilledCount} Unbilled records from string ID to true ObjectId.`);
    }

    console.log("✅ Startup Database Integrity Check completed successfully.");
    return {
      noneDoctorId,
      ordersReassigned: orderReassignResult.modifiedCount,
      unbilledReassigned: unbilledReassignResult.modifiedCount,
      ordersNormalized: normalizedOrdersCount,
      unbilledNormalized: normalizedUnbilledCount,
    };
  } catch (error) {
    console.error("❌ Error during Startup Database Integrity Check:", error);
  }
}

module.exports = { runStartupIntegrityCheck };

