import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ViewDetailsModal from "./Model";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, isValid, addDays } from "date-fns";
import { fetchOrdersWithFilters, updateOrder } from "../store/order";
import { useDispatch, useSelector } from "react-redux";
import ModalEditForm from "./ModalEditForm";
import api from '@/common/axios';
import { DateRangePicker } from "react-date-range";
import { RefreshCcw, ChevronUp, ChevronDown, Calendar, Search } from 'lucide-react';
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

import { useNavigate } from "react-router-dom";
import PrintReportModal from "./PrintReportModal";
import { useModal } from "../context/ModalContext";
import TableScrollContainer from "@/components/ui/TableScrollContainer";

const AdminOrdersPage = () => {
  const { showAlert, showConfirm } = useModal();
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printOrder, setPrintOrder] = useState(null);
  const [printDoctor, setPrintDoctor] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editOrderData, setEditOrderData] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState([
    {
      startDate: null,
      endDate: null,
      key: "selection",
    },
  ]);

  const [doctors, setDoctors] = useState([]);
  const [ordersPerPage, setOrdersPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [goToPageInput, setGoToPageInput] = useState("");

  const { paginatedOrders, totalOrders, loading: ordersLoading } = useSelector((state) => state.order);

  const [selectedOrders, setSelectedOrders] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const totalPages = Math.max(1, Math.ceil(totalOrders / ordersPerPage));

  const fetchOrders = () => {
    const params = {
      skip: (currentPage - 1) * ordersPerPage,
      limit: ordersPerPage,
    };
    if (searchQuery) {
      params.searchQuery = searchQuery;
    }
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    dispatch(fetchOrdersWithFilters(params));
  };

  useEffect(() => {
    fetchOrders();
    const fetchDoctors = async () => {
      try {
        const response = await api.get("/doctors");
        setDoctors(response.data.doctors || []);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      }
    };
    fetchDoctors();
  }, [dispatch, currentPage, ordersPerPage, searchQuery, startDate, endDate]);

  const adjustDate = (dateString, direction) => {
    const initialDate = dateString ? new Date(dateString + 'T00:00:00') : new Date();
    if (!isValid(initialDate)) return dateString;
    const amount = direction === 'increment' ? 1 : -1;
    const newDate = addDays(initialDate, amount);
    return format(newDate, 'yyyy-MM-dd');
  };

  const handleShowDatePicker = () => {
    const sDate = startDate ? new Date(startDate + 'T00:00:00') : null;
    const eDate = endDate ? new Date(endDate + 'T00:00:00') : null;

    setDateRange([
      {
        startDate: isValid(sDate) ? sDate : null,
        endDate: isValid(eDate) ? eDate : null,
        key: "selection",
      },
    ]);
    setShowDatePicker(true);
  };

  const applyDateFilter = () => {
    const { startDate: pickerStartDate, endDate: pickerEndDate } = dateRange[0];
    if (pickerStartDate) setStartDate(format(pickerStartDate, 'yyyy-MM-dd'));
    if (pickerEndDate) setEndDate(format(pickerEndDate, 'yyyy-MM-dd'));
    setShowDatePicker(false);
    setCurrentPage(1);
  };

  const resetDateFilter = () => {
    setStartDate("");
    setEndDate("");
    setDateRange([{ startDate: null, endDate: null, key: 'selection' }]);
    setShowDatePicker(false);
    setCurrentPage(1);
  };

  const handleOrdersPerPageChange = (e) => {
    setOrdersPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleGoToPage = (e) => {
    e.preventDefault();
    const pageNumber = parseInt(goToPageInput, 10);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      setGoToPageInput("");
    }
  };

  const handleEditSubmit = async (formData) => {
    try {
      const orderId = editOrderData._id;
      const updatedData = formData;
      const action = await dispatch(updateOrder({ orderId, updatedData }));
      if (action.type === "order/updateOrder/fulfilled") {
        setEditOrderData(null);
        fetchOrders();
      }
    } catch (error) {
      console.error("Error updating order", error);
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
  };

  const handleEditOrder = (order) => {
    setEditOrderData(order);
  };

  const handleDeleteOrder = async (orderId) => {
    const confirmed = await showConfirm({
      title: 'Delete Order',
      message: 'Are you sure you want to permanently delete this order?',
      type: 'danger'
    });
    if (confirmed) {
      try {
        const response = await api.delete(`/orders/${orderId}`);
        if (response.status === 200 || response.status === 204) {
          showAlert({ title: 'Deleted', message: 'Order deleted successfully!', type: 'success' });
          if (paginatedOrders.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
          } else {
            fetchOrders();
          }
        } else {
          showAlert({ title: 'Error', message: 'Failed to delete the order.', type: 'danger' });
        }
      } catch (error) {
        console.error("Error deleting the order:", error);
        showAlert({ title: 'Error', message: 'Something went wrong while deleting.', type: 'danger' });
      }
    }
  };

  const handleDeleteSelected = async () => {
    const confirmed = await showConfirm({
      title: 'Delete Selected Orders',
      message: `Are you sure you want to delete ${selectedOrders.length} selected orders?`,
      type: 'danger'
    });
    if (confirmed) {
      try {
        await Promise.all(selectedOrders.map(orderId => api.delete(`/orders/${orderId}`)));
        showAlert({ title: 'Deleted', message: 'Selected orders deleted successfully!', type: 'success' });
        if (paginatedOrders.length === selectedOrders.length && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          fetchOrders();
        }
        setSelectedOrders([]);
      } catch (error) {
        console.error("Error deleting selected orders:", error);
        showAlert({ title: 'Error', message: 'Something went wrong while deleting selected orders.', type: 'danger' });
      }
    }
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrders((prevSelectedOrders) => {
      if (prevSelectedOrders.includes(orderId)) {
        return prevSelectedOrders.filter((id) => id !== orderId);
      }
      return [...prevSelectedOrders, orderId];
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(paginatedOrders.map(order => order._id));
    }
  };

  useEffect(() => {
    const allSelected =
      paginatedOrders.length > 0 &&
      paginatedOrders.every((order) => selectedOrders.includes(order._id));
    setSelectAll(allSelected);
  }, [paginatedOrders, selectedOrders]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 mt-16 pb-12">
      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200/80 shadow-xs py-6 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Alter & Manage Reports</h1>
            <p className="text-xs text-slate-500 mt-1">Audit, edit, print, or remove transaction and patient order records</p>
          </div>
          {selectedOrders.length > 0 && (
            <Button
              variant="destructive"
              className="text-xs font-semibold shadow-md"
              onClick={handleDeleteSelected}
            >
              Delete Selected ({selectedOrders.length})
            </Button>
          )}
        </div>
      </div>

      <div className="w-full max-w-full px-4 sm:px-8 py-8 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
            <div className="w-full md:w-96">
              <Input
                type="text"
                placeholder="Search patient, doctor, serial no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="orders-per-page" className="font-semibold text-xs text-slate-600 uppercase tracking-wider">Show:</Label>
                <select
                  id="orders-per-page"
                  value={ordersPerPage}
                  onChange={handleOrdersPerPageChange}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <button
                onClick={resetDateFilter}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all active:scale-95"
              >
                <RefreshCcw className="w-3.5 h-3.5 text-indigo-600" />
                <span>Reset Dates</span>
              </button>
            </div>
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative bg-slate-50/60 p-4 rounded-2xl border border-slate-200/60">
            <div>
              <Label htmlFor="from-date" className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 block">From Date</Label>
              <div className="relative">
                <Input
                  id="from-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pr-8 text-xs"
                />
                <div className="absolute inset-y-0 right-0 flex flex-col justify-center pr-1.5">
                  <button onClick={() => setStartDate(d => adjustDate(d, 'increment'))} className="cursor-pointer h-1/2 hover:bg-slate-200 rounded">
                    <ChevronUp className="h-3.5 w-3.5 text-slate-600" />
                  </button>
                  <button onClick={() => setStartDate(d => adjustDate(d, 'decrement'))} className="cursor-pointer h-1/2 hover:bg-slate-200 rounded">
                    <ChevronDown className="h-3.5 w-3.5 text-slate-600" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="to-date" className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 block">To Date</Label>
              <div className="relative">
                <Input
                  id="to-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pr-8 text-xs"
                />
                <div className="absolute inset-y-0 right-0 flex flex-col justify-center pr-1.5">
                  <button onClick={() => setEndDate(d => adjustDate(d, 'increment'))} className="cursor-pointer h-1/2 hover:bg-slate-200 rounded">
                    <ChevronUp className="h-3.5 w-3.5 text-slate-600" />
                  </button>
                  <button onClick={() => setEndDate(d => adjustDate(d, 'decrement'))} className="cursor-pointer h-1/2 hover:bg-slate-200 rounded">
                    <ChevronDown className="h-3.5 w-3.5 text-slate-600" />
                  </button>
                </div>
              </div>
            </div>

            <div className="sm:col-span-2 flex justify-end">
              <Button onClick={handleShowDatePicker} variant="outline" size="sm" className="text-xs font-semibold">
                <Calendar className="h-3.5 w-3.5 mr-1.5 text-indigo-600" /> Select from Calendar
              </Button>
            </div>

            {showDatePicker && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-3xl p-4 z-30 animate-in fade-in">
                <DateRangePicker
                  editableDateInputs={true}
                  onChange={(item) => setDateRange([item.selection])}
                  moveRangeOnFirstSelection={false}
                  ranges={dateRange}
                  className="text-sm"
                />
                <div className="mt-3 flex gap-2 justify-end">
                  <Button size="sm" variant="default" onClick={applyDateFilter}>Apply</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowDatePicker(false)}>Close</Button>
                </div>
              </div>
            )}
          </div>

          {/* Table Container */}
          <TableScrollContainer>
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                  </th>
                  <th className="py-3.5 px-4">Serial No</th>
                  <th className="py-3.5 px-4">Doctor Ref</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Patient Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">SubCategory</th>
                  <th className="py-3.5 px-4">Placed By</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {ordersLoading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-slate-400 font-medium">
                      Loading order records...
                    </td>
                  </tr>
                ) : paginatedOrders.length > 0 ? (
                  paginatedOrders.map((order) => {
                    const doctor = order.referredBy;
                    return (
                      <tr key={order._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order._id)}
                            onChange={() => handleSelectOrder(order._id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          />
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{order.serialNo}</td>
                        <td className="py-3.5 px-4 font-semibold text-indigo-700">{doctor ? doctor.name : "None"}</td>
                        <td className="py-3.5 px-4 text-slate-500 text-xs">
                          {new Date(order.createdAt).toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{order.name}</td>
                        <td className="py-3.5 px-4">
                          <span className="bg-indigo-50 text-indigo-700 font-semibold text-xs px-2.5 py-1 rounded-full border border-indigo-200/60">
                            {order.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{order.subcategory}</td>
                        <td className="py-3.5 px-4 text-slate-500 text-xs">{order.placedBy || "N/A"}</td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button size="sm" variant="outline" onClick={() => handleViewDetails(order)}>View</Button>
                            <Button size="sm" variant="secondary" onClick={() => handleEditOrder(order)}>Edit</Button>
                            <Button size="sm" variant="success" onClick={() => {
                              setPrintOrder(order);
                              setPrintDoctor(order.referredBy);
                              setShowPrintModal(true);
                            }}>Print</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteOrder(order._id)}>Delete</Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center py-10 text-slate-400 text-sm font-medium">
                      No order records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableScrollContainer>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage === 1}>
                Previous
              </Button>
              <span className="text-xs font-semibold text-slate-600">
                Page <span className="text-slate-900 font-bold">{currentPage}</span> of <span className="text-slate-900 font-bold">{totalPages}</span>
              </span>
              <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage >= totalPages}>
                Next
              </Button>
            </div>
            <form onSubmit={handleGoToPage} className="flex items-center gap-2">
              <Input
                type="number"
                value={goToPageInput}
                onChange={(e) => setGoToPageInput(e.target.value)}
                placeholder="Go to page..."
                min="1"
                max={totalPages}
                className="w-28 text-xs"
              />
              <Button type="submit" variant="secondary" size="sm">Go</Button>
            </form>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedOrder && (
        <ViewDetailsModal
          isOpen={true}
          onClose={() => setSelectedOrder(null)}
          selectedOrder={selectedOrder}
        />
      )}

      {editOrderData && (
        <ModalEditForm
          isOpen={true}
          onClose={() => setEditOrderData(null)}
          onSubmit={handleEditSubmit}
          initialData={editOrderData}
        />
      )}

      {/* Scroll to top button */}
      {showScrollButton && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-11 h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 z-50 text-base font-bold"
        >
          ↑
        </button>
      )}

      {showPrintModal && printOrder && (
        <PrintReportModal
          isOpen={showPrintModal}
          onClose={() => {
            setShowPrintModal(false);
            setPrintOrder(null);
            setPrintDoctor(null);
          }}
          orderDetails={printOrder}
          doctorDetails={printDoctor}
        />
      )}
    </div>
  );
};

export default AdminOrdersPage;