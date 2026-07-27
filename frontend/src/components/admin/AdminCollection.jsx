import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrdersWithFilters } from "../../store/order";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { Banknote, CreditCard, Wallet, Calendar, Filter } from 'lucide-react';

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
    const { startDate, endDate } = dateRange[0];

    const normalizedStartDate = new Date(startDate);
    normalizedStartDate.setHours(0, 0, 0, 0);

    const normalizedEndDate = new Date(endDate);
    normalizedEndDate.setDate(normalizedEndDate.getDate() + 1);
    normalizedEndDate.setHours(0, 0, 0, 0);
    
    const filters = {
      startDate: normalizedStartDate.toISOString(),
      endDate: normalizedEndDate.toISOString(),
      skip: 0,
      limit: 100000, 
    };

    dispatch(fetchOrdersWithFilters(filters));
  }, [dispatch, dateRange]); 

  useEffect(() => {
    if (paginatedOrders && paginatedOrders.length > 0) {
      let cashAmount = 0;
      let onlineAmount = 0;

      paginatedOrders.forEach((order) => {
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 mt-16">
        <div className="text-center text-slate-500 font-semibold text-sm">
          Loading revenue collections...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 mt-16 py-10 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Card */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/60">
                Revenue Analytics
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-2">Financial Collections</h1>
            <p className="text-xs text-slate-500 mt-1">Audit cash vs online settlements by date range</p>
          </div>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-95 text-xs"
          >
            <Filter className="h-4 w-4" />
            {showDatePicker ? "Hide Date Selector" : "Select Custom Date Range"}
          </button>
        </div>

        {/* Date Range Picker Modal Container */}
        {showDatePicker && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 flex flex-col items-center justify-center animate-in fade-in">
            <DateRangePicker
              ranges={dateRange}
              onChange={(item) => {
                setDateRange([item.selection]);
                if (item.selection.startDate && item.selection.endDate && item.selection.startDate.getTime() !== item.selection.endDate.getTime()) {
                  setShowDatePicker(false);
                }
              }}
              showSelectionPreview={true}
              moveRangeOnFirstSelection={false}
              months={2}
              direction="horizontal"
            />
            <button
              onClick={() => setShowDatePicker(false)}
              className="mt-4 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
            >
              Close Date Picker
            </button>
          </div>
        )}

        {/* Collection Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cash Revenue</span>
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Banknote className="h-6 w-6" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                ₹{totals.cashAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Total cash transactions</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Online Revenue</span>
              <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CreditCard className="h-6 w-6" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                ₹{totals.onlineAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </h3>
              <p className="text-xs text-slate-400 mt-1">UPI & card transactions</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-blue-600 text-white p-6 rounded-3xl shadow-lg shadow-indigo-500/20 flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-indigo-100 uppercase tracking-wider">Total Collection</span>
              <div className="h-12 w-12 rounded-2xl bg-white/20 text-white flex items-center justify-center border border-white/20">
                <Wallet className="h-6 w-6" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black text-white tracking-tight">
                ₹{totals.overallTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </h3>
              <p className="text-xs text-indigo-100 mt-1">Combined total revenue</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCollection;