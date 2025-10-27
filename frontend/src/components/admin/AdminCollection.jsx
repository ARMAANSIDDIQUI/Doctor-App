import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrdersWithFilters } from "../../store/order";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const AdminCollection = () => {
  const dispatch = useDispatch();
  const [totals, setTotals] = useState({
    cashAmount: 0,
    onlineAmount: 0,
    overallTotal: 0,
  });

  const { paginatedOrders, loading: ordersLoading } = useSelector(
    (state) => state.order
  );

  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);
  const [showDatePicker, setShowDatePicker] = useState(false);

// -----------------------------------------------------------------------------
// --- EFFECT FOR FETCHING DATA (FIXED DATE LOGIC) ---
// -----------------------------------------------------------------------------
  useEffect(() => {
    const { startDate, endDate } = dateRange[0];

    // 1. Normalize START date to midnight of the selected day (Local Time)
    const normalizedStartDate = new Date(startDate);
    normalizedStartDate.setHours(0, 0, 0, 0);

    // 2. Normalize END date to midnight of the DAY AFTER the selected end date.
    const normalizedEndDate = new Date(endDate);
    // Add one day to move it to the next calendar day
    normalizedEndDate.setDate(normalizedEndDate.getDate() + 1);
    // Set time to midnight (00:00:00.000)
    normalizedEndDate.setHours(0, 0, 0, 0);
    
    // Prepare the filters object for the API call
    const filters = {
      // Convert local dates to UTC ISO strings for the server filter
      startDate: normalizedStartDate.toISOString(),
      endDate: normalizedEndDate.toISOString(),
      
      // Use a large limit and set skip to 0 to bypass pagination for totals.
      skip: 0,
      limit: 100000, 
    };

    dispatch(fetchOrdersWithFilters(filters));
  }, [dispatch, dateRange]); 

// -----------------------------------------------------------------------------
// --- EFFECT FOR CALCULATING TOTALS (ROBUSTNESS & PRECISION) ---
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// --- RENDER ---
// -----------------------------------------------------------------------------
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
      <h1 className="text-2xl font-bold text-center mb-6">Collections</h1>

      <div className="flex flex-col items-center mb-6">
        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4 shadow-md transition duration-300"
        >
          {showDatePicker ? "Hide Date Picker" : "Select Date Range"}
        </button>
        {showDatePicker && (
          <div className="bg-white shadow-lg rounded-lg p-4 z-10 absolute mt-2">
            <DateRangePicker
              ranges={dateRange}
              onChange={(item) => {
                  setDateRange([item.selection]);
                  // FIX: If both dates are set (or it's a single day selection), close the picker.
                  const { startDate, endDate } = item.selection;
                  if (startDate && endDate) {
                      // Check if the selection is complete (only true for single select if start=end)
                      const selectionComplete = startDate.getTime() === endDate.getTime();

                      // If the selection is a single day, or the second day is selected in a range, close it.
                      if (item.selection.hasOwnProperty('endDate')) {  // Check if the selection property exists
                            setShowDatePicker(false);
                      }
                  }
              }}
              showSelectionPreview={true}
              moveRangeOnFirstSelection={false}
              months={2}
              direction="horizontal"
            />
          </div>
        )}
      </div>

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

export default AdminCollection;