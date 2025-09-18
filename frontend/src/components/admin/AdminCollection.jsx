// import React, { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchAllOrders } from "../../store/order";
// import { DateRangePicker } from "react-date-range"; // Import DateRangePicker
// import "react-date-range/dist/styles.css"; // Main style file
// import "react-date-range/dist/theme/default.css"; // Theme css file

// const AdminCollection = () => {
//   const dispatch = useDispatch();
//   const [totals, setTotals] = useState({
//     cashAmount: 0,
//     onlineAmount: 0,
//     overallTotal: 0,
//   });

//   const { allOrders, loading: ordersLoading } = useSelector((state) => state.order);

//   const [dateRange, setDateRange] = useState([
//     {
//       startDate: new Date(),
//       endDate: new Date(),
//       key: "selection",
//     },
//   ]);
//   const [showDatePicker, setShowDatePicker] = useState(false); // Toggle state

//   useEffect(() => {
//     // Fetch all orders on component mount
//     dispatch(fetchAllOrders());
//   }, [dispatch]);

//   useEffect(() => {
//     if (allOrders && allOrders.length > 0) {
//       const { startDate, endDate } = dateRange[0];
//       const normalizedStartDate = new Date(startDate).setHours(0, 0, 0, 0);
//       const normalizedEndDate = new Date(endDate).setHours(23, 59, 59, 999);

//       const filteredOrders = allOrders.filter((order) => {
//         const orderDate = new Date(order.createdAt).getTime();
//         return orderDate >= normalizedStartDate && orderDate <= normalizedEndDate;
//       });

//       // Calculate totals
//       //Changes Calculate total logic for handling split(Online + Cash)-Armaan Siddiqui
//       if (filteredOrders.length > 0) {
//         let cashAmount = 0;
//         let onlineAmount = 0;

//         filteredOrders.forEach((order) => {
//           if (order.paymentMode === "Cash") {
//             cashAmount += order.finalPayment;
//           } else if (order.paymentMode === "Online") {
//             onlineAmount += order.finalPayment;
//           } else if (order.paymentMode === "Online + Cash") {
//             cashAmount += order.cash ?? 0;
//             onlineAmount += order.online ?? 0;
//           }
//         });
//         const overallTotal = cashAmount + onlineAmount;

//         setTotals({ cashAmount, onlineAmount, overallTotal });
//       } else {
//         setTotals({ cashAmount: 0, onlineAmount: 0, overallTotal: 0 });
//       }
//     } else {
//       setTotals({ cashAmount: 0, onlineAmount: 0, overallTotal: 0 });
//     }
//   }, [allOrders, dateRange]);

//   if (ordersLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-100">
//         <div className="text-center">
//           <p className="text-2xl font-semibold text-gray-700">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-100 p-8">
//       <h1 className="text-2xl font-bold text-center mb-6">Collections</h1>

//       <div className="flex flex-col items-center mb-6">
//         <button
//           onClick={() => setShowDatePicker(!showDatePicker)}
//           className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4 shadow-md transition duration-300"
//         >
//           {showDatePicker ? "Hide Date Picker" : "Select Date Range"}
//         </button>
//         {showDatePicker && (
//           <div className="bg-white shadow-lg rounded-lg p-4">
//             <DateRangePicker
//               ranges={dateRange}
//               onChange={(item) => setDateRange([item.selection])}
//               showSelectionPreview={true}
//               moveRangeOnFirstSelection={false}
//               months={2}
//               direction="horizontal"
//             />
//           </div>
//         )}
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         {/* Cash Amount */}
//         <div className="bg-white shadow-md rounded-lg p-6 text-center">
//           <h2 className="text-xl font-semibold text-gray-700">Cash Amount</h2>
//           <p className="text-4xl font-bold text-green-500 mt-4">
//             ₹{totals.cashAmount}
//           </p>
//         </div>

//         {/* Online Amount */}
//         <div className="bg-white shadow-md rounded-lg p-6 text-center">
//           <h2 className="text-xl font-semibold text-gray-700">Online Amount</h2>
//           <p className="text-4xl font-bold text-blue-500 mt-4">
//             ₹{totals.onlineAmount}
//           </p>
//         </div>

//         {/* Overall Total */}
//         <div className="bg-white shadow-md rounded-lg p-6 text-center">
//           <h2 className="text-xl font-semibold text-gray-700">Overall Total</h2>
//           <p className="text-4xl font-bold text-purple-500 mt-4">
//             ₹{totals.overallTotal}
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AdminCollection;




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

  useEffect(() => {
    // This effect now triggers a server-side fetch whenever the date range changes.
    const { startDate, endDate } = dateRange[0];

    // Normalize dates to ensure the entire day is included
    const normalizedStartDate = new Date(startDate);
    normalizedStartDate.setHours(0, 0, 0, 0);
    const normalizedEndDate = new Date(endDate);
    normalizedEndDate.setHours(23, 59, 59, 999);

    // Prepare the filters object for the API call
    const filters = {
      startDate: normalizedStartDate.toISOString(),
      endDate: normalizedEndDate.toISOString(),
      // Use the 'download' flag to get all orders for the selected date range
      // without pagination. This assumes your backend handles this flag correctly.
      download: true,
    };

    dispatch(fetchOrdersWithFilters(filters));
  }, [dispatch, dateRange]); // Dependency array includes dateRange

  useEffect(() => {
    // This effect calculates totals based on the fetched data
    if (paginatedOrders && paginatedOrders.length > 0) {
      let cashAmount = 0;
      let onlineAmount = 0;

      paginatedOrders.forEach((order) => {
        if (order.paymentMode === "Cash") {
          cashAmount += order.finalPayment;
        } else if (order.paymentMode === "Online") {
          onlineAmount += order.finalPayment;
        } else if (order.paymentMode === "Online + Cash") {
          cashAmount += order.cash ?? 0;
          onlineAmount += order.online ?? 0;
        }
      });

      const overallTotal = cashAmount + onlineAmount;
      setTotals({ cashAmount, onlineAmount, overallTotal });
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
      <h1 className="text-2xl font-bold text-center mb-6">Collections</h1>

      <div className="flex flex-col items-center mb-6">
        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4 shadow-md transition duration-300"
        >
          {showDatePicker ? "Hide Date Picker" : "Select Date Range"}
        </button>
        {showDatePicker && (
          <div className="bg-white shadow-lg rounded-lg p-4">
            <DateRangePicker
              ranges={dateRange}
              onChange={(item) => setDateRange([item.selection])}
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
            ₹{totals.cashAmount}
          </p>
        </div>

        {/* Online Amount */}
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-700">Online Amount</h2>
          <p className="text-4xl font-bold text-blue-500 mt-4">
            ₹{totals.onlineAmount}
          </p>
        </div>

        {/* Overall Total */}
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-700">Overall Total</h2>
          <p className="text-4xl font-bold text-purple-500 mt-4">
            ₹{totals.overallTotal}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminCollection;