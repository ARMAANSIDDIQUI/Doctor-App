import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrdersWithFilters } from "../../store/order"; 
import { format } from "date-fns";
import { Banknote, CreditCard, Wallet, Calendar } from 'lucide-react';

const Collections = () => {
  const dispatch = useDispatch();
  const [totals, setTotals] = useState({
    cashAmount: 0,
    onlineAmount: 0,
    overallTotal: 0,
  });

  const { paginatedOrders, loading: ordersLoading } = useSelector((state) => state.order);

  useEffect(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0); 

    const filters = {
      startDate: startOfDay.toISOString(),
      endDate: endOfToday.toISOString(), 
      download: true, 
      skip: 0,
      limit: 100000, 
    };

    dispatch(fetchOrdersWithFilters(filters));
  }, [dispatch]);

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
          Fetching daily collection metrics...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 mt-16 py-10 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                {format(new Date(), 'dd MMMM yyyy')}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-2">Daily Revenue Summary</h1>
            <p className="text-xs text-slate-500 mt-1">Real-time breakdown of today's operator collections</p>
          </div>
        </div>

        {/* Collection Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cash Amount */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cash Collection</span>
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Banknote className="h-6 w-6" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                ₹{totals.cashAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Cash payments collected</p>
            </div>
          </div>

          {/* Online Amount */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Online / UPI</span>
              <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CreditCard className="h-6 w-6" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                ₹{totals.onlineAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Digital payments & transfers</p>
            </div>
          </div>

          {/* Overall Total */}
          <div className="bg-gradient-to-br from-indigo-600 to-blue-600 text-white p-6 rounded-3xl shadow-lg shadow-indigo-500/20 flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-indigo-100 uppercase tracking-wider">Gross Total Collection</span>
              <div className="h-12 w-12 rounded-2xl bg-white/20 text-white flex items-center justify-center border border-white/20">
                <Wallet className="h-6 w-6" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black text-white tracking-tight">
                ₹{totals.overallTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </h3>
              <p className="text-xs text-indigo-100 mt-1">Combined total revenue today</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Collections;