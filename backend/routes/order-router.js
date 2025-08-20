const express = require("express");
const {PlaceOrder, fetchOrder,fetchAllOrder, EditOrder,DeleteOrder, fetchFilteredOrders, fetchPaginatedOrders} = require("../controller/order");

const router = express.Router();

router.post("/placeOrder", PlaceOrder);
router.get("/fetchOrder/:orderId", fetchOrder);
router.get("/fetchAllOrder", fetchAllOrder);
router.put("/orders/:orderId", EditOrder);
router.delete("/orders/:orderId", DeleteOrder);
router.get("/ordersbydate", fetchFilteredOrders);

// New route for fetching paginated orders -Armaan Siddiqui
router.get("/allordersPaginated", fetchPaginatedOrders);

module.exports = router;
