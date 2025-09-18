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
    getOrdersWithFilters,
    // getOrdersForDownload, // New import
    // getSummaryReportForDownload // New import
} = require("../controller/order");

const router = express.Router();

router.post("/placeOrder", PlaceOrder);
router.get("/fetchOrder/:orderId", fetchOrder);
router.get("/fetchAllOrder", fetchAllOrder);
router.put("/orders/:orderId", EditOrder);
router.delete("/orders/:orderId", DeleteOrder);
router.get("/ordersbydate", fetchFilteredOrders);
router.get("/allordersPaginated", fetchPaginatedOrders);
router.get("/orders/count", getTotalOrdersCount);
router.get("/orders/filter", getOrdersWithFilters);

// Updated routes for filtered downloading
// router.get("/orders/download/detailed", getOrdersForDownload);
// router.get("/orders/download/summary", getSummaryReportForDownload);

module.exports = router;