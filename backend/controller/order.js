const Counter = require('../Model/Counter');
const Order = require('../Model/Order');
const DoctorDB = require('../Model/Doctor');
const mongoose = require('mongoose');

const PlaceOrder = async (req, res) => {
    try {
        const {
            name, age, gender, address, phoneNo, category, subcategory,
            fees, discount = 0, finalPayment, paymentMode, referralFee, placedBy,
            online = 0, cash = 0,
        } = req.body;

        // Use the value from the request body which may be an ID string, 'none', or null/undefined
        const referredByFromRequest = req.body.referredBy;
        let referredByDoctorId = null;

        // --- STEP 1: RESOLVE THE REFERRED BY ID ---
        const NONE_DOCTOR_NAME = 'None';
        let noneDoctor = await DoctorDB.findOne({ name: /^None$/i });

        if (!noneDoctor) {
            console.log(`Creating placeholder doctor: ${NONE_DOCTOR_NAME}`);
            noneDoctor = await DoctorDB.create({
                name: NONE_DOCTOR_NAME,
                phoneNo: 0,
                address: 'N/A',
                referralFee: 0,
                totalCommission: 0,
            });
        }

        // Determine the final doctor ID:
        if (!referredByFromRequest || String(referredByFromRequest).toLowerCase() === 'none' || String(referredByFromRequest) === '0') {
            referredByDoctorId = noneDoctor._id;
        } else if (mongoose.Types.ObjectId.isValid(referredByFromRequest)) {
            referredByDoctorId = new mongoose.Types.ObjectId(referredByFromRequest);
        } else {
            referredByDoctorId = noneDoctor._id;
            console.warn(`Invalid non-ObjectId referredBy value received: ${referredByFromRequest}. Assigning to 'None'.`);
        }

        // --- STEP 2: GENERATE SERIAL NUMBER ATOMICALLY ---
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const yearStr = today.getFullYear();
        const todayString = `${day}${month}${yearStr}`;

        const counter = await Counter.findOneAndUpdate(
            { date: todayString },
            { $inc: { count: 1 } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const serialNo = `${todayString}${String(counter.count).padStart(2, '0')}`;

        // --- STEP 3: UPDATE COMMISSION (Only if NOT the 'None' Doctor) ---
        const commission = referralFee - discount;

        if (commission > 0 && String(referredByDoctorId) !== String(noneDoctor._id)) {
            const doctor = await DoctorDB.findById(referredByDoctorId);
            if (doctor) {
                doctor.totalCommission = (doctor.totalCommission || 0) + commission;
                await doctor.save();
            } else {
                console.warn(`Doctor ID ${referredByDoctorId} not found. Commission skipped.`);
            }
        }

        // --- STEP 4: CREATE AND SAVE ORDER ---
        const newOrder = new Order({
            serialNo,
            name,
            age,
            gender,
            address,
            phoneNo,
            referredBy: referredByDoctorId,
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
        });

        const savedOrder = await newOrder.save();

        res.status(201).json({
            message: 'Order placed successfully',
            order: savedOrder,
        });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({
            message: 'Error placing order',
            error: error.message,
        });
    }
};

const fetchOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId).populate('referredBy');

        if (!order) {
            return res.status(404).json({
                message: 'Order not found',
            });
        }

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
        const orders = await Order.find().populate('referredBy').sort({ createdAt: -1 });

        if (orders.length === 0) {
            return res.status(404).json({
                message: 'No orders found',
            });
        }

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

const EditOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const updateData = req.body;

        const existingOrder = await Order.findById(orderId);
        if (!existingOrder) {
            return res.status(404).json({
                message: 'Order not found',
            });
        }

        // Adjust doctor commission if discount changed
        const noneDoctor = await DoctorDB.findOne({ name: /^None$/i });
        const isNone = noneDoctor && String(existingOrder.referredBy) === String(noneDoctor._id);
        const isReferredByValid = existingOrder.referredBy && !isNone && String(existingOrder.referredBy).toLowerCase() !== 'none';

        if (isReferredByValid && 'discount' in updateData && updateData.discount !== existingOrder.discount) {
            const doctor = await DoctorDB.findById(existingOrder.referredBy);
            if (doctor) {
                const oldCommission = Math.max(0, (existingOrder.referralFee || 0) - (existingOrder.discount || 0));
                const newCommission = Math.max(0, (existingOrder.referralFee || 0) - (updateData.discount || 0));
                doctor.totalCommission = Math.max(0, (doctor.totalCommission || 0) + (newCommission - oldCommission));
                await doctor.save();
            }
        }

        // Update the order with new data
        const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, {
            new: true,
            runValidators: true,
        });

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
        const { orderId } = req.params;

        const orderToDelete = await Order.findById(orderId);
        if (!orderToDelete) {
            return res.status(404).json({
                message: 'Order not found',
            });
        }

        // Revert doctor commission upon deleting the order
        if (orderToDelete.referredBy) {
            const noneDoctor = await DoctorDB.findOne({ name: /^None$/i });
            const isNone = noneDoctor && String(orderToDelete.referredBy) === String(noneDoctor._id);
            if (!isNone && String(orderToDelete.referredBy).toLowerCase() !== 'none') {
                const commission = (orderToDelete.referralFee || 0) - (orderToDelete.discount || 0);
                if (commission > 0) {
                    const doctor = await DoctorDB.findById(orderToDelete.referredBy);
                    if (doctor) {
                        doctor.totalCommission = Math.max(0, (doctor.totalCommission || 0) - commission);
                        await doctor.save();
                    }
                }
            }
        }

        await Order.findByIdAndDelete(orderId);

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

