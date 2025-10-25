const Counter = require('../Model/Counter');
const Order = require('../Model/Order');
const DoctorDB = require('../Model/Doctor');
const mongoose = require('mongoose');

const PlaceOrder = async (req, res) => {
    console.log("REQ BODY:", req.body);

    try {
        const {
            name,
            age,
            gender,
            address,
            phoneNo,
            referredBy,
            category,
            subcategory,
            fees,
            discount = 0,
            finalPayment,
            paymentMode,
            referralFee,
            placedBy,
            //Added new fields for Online + Cash - Armaan Siddiqui
            online = 0,
            cash = 0,
        } = req.body;

        // Get today's date in DDMMYYYY format
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        const todayString = `${day}${month}${year}`;

        // Find and update the counter for today's date
        let counter = await Counter.findOne({ date: todayString });
        if (!counter) {
            // Create a new counter if none exists for today
            counter = new Counter({ date: todayString, count: 0 });
        }

        // Increment the count
        counter.count += 1;
        await counter.save();

        // Generate the serial number
        const serialNo = `${todayString}${String(counter.count).padStart(2, '0')}`;

        // Check if referredBy is valid and contains a doctor's ID
        if (referredBy && referredBy !== '0' && referredBy.toLowerCase() !== 'none') {
            const doctor = await DoctorDB.findById(referredBy);
            if (doctor) {
                // Calculate the commission to be added to the doctor's total
                const commission = referralFee - discount;
                if (commission > 0) {
                    doctor.totalCommission += commission;
                    await doctor.save();
                }
            }
        }

        // Create a new order
        const newOrder = new Order({
            serialNo,
            name,
            age,
            gender,
            address,
            phoneNo,
            referredBy,
            category,
            subcategory,
            fees,
            discount,
            finalPayment,
            paymentMode,
            referralFee,
            placedBy,
            //Added new fields for Online + Cash - Armaan Siddiqui
            online,
            cash,
        });

        // Save the order
        await newOrder.save();

        // Send success response
        res.status(201).json({
            message: 'Order placed successfully',
            order: newOrder,
        });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({
            message: 'Error placing order',
            error: error.message,
        });
    }
};

// FetchOrder API to retrieve an order by ID
const fetchOrder = async (req, res) => {
    try {
        const { orderId } = req.params; // Assuming the order ID is passed as a route parameter

        // Find the order by ID
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                message: 'Order not found',
            });
        }

        // Send success response with the order data
        res.status(200).json({
            message: 'Order fetched successfully',
            order,
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            message: 'Error fetching order',
            error: error.message,
        });
    }
};

const fetchAllOrder = async (req, res) => {
    try {
        // Fetch all orders from the database
        const orders = await Order.find();

        if (orders.length === 0) {
            return res.status(404).json({
                message: 'No orders found',
            });
        }

        // Send success response with all orders
        res.status(200).json({
            message: 'Orders fetched successfully',
            orders,
        });
    } catch (error) {
        console.error('Error fetching all orders:', error);
        res.status(500).json({
            message: 'Error fetching all orders',
            error: error.message,
        });
    }
};

// const EditOrder = async (req, res) => {
//     try {
//         const { orderId } = req.params; // Order ID is passed in the URL parameters
//         const updateData = req.body; // The data to update is passed in the request body

//         // Find the existing order
//         const existingOrder = await Order.findById(orderId);
//         if (!existingOrder) {
//             return res.status(404).json({
//                 message: 'Order not found',
//             });
//         }

//         // Check if referredBy is valid and discount is being changed
//         if (
//             existingOrder.referredBy &&
//             existingOrder.referredBy !== '0' &&
//             existingOrder.referredBy.toLowerCase() !== 'none' &&
//             'discount' in updateData &&
//             updateData.discount !== existingOrder.discount
//         ) {
//             const doctor = await DoctorDB.findById(existingOrder.referredBy);
//             if (doctor) {
//                 // Update the doctor's commission
//                 const oldCommission = existingOrder.referralFee - existingOrder.discount;
//                 const newCommission = existingOrder.referralFee - updateData.discount;

