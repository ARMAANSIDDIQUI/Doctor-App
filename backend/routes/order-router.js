const express = require("express");
const {
    PlaceOrder,
    fetchOrder,
    fetchAllOrder,
    EditOrder,
    DeleteOrder,
    fetchFilteredOrders,
    fetchPaginatedOrders,
    getTotalOrdersCount,
    getOrdersWithFilters // Import the new function
} = require("../controller/order");

const router = express.Router();

router.post("/placeOrder", PlaceOrder);
router.get("/fetchOrder/:orderId", fetchOrder);
router.get("/fetchAllOrder", fetchAllOrder);
router.put("/orders/:orderId", EditOrder);
router.delete("/orders/:orderId", DeleteOrder);
router.get("/ordersbydate", fetchFilteredOrders);
router.get("/allordersPaginated", fetchPaginatedOrders);

//New route to get the total count of all orders-Armaan Siddiqui
router.get("/orders/count", getTotalOrdersCount);
//New route to allow pagination and filter of orders-Armaan Siddiqui
router.get("/orders/filter", getOrdersWithFilters);

module.exports = router;