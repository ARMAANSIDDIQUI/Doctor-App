import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrdersWithFilters } from "../../store/order"; 
import { format } from "date-fns";

const Collections = () => {
  const dispatch = useDispatch();
  const [totals, setTotals] = useState({
    cashAmount: 0,
    onlineAmount: 0,
    overallTotal: 0,
  });

  // The filtered orders are stored in paginatedOrders in the state
  const { paginatedOrders, loading: ordersLoading } = useSelector((state) => state.order);

  useEffect(() => {
    // Date calculation for the current local day (Today 00:00:00 to Tomorrow 00:00:00)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0); 

    // Prepare the filters object
    const filters = {
      // Send the full, local 24-hour range as ISO strings
      startDate: startOfDay.toISOString(),
      endDate: endOfToday.toISOString(), 
      
      // FIX: Use the 'download' flag AND a large limit to guarantee the backend returns all data.
      // This is necessary to skip pagination for collection totals.
      download: true, 
      skip: 0,
      limit: 100000, 
    };

    // Dispatch the thunk to fetch orders for today from the database
    dispatch(fetchOrdersWithFilters(filters));
  }, [dispatch]);

  useEffect(() => {
    if (paginatedOrders && paginatedOrders.length > 0) {
      let cashAmount = 0;
      let onlineAmount = 0;

      paginatedOrders.forEach((order) => {
          // Robustly ensure values are numbers, defaulting to 0
          const finalPayment = Number(order.finalPayment) || 0;
          const cashSplit = Number(order.cash) || 0;
          const onlineSplit = Number(order.online) || 0;
          
        if (order.paymentMode === "Cash") {
          cashAmount += finalPayment;
        } else if (order.paymentMode === "Online") {
          onlineAmount += finalPayment;
        } else if (order.paymentMode === "Online + Cash") {
          cashAmount += cashSplit;
          onlineAmount += onlineSplit;
        }
      });

      const overallTotal = cashAmount + onlineAmount;
      
      // Use toFixed(2) to mitigate floating point errors and ensure correct currency precision
      setTotals({ 
            cashAmount: Number(cashAmount.toFixed(2)), 
            onlineAmount: Number(onlineAmount.toFixed(2)), 
            overallTotal: Number(overallTotal.toFixed(2)) 
      });
    } else {
      setTotals({ cashAmount: 0, onlineAmount: 0, overallTotal: 0 });
    }
  }, [paginatedOrders]);

  if (ordersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-2xl font-semibold text-gray-700">Loading...</p>
        </div>
       </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold text-center mb-6">Today's Collections ({format(new Date(), 'dd MMM yyyy')})</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cash Amount */}
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-700">Cash Amount</h2>
          <p className="text-4xl font-bold text-green-500 mt-4">
            ₹{totals.cashAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>

        {/* Online Amount */}
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-700">Online Amount</h2>
          <p className="text-4xl font-bold text-blue-500 mt-4">
            ₹{totals.onlineAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>

        {/* Overall Total */}
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-700">Overall Total</h2>
          <p className="text-4xl font-bold text-purple-500 mt-4">
            ₹{totals.overallTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Collections;