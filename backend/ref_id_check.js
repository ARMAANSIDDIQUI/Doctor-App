const { MongoClient, ObjectId } = require("mongodb");

async function fixOrders() {
  const uri =
    "mongodb+srv://armaansiddiquimit_db_user:Armaan_123@cluster0.bddkncp.mongodb.net/DoctorApp";
  const client = new MongoClient(uri);

  try {
    await client.connect();

    const db = client.db("DoctorApp");
    const ordersCollection = db.collection("orders");
    const doctorsCollection = db.collection("doctors");

    // Ensure "None" doctor exists
    let noneDoctor = await doctorsCollection.findOne({ name: "None" });

    if (!noneDoctor) {
      const result = await doctorsCollection.insertOne({
        name: "None",
        phoneNo: "0",
        address: "NA",
        totalCommission: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      noneDoctor = { _id: result.insertedId };
      console.log("Created 'None' doctor with ID:", noneDoctor._id);
    }

    // Counters
    let nullUpdated = 0;
    let invalidUpdated = 0;
    let validCount = 0;
    let totalChecked = 0;

    // Traverse orders
    const cursor = ordersCollection.find({});
    while (await cursor.hasNext()) {
      const order = await cursor.next();
      totalChecked++;

      if (!order.referredBy) {
        await ordersCollection.updateOne(
          { _id: order._id },
          { $set: { referredBy: noneDoctor._id } }
        );
        nullUpdated++;
        console.log(
          `Order ${order._id} had NULL referredBy → updated to None doctor (${noneDoctor._id})`
        );
      } else {
        let doctorId;
        try {
          doctorId = new ObjectId(order.referredBy);
        } catch (e) {
          // Invalid BSON (not 24-char hex string etc.)
          await ordersCollection.updateOne(
            { _id: order._id },
            { $set: { referredBy: noneDoctor._id } }
          );
          invalidUpdated++;
          console.log(
            `Order ${order._id} had INVALID BSON doctor ID (${order.referredBy}) → replaced with None doctor (${noneDoctor._id})`
          );
          continue;
        }

        const doctorExists = await doctorsCollection.findOne({ _id: doctorId });
        if (!doctorExists) {
          await ordersCollection.updateOne(
            { _id: order._id },
            { $set: { referredBy: noneDoctor._id } }
          );
          invalidUpdated++;
          console.log(
            `Order ${order._id} had INVALID doctor ID (${order.referredBy}) → replaced with None doctor (${noneDoctor._id})`
          );
        } else {
          validCount++;
        }
      }
    }

    console.log("✅ Orders check & fix completed!");
    console.log(`Total Orders Checked: ${totalChecked}`);
    console.log(`Updated (null referredBy): ${nullUpdated}`);
    console.log(`Updated (invalid doctor ID / BSON error): ${invalidUpdated}`);
    console.log(`Valid Orders (doctor exists): ${validCount}`);
    console.log(`Grand Total Updates: ${nullUpdated + invalidUpdated}`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

fixOrders();