const fetchPaginatedOrders = async (req, res) => {
    try {
        const skip = parseInt(req.query.skip) || 0;
        const limit = parseInt(req.query.limit) || 100;

        const totalOrders = await Order.countDocuments();
        const orders = await Order.find()
            .populate('referredBy')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Orders fetched successfully with pagination.',
            orders,
            totalOrders,
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
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const orders = await Order.find({
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        });

        return orders;
    } catch (error) {
        console.error('Error fetching all orders:', error);
        throw error;
    }
};

const fetchFilteredOrders = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                message: 'Please provide both startDate and endDate in the query parameters.',
            });
        }

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const orders = await Order.find({
            createdAt: {
                $gte: start,
                $lte: end,
            },
        }).populate('referredBy').sort({ createdAt: -1 });

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

const getTotalOrdersCount = async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();

        res.status(200).json({
            message: 'Total order count fetched successfully.',
            totalOrders,
        });
    } catch (error) {
        console.error('Error fetching total order count:', error);
        res.status(500).json({
            message: 'Error fetching total order count.',
            error: error.message,
        });
    }
};

const getOrdersWithFilters = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10000;
        let skip;
        let page;

        if (req.query.skip !== undefined) {
            skip = parseInt(req.query.skip) || 0;
            page = Math.floor(skip / limit) + 1;
        } else {
            page = parseInt(req.query.page) || 1;
            skip = (page - 1) * limit;
        }

        const { searchQuery, startDate, endDate, referredBy } = req.query;

        const conditions = [];

        // 1. Doctor filter (supports both ObjectId and string matches)
        if (referredBy && referredBy !== 'none' && referredBy !== 'all') {
            const matchIds = [referredBy, String(referredBy)];
            if (mongoose.Types.ObjectId.isValid(referredBy)) {
                matchIds.push(new mongoose.Types.ObjectId(referredBy));
            }
            conditions.push({ referredBy: { $in: matchIds } });
        }

        // 2. Search query conditions (patient name, serialNo, doctor name)
        if (searchQuery) {
            const regex = new RegExp(searchQuery, 'i');
            const doctors = await DoctorDB.find({ name: regex }).select('_id');
            const doctorIds = doctors.map((doc) => doc._id);

            const orConditions = [
                { name: regex },
                { serialNo: regex },
            ];

            if (doctorIds.length > 0) {
                orConditions.push({ referredBy: { $in: doctorIds } });
            }

            conditions.push({ $or: orConditions });
        }

        // 3. Date range conditions
        if (startDate && endDate) {
            const startOfDay = new Date(startDate);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);

            conditions.push({
                createdAt: {
                    $gte: startOfDay,
                    $lte: endOfDay,
                },
            });
        }

        const finalQuery = conditions.length > 0 ? { $and: conditions } : {};

        const totalOrders = await Order.countDocuments(finalQuery);

        const orders = await Order.find(finalQuery)
            .populate('referredBy')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .allowDiskUse(true);

        res.status(200).json({
            message: 'Orders fetched successfully.',
            orders,
            totalOrders,
            page,
            totalPages: Math.max(1, Math.ceil(totalOrders / limit)),
        });
    } catch (error) {
        console.error('Error fetching filtered orders:', error);
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
    getOrdersWithFilters,
};