//                 // Adjust the total commission based on the difference
//                 doctor.totalCommission += newCommission - oldCommission;
//                 await doctor.save();
//             }
//         }

//         // Update the order with the new data
//         const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, {
//             new: true, // This ensures that the updated order is returned
//             runValidators: true, // This ensures the model validation is run during the update
//         });

//         // Send success response with the updated order data
//         res.status(200).json({
//             message: 'Order updated successfully',
//             order: updatedOrder,
//         });
//     } catch (error) {
//         console.error('Error updating order:', error);
//         res.status(500).json({
//             message: 'Error updating order',
//             error: error.message,
//         });
//     }
// };


const EditOrder = async (req, res) => {
    try {
        const { orderId } = req.params; // Order ID is passed in the URL parameters
        const updateData = req.body; // The data to update is passed in the request body

        // Find the existing order
        const existingOrder = await Order.findById(orderId);
        if (!existingOrder) {
            return res.status(404).json({
                message: 'Order not found',
            });
        }

        // --- CRITICAL FIX START ---
        // Ensure referredBy is a valid string before calling toLowerCase()
        const isReferredByValid = 
            existingOrder.referredBy && 
            typeof existingOrder.referredBy === 'string' &&
            existingOrder.referredBy.toLowerCase() !== 'none';
            
        // Check if referredBy is valid and discount is being changed
        if (
            isReferredByValid &&
            'discount' in updateData &&
            updateData.discount !== existingOrder.discount
        ) {
        // --- CRITICAL FIX END ---
            const doctor = await DoctorDB.findById(existingOrder.referredBy);
            if (doctor) {
                // Update the doctor's commission
                const oldCommission = existingOrder.referralFee - existingOrder.discount;
                const newCommission = existingOrder.referralFee - updateData.discount;

                // Adjust the total commission based on the difference
                doctor.totalCommission += newCommission - oldCommission;
                await doctor.save();
            }
        }

        // Update the order with the new data
        const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, {
            new: true, // This ensures that the updated order is returned
            runValidators: true, // This ensures the model validation is run during the update
        });

        // Send success response with the updated order data
        res.status(200).json({
            message: 'Order updated successfully',
            order: updatedOrder,
        });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({
            message: 'Error updating order',
            error: error.message,
        });
    }
};


const DeleteOrder = async (req, res) => {
    try {
        const { orderId } = req.params; // Order ID is passed in the URL parameters

        // Find the order by ID and delete it
        const deletedOrder = await Order.findByIdAndDelete(orderId);

        if (!deletedOrder) {
            return res.status(404).json({
                message: 'Order not found',
            });
        }

        // Send success response
        res.status(200).json({
            message: 'Order deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({
            message: 'Error deleting order',
            error: error.message,
        });
    }
};

/**-Armaan Siddiqui
 * @description: Fetches a paginated list of orders.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {object} - JSON response containing paginated orders and total count.
 */
const fetchPaginatedOrders = async (req, res) => {
    try {
        // Extract skip and limit from query parameters with default values
        const skip = parseInt(req.query.skip) || 0;
        const limit = parseInt(req.query.limit) || 100;

        // Get the total number of orders in the collection
        const totalOrders = await Order.countDocuments();

        // Fetch the orders for the current page
        const orders = await Order.find()
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }); // Optional: sort by creation date descending

        res.status(200).json({
            message: 'Orders fetched successfully with pagination.',
            orders: orders,
            totalOrders: totalOrders
        });
    } catch (error) {
        console.error('Error fetching paginated orders:', error);
        res.status(500).json({
            message: 'Error fetching paginated orders.',
            error: error.message,
        });
    }
};

