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
import { enGB } from "date-fns/locale";
import { RefreshCcw, ChevronUp, ChevronDown } from 'lucide-react';
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

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
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [editOrderData, setEditOrderData] = useState(null);

    // State for search and date range filters-Armaan Siddiqui
    const [searchQuery, setSearchQuery] = useState("");
    
    // Updated date states to match MonthlyReport component
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

    // Pagination states
    const [ordersPerPage, setOrdersPerPage] = useState(50);
    const [currentPage, setCurrentPage] = useState(1);
    const [goToPageInput, setGoToPageInput] = useState(""); // State for "Go to Page" input

    // Get paginated orders and total count from Redux store
    const { paginatedOrders, totalOrders, loading: ordersLoading } = useSelector((state) => state.order);

    const [selectedOrders, setSelectedOrders] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    const totalPages = Math.max(1, Math.ceil(totalOrders / ordersPerPage));

    // Centralized fetching logic
    const fetchOrders = () => {
        const params = {
            skip: (currentPage - 1) * ordersPerPage,
            limit: ordersPerPage,
        };
        // Conditionally add searchQuery
        if (searchQuery) {
            params.searchQuery = searchQuery;
        }
        // Conditionally add date filters
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


    // Function to adjust date
    const adjustDate = (dateString, direction) => {
        const initialDate = dateString ? new Date(dateString) : new Date();
        if (!isValid(initialDate)) {
            return dateString;
        }
        const amount = direction === 'increment' ? 1 : -1;
        const newDate = addDays(initialDate, amount);
        return format(newDate, 'yyyy-MM-dd');
    };
    
    // Function to show date picker
    const handleShowDatePicker = () => {
        const sDate = new Date(startDate);
        const eDate = new Date(endDate);
        setDateRange([
            {
                startDate: isValid(sDate) ? sDate : null,
                endDate: isValid(eDate) ? eDate : null,
                key: "selection",
            },
        ]);
        setShowDatePicker(true);
    };

    // Function to apply date filter from picker
    const applyDateFilter = () => {
        const { startDate: pickerStartDate, endDate: pickerEndDate } = dateRange[0];
        if (pickerStartDate) setStartDate(format(pickerStartDate, 'yyyy-MM-dd'));
        if (pickerEndDate) setEndDate(format(pickerEndDate, 'yyyy-MM-dd'));
        setShowDatePicker(false);
        setCurrentPage(1); // Reset to first page
    };

    // Function to reset date filter
    const resetDateFilter = () => {
        setStartDate("");
        setEndDate("");
        setDateRange([{ startDate: null, endDate: null, key: 'selection' }]);
        setShowDatePicker(false);
        setCurrentPage(1); // Reset to first page
    };

    const handleOrdersPerPageChange = (e) => {
        setOrdersPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    // The handler for when the ModalEditForm submits.
    const handleEditSubmit = async (formData) => {
        try {
            // The orderId is taken from the state that opened the modal.
            const orderId = editOrderData._id;
            const updatedData = formData;

            // This is the correct Redux action for updating.
            const action = await dispatch(updateOrder({ orderId, updatedData }));

            if (action.type === "order/updateOrder/fulfilled") {
                console.log("Order updated successfully", action.payload);
                setEditOrderData(null); // Close the modal
                fetchOrders(); // Re-fetch the orders to display the latest data
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
                    // Check if the current page will become empty
                    if (paginatedOrders.length === 1 && currentPage > 1) {
                        // If it's the last item on a page that's not the first page, go back one page
                        setCurrentPage(currentPage - 1);
                    } else {
                        // Otherwise, just refetch the data for the current page
                        fetchOrders();
                    }
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

                // Check if all items on the current page are being deleted
                if (paginatedOrders.length === selectedOrders.length && currentPage > 1) {
                    // Go back one page
                    setCurrentPage(currentPage - 1);
                } else {
                    // Otherwise, refetch the current page
                    fetchOrders();
                }

                // It's good practice to clear the selection state
                setSelectedOrders([]);
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

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

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

    // Handler for "Go to Page" form submission
    const handleGoToPage = (e) => {
        e.preventDefault();
        const pageNumber = Number(goToPageInput);
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
            setGoToPageInput("");
        } else {
            alert(`Please enter a valid page number between 1 and ${totalPages}`);
        }
    };

    return (
        <div className="flex flex-col p-2 sm:p-8 space-y-4 sm:space-y-8 mt-16 bg-gray-50 min-h-screen">
            <div className="w-full max-w-full bg-white shadow-lg rounded-lg p-3 sm:p-6">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4 sm:mb-6">Alter Report</h1>

                {/* Search and Controls - Made Responsive */}
                <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-4 items-center">
                    <Input
                        type="text"
                        placeholder="Search by name, doctor, or serial no..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {/* Dropdown for items per page (Moved to top) -Armaan Siddiqui*/}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Label htmlFor="orders-per-page" className="font-medium whitespace-nowrap">Show:</Label>
                        <select
                            id="orders-per-page"
                            value={ordersPerPage}
                            onChange={handleOrdersPerPageChange}
                            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                </div>
                 
                {/* --- MODIFIED: Date input section with combined UI --- */}
                <div className="mb-4 sm:mb-6 relative">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                            <Label htmlFor="from-date" className="text-sm font-medium text-gray-700">From Date</Label>
                            <div className="relative">
                                <Input
                                    id="from-date"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="p-2 w-full pr-8"
                                />
                                <div className="absolute inset-y-0 right-0 flex flex-col justify-center pr-2">
                                    <button onClick={() => setStartDate(d => adjustDate(d, 'increment'))} className="cursor-pointer h-1/2 hover:bg-gray-100 rounded-tr-md">
                                        <ChevronUp className="h-4 w-4 text-gray-600" />
                                    </button>
                                    <button onClick={() => setStartDate(d => adjustDate(d, 'decrement'))} className="cursor-pointer h-1/2 hover:bg-gray-100 rounded-br-md">
                                        <ChevronDown className="h-4 w-4 text-gray-600" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="to-date" className="text-sm font-medium text-gray-700">To Date</Label>
                            <div className="relative">
                                <Input
                                    id="to-date"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="p-2 w-full pr-8"
                                />
                                <div className="absolute inset-y-0 right-0 flex flex-col justify-center pr-2">
                                    <button onClick={() => setEndDate(d => adjustDate(d, 'increment'))} className="cursor-pointer h-1/2 hover:bg-gray-100 rounded-tr-md">
                                        <ChevronUp className="h-4 w-4 text-gray-600" />
                                    </button>
                                    <button onClick={() => setEndDate(d => adjustDate(d, 'decrement'))} className="cursor-pointer h-1/2 hover:bg-gray-100 rounded-br-md">
                                        <ChevronDown className="h-4 w-4 text-gray-600" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                        <Button onClick={handleShowDatePicker} className="w-full bg-blue-600 text-white hover:bg-blue-700">
                             Select from Calendar
                        </Button>
                        <Button onClick={resetDateFilter} className="w-full bg-red-600 text-white hover:bg-red-700">
                             Remove Filter
                        </Button>
                    </div>
                    {showDatePicker && (
                        <div className="absolute top-full mt-2 bg-white border border-gray-300 shadow-lg rounded-lg p-2 z-30">
                            <DateRangePicker
                                editableDateInputs={true}
                                onChange={(item) => setDateRange([item.selection])}
                                moveRangeOnFirstSelection={false}
                                ranges={dateRange}
                                className="text-sm"
                            />
                            <div className="mt-2 flex gap-2 justify-end">
                                <Button onClick={applyDateFilter} className="bg-green-600 hover:bg-green-700">Apply</Button>
                                <Button onClick={() => setShowDatePicker(false)} className="bg-gray-400 hover:bg-gray-500">Close</Button>
                            </div>
                        </div>
                    )}
                </div>

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
                                        <td colSpan="9" className="text-center py-4 text-gray-500">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : paginatedOrders.length > 0 ? (
                                    paginatedOrders.map((order) => {
                                        const doctor = order.referredBy;
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
                                                <td className="border p-2 flex justify-center items-center">
                                                    <div className="flex flex-col sm:flex-row gap-3">
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
                                                                setPrintDoctor(order.referredBy);
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
                                        <td colSpan="9" className="text-center py-4 text-gray-500">
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
                    {/* --- NEW: "Go to Page" Input --- */}
                    <form onSubmit={handleGoToPage} className="flex items-center ml-4 gap-2">
                        <Input
                            type="number"
                            value={goToPageInput}
                            onChange={(e) => setGoToPageInput(e.target.value)}
                            placeholder="Go to page"
                            min="1"
                            max={totalPages}
                            className="w-24 text-center"
                        />
                        <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
                            Go
                        </Button>
                    </form>
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