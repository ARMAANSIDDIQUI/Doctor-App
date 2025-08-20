import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Modal from "./model";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { fetchPaginatedOrders, updateOrder } from "../store/order"; // Updated thunk import
import { useDispatch, useSelector } from "react-redux";
import ModalEditForm from "./ModalEditForm";
import api from '@/common/axios';
import { DateRangePicker } from "react-date-range";
import { enGB } from "date-fns/locale";

// imports for print report button navigation - Armaan Siddiqui
import { useNavigate } from "react-router-dom";
import PrintReportModal from "./PrintReportModal";

const AdminOrdersPage = () => {
  // Added hooks for print modal- Armaan Siddiqui
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printOrder, setPrintOrder] = useState(null);
  const [printDoctor, setPrintDoctor] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showDateRange, setShowDateRange] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editOrderData, setEditOrderData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [doctors, setDoctors] = useState([]);
  
  // New state for pagination-Armaan Siddiqui
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 100;

  // Get paginated orders and total count from Redux store
  const { paginatedOrders, totalOrders, loading: ordersLoading } = useSelector((state) => state.order);
  
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    key: "selection",
  });
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [filterApplied, setFilterApplied] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  // Calculate total pages based on the total count from the server-Armaan Siddiqui
  const totalPages = Math.ceil(totalOrders / ordersPerPage);

  const resetDateFilter = () => {
    setSelectedDateRange({
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    });
    setFilterApplied(false);
    setShowDateRange(false);
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await api.get("/doctors");
        setDoctors(response.data.doctors || []);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      }
    };

    // Dispatch the paginated thunk on initial load and when currentPage changes-Armaan Siddiqui
    dispatch(fetchPaginatedOrders({ 
      skip: (currentPage - 1) * ordersPerPage, 
      limit: ordersPerPage 
    }));
    fetchDoctors();
  }, [dispatch, currentPage]);

  const handleToggleDateRange = () => {
    setShowDateRange((prevState) => !prevState);
  };

  useEffect(() => {
    console.log("Updated editOrderData", editOrderData);
  }, [editOrderData]);

  const handleEditSubmit = async (formData) => {
    try {
      const orderId = editOrderData._id;
      const updatedData = formData;

      const action = await dispatch(updateOrder({ orderId, updatedData }));

      if (action.type === "order/updateOrder/fulfilled") {
        console.log("Order updated successfully", action.payload);
        setEditOrderData(null);
        // Re-fetch the orders to ensure data consistency after an update
        dispatch(fetchPaginatedOrders({ 
          skip: (currentPage - 1) * ordersPerPage, 
          limit: ordersPerPage 
        }));
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
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        const response = await api.delete(`/orders/${orderId}`);
        if (response.status === 200 || response.status === 204) {
          window.alert("Order deleted successfully!");
          // Re-fetch the orders after deletion
          dispatch(fetchPaginatedOrders({ 
            skip: (currentPage - 1) * ordersPerPage, 
            limit: ordersPerPage 
          }));
        } else {
          window.alert("Failed to delete the order.");
        }
      } catch (error) {
        console.error("Error deleting the order:", error);
        window.alert("Something went wrong while deleting.");
      }
    }
  };
  
  const handleDeleteSelected = async () => {
    if (window.confirm("Are you sure you want to delete the selected orders?")) {
      try {
        await Promise.all(selectedOrders.map(orderId => api.delete(`/orders/${orderId}`)));
        window.alert("Selected orders deleted successfully!");
        setSelectedOrders([]);
        dispatch(fetchPaginatedOrders({ 
          skip: (currentPage - 1) * ordersPerPage, 
          limit: ordersPerPage 
        }));
      } catch (error) {
        console.error("Error deleting selected orders:", error);
        window.alert("Something went wrong while deleting selected orders.");
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

  const handleApplyFilter = () => {
    setFilterApplied(true);
    setShowDateRange(false);
  };

  const filteredOrders = paginatedOrders
    .filter((order) => {
      const doctor = doctors.find((doctor) => doctor._id === order.referredBy);
      return (
        order.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doctor && doctor.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        order.serialNo.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .filter((order) => {
      if (filterApplied) {
        const orderDate = new Date(order.createdAt);
        return (
          orderDate >= selectedDateRange.startDate && orderDate <= selectedDateRange.endDate
        );
      }
      return true;
    });

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(order => order._id));
    }
  };

  useEffect(() => {
    const allSelected =
      filteredOrders.length > 0 &&
      filteredOrders.every((order) => selectedOrders.includes(order._id));
    setSelectAll(allSelected);
  }, [filteredOrders, selectedOrders]);


  // Helper FUnctions-Armaan Siddiqui
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prevPage => prevPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prevPage => prevPage - 1);
    }
  };

  return (
    <div className="flex flex-col p-2 sm:p-8 space-y-4 sm:space-y-8 mt-16 bg-gray-50 min-h-screen">
      <div className="w-full max-w-full bg-white shadow-lg rounded-lg p-3 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4 sm:mb-6">Alter Report</h1>

        {/* Search and Controls - Made Responsive */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-4">
          <Input
            type="text"
            placeholder="Search by name, doctor, or serial no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date Range Controls - Made Responsive */}
        <div className="mb-4">
          <Button
            onClick={handleToggleDateRange}
            className="w-full sm:w-auto bg-blue-600 text-white mb-4 sm:mb-6"
          >
            {showDateRange ? "Hide Date Range Filter" : "Show Date Range Filter"}
          </Button>
        </div>

        {showDateRange && (
          <div className="mb-4 sm:mb-6">
            <div className="w-full overflow-x-auto">
              <DateRangePicker
                ranges={[selectedDateRange]}
                onChange={(item) => {
                  const startDate = item.selection.startDate;
                  const endDate = item.selection.endDate;
                  const normalizedStartDate = new Date(startDate).setHours(0, 0, 0, 0);
                  const normalizedEndDate = new Date(endDate).setHours(23, 59, 59, 999);
                  setSelectedDateRange({
                    startDate: new Date(normalizedStartDate),
                    endDate: new Date(normalizedEndDate),
                    key: "selection",
                  });
                }}
                locale={enGB}
                className="max-w-full"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4">
              <Button
                onClick={handleApplyFilter}
                className="w-full sm:w-auto bg-green-600 text-white"
              >
                Apply Filter
              </Button>
              <Button
                onClick={resetDateFilter}
                className="w-full sm:w-auto bg-red-600 text-white"
              >
                Remove Filter
              </Button>
            </div>
          </div>
        )}

        {/* Delete Selected Orders Button */}
        {selectedOrders.length > 0 && (
          <div className="mt-4 mb-4">
            <Button
              className="w-full sm:w-auto bg-red-600 text-white"
              onClick={handleDeleteSelected}
            >
              Delete Selected Orders ({selectedOrders.length})
            </Button>
          </div>
        )}

        {/* Responsive Table Container */}
        <div className="w-full overflow-x-auto shadow-md rounded-lg">
          <div className="min-w-max">
            <table className="w-full table-auto border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="border p-2 text-left whitespace-nowrap">
                    Select{' '}
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                  </th>
                  <th className="border p-2 text-left whitespace-nowrap">Serial No</th>
                  <th className="border p-2 text-left whitespace-nowrap">Doctor Ref</th>
                  <th className="border p-2 text-left whitespace-nowrap">Date</th>
                  <th className="border p-2 text-left whitespace-nowrap">Patient Name</th>
                  <th className="border p-2 text-left whitespace-nowrap">Category</th>
                  <th className="border p-2 text-left whitespace-nowrap">SubCategory</th>
                  <th className="border p-2 text-left whitespace-nowrap">Placed By</th>
                  <th className="border p-2 text-left whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {ordersLoading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4 text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => {
                    const doctor = doctors.find((doctor) => doctor._id === order.referredBy);
                    return (
                      <tr key={order._id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="border p-2 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order._id)}
                            onChange={() => handleSelectOrder(order._id)}
                          />
                        </td>
                        <td className="border p-2 whitespace-nowrap">{order.serialNo}</td>
                        <td className="border p-2 whitespace-nowrap">{doctor ? doctor.name : "None"}</td>
                        <td className="border p-2 whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString('en-GB')}
                        </td>
                        <td className="border p-2 whitespace-nowrap">{order.name}</td>
                        <td className="border p-2 whitespace-nowrap">{order.category}</td>
                        <td className="border p-2 whitespace-nowrap">{order.subcategory}</td>
                        <td className="border p-2 whitespace-nowrap">{order.placedBy || "N/A"}</td>
                        <td className="border p-2">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button 
                              className="w-full sm:w-auto"
                              onClick={() => handleViewDetails(order)}
                            >
                              View
                            </Button>
                            <Button 
                              className="w-full sm:w-auto"
                              onClick={() => handleEditOrder(order)}
                            >
                              Edit
                            </Button>

                            {/* Print report button - Armaan Siddiui */}
                            <Button
                              className="w-full sm:w-auto bg-green-600 text-white"
                              onClick={() => {
                                setPrintOrder(order);
                                setPrintDoctor(doctors.find((doc) => doc._id === order.referredBy));
                                setShowPrintModal(true);
                              }}
                            >
                              Print
                            </Button>
                            <Button
                              className="w-full sm:w-auto bg-red-600 text-white"
                              onClick={() => handleDeleteOrder(order._id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-4 text-gray-500">
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Pagination Controls -Armaan Siddiqui*/}
        <div className="flex justify-evenly items-center mt-6">
          <Button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="bg-gray-300 text-gray-800 disabled:opacity-50"
          >
            Previous
          </Button>
          <span>Page {currentPage} of {totalPages}</span>
          <Button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="bg-gray-300 text-gray-800 disabled:opacity-50"
          >
            Next
          </Button>
        </div>
      </div>

      {/* Modals */}
      {selectedOrder && (
        <Modal
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
      <button
        onClick={scrollToTop}
        className="fixed bottom-4 right-4 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition transform hover:scale-105 z-50"
        style={{ display: showScrollButton ? 'block' : 'none' }}
      >
        ↑
      </button>
      
      {/* Added print modal - Armaan Siddiqui*/}
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