const fetchAllOrdersFromDB = async () => {
    try {
        // Get the start and end timestamps for the current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0); // 1st day of the month at 00:00:00
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 50, 0); // Last day of the month at 23:50:00

        // Fetch all orders within the date range
        const orders = await Order.find({
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        });

        if (orders.length === 0) {
            throw new Error("No orders found for the current month");
        }

        return orders;
    } catch (error) {
        console.error("Error fetching all orders:", error);
        throw error; // Propagate the error to the caller
    }
};

const fetchFilteredOrders = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Check if startDate and endDate are provided
        if (!startDate || !endDate) {
            return res.status(400).json({
                message: 'Please provide both startDate and endDate in the query parameters.',
            });
        }

        // Convert startDate and endDate to Date objects
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Ensure endDate includes the entire day
        end.setHours(23, 59, 59, 999);

        // Fetch orders within the date range
        const orders = await Order.find({
            createdAt: {
                $gte: start,
                $lte: end,
            },
        });

        if (orders.length === 0) {
            return res.status(404).json({
                message: 'No orders found in the specified date range.',
            });
        }

        // Send success response with filtered orders
        res.status(200).json({
            message: 'Orders fetched successfully for the specified date range.',
            orders,
        });
    } catch (error) {
        console.error('Error fetching filtered orders:', error);
        res.status(500).json({
            message: 'Error fetching filtered orders.',
            error: error.message,
        });
    }
};


// Added New Controller For Orders Count-Armaan Siddiqui
/**
 * @description: Fetches the total count of orders.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {object} - JSON response containing the total order count.
 */
const getTotalOrdersCount = async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();

        res.status(200).json({
            message: 'Total order count fetched successfully.',
            totalOrders: totalOrders,
        });
    } catch (error) {
        console.error('Error fetching total order count:', error);
        res.status(500).json({
            message: 'Error fetching total order count.',
            error: error.message,
        });
    }
};

// Added New Controller to allow pagination with filter and download report support-Armaan Siddiqui

// const getOrdersWithFilters = async (req, res) => {
//   console.log("REQ QUERY:", req.query);

//   try {
//     const { skip = 0, limit = 10, searchQuery, startDate, endDate, referredBy, download } = req.query;

//     const conditions = [];

//     // 1. Add Doctor dropdown filter condition
//     // This condition will only be added if a specific doctor is selected.
//     if (referredBy && referredBy !== "none" && referredBy !== "all") {
//         // FIX: Convert the referredBy string to a Mongoose ObjectId
//         conditions.push({ referredBy: new mongoose.Types.ObjectId(referredBy) });
//     }

//     // 2. Add Patient search query conditions
//     if (searchQuery) {
//         const regex = new RegExp(searchQuery, 'i');
//         const doctors = await DoctorDB.find({ name: regex }).select('_id');
//         const doctorIds = doctors.map(doc => doc._id);

//         const orConditions = [
//             { name: regex }, // Search by patient name
//             { serialNo: regex } // Search by serial number
//         ];

//         // If doctors are found, add their IDs to the $or condition
//         if (doctorIds.length > 0) {
//             orConditions.push({ referredBy: { $in: doctorIds } });
//         }
        
//         // Add the combined $or condition to the main conditions array
//         conditions.push({ $or: orConditions });
//     }

//     // 3. Add Date range condition
//     if (startDate && endDate) {
//         const startOfDay = new Date(startDate);
//         startOfDay.setHours(0, 0, 0, 0);
        
//         const endOfNextDay = new Date(endDate);
//         endOfNextDay.setDate(endOfNextDay.getDate() + 1);
//         endOfNextDay.setHours(0, 0, 0, 0);

//         conditions.push({
//             createdAt: {
//                 $gte: startOfDay,
//                 $lt: endOfNextDay,
//             }
//         });
//     }

//     // Combine all conditions using $and
//     const finalQuery = conditions.length > 0 ? { $and: conditions } : {};

//     console.log("FINAL QUERY:", JSON.stringify(finalQuery));

//     const totalOrders = await Order.countDocuments(finalQuery);
//     let ordersQuery = Order.find(finalQuery);

//     // Apply skip and limit if not a download request
//     if (download !== 'true') {
//         ordersQuery = ordersQuery.skip(parseInt(skip)).limit(parseInt(limit));
//     }

//     const orders = await ordersQuery
//         .populate('referredBy')
//         .sort({ createdAt: -1 })
//         .allowDiskUse(true);

//     res.status(200).json({
//         message: 'Orders fetched successfully.',
//         orders: orders,
//         totalOrders: totalOrders
//     });
//   } catch (error) {
//     console.error('Error fetching orders:', error);
//     res.status(500).json({
//         message: 'Error fetching orders.',
//         error: error.message,
//     });
//   }
// };

const getOrdersWithFilters = async (req, res) => {
  console.log("REQ QUERY:", req.query);

  try {
    // --- 1. Get Pagination Params from WORKER ---
    // The worker sends 'page' and 'limit'.
    const page = parseInt(req.query.page) || 1;
    // Use the worker's limit (10000) as the default/max
    const limit = parseInt(req.query.limit) || 10000; 
    const skip = (page - 1) * limit; // Calculate skip

    // Get the rest of your filter params
    const { searchQuery, startDate, endDate, referredBy } = req.query;

    // --- 2. Build Conditions (Your logic here was good) ---
    const conditions = [];

    if (referredBy && referredBy !== "none" && referredBy !== "all") {
      conditions.push({ referredBy: new mongoose.Types.ObjectId(referredBy) });
    }

    if (searchQuery) {
      const regex = new RegExp(searchQuery, 'i');
      const doctors = await DoctorDB.find({ name: regex }).select('_id');
      const doctorIds = doctors.map(doc => doc._id);

      const orConditions = [
          { name: regex }, // Search by patient name
          { serialNo: regex } // Search by serial number
      ];

      if (doctorIds.length > 0) {
          orConditions.push({ referredBy: { $in: doctorIds } });
      }
      
      conditions.push({ $or: orConditions });
    }

    if (startDate && endDate) {
      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfNextDay = new Date(endDate);
      endOfNextDay.setDate(endOfNextDay.getDate() + 1);
      endOfNextDay.setHours(0, 0, 0, 0);

      conditions.push({
          createdAt: {
              $gte: startOfDay,
              $lt: endOfNextDay,
          }
      });
    }

    // --- 3. Final Query ---
    const finalQuery = conditions.length > 0 ? { $and: conditions } : {};

    console.log("FINAL QUERY:", JSON.stringify(finalQuery, null, 2));

    // --- 4. Get Total Count (for pagination) ---
    // This MUST use the same filter
    const totalOrders = await Order.countDocuments(finalQuery);

    // --- 5. Get Paginated Orders ---
    // We ALWAYS apply skip and limit. The worker is designed to loop.
    // The 'download' param is no longer needed.
    const orders = await Order.find(finalQuery)
        .populate('referredBy')
        .sort({ createdAt: -1 })
        .skip(skip)   // <-- USE THE CALCULATED SKIP
        .limit(limit)  // <-- USE THE PARSED LIMIT
        .allowDiskUse(true);

    // --- 6. Send Response ---
    // Send back 'totalPages' so the worker knows when to stop!
    res.status(200).json({
        message: 'Orders fetched successfully.',
        orders: orders, // This is the chunk of orders
        totalOrders: totalOrders,
        page: page, // Send back the current page
        totalPages: Math.ceil(totalOrders / limit) // The worker needs this!
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
        message: 'Error fetching orders.',
        error: error.message,
    });
  }
};



module.exports = { 
    PlaceOrder, 
    fetchOrder, 
    fetchPaginatedOrders, 
    fetchAllOrder, 
    EditOrder, 
    DeleteOrder, 
    fetchAllOrdersFromDB, 
    fetchFilteredOrders,
    getTotalOrdersCount,
    getOrdersWithFilters
};