// Complete logic restructure for filtering(dropdown, searcbar, Date range) and also filtered downloading-Armaan Siddiqui

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrdersWithFilters } from "../store/order";
import { fetchCategories } from "../store/categories";
import { DateRangePicker } from "react-date-range";
import * as XLSX from "xlsx";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RefreshCcw } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import api from "@/common/axios";
import { format } from "date-fns";

const MonthlyReport = () => {
    const dispatch = useDispatch();
    const [doctors, setDoctors] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchQueryDoc, setSearchQueryDoc] = useState("");
    const [selectedDoctor, setSelectedDoctor] = useState("none");
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [groupedData, setGroupedData] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [message, setMessage] = useState("");
    const [dateRange, setDateRange] = useState([
        {
            startDate: null,
            endDate: null,
            key: "selection",
        },
    ]);
    const [currentPage, setCurrentPage] = useState(1);
    const [ordersPerPage, setOrdersPerPage] = useState(50);
    const { paginatedOrders, totalOrders, loading: ordersLoading } = useSelector((state) => state.order);
    const totalPages = Math.ceil(totalOrders / ordersPerPage);

    const fetchReportData = () => {
        const params = {
            skip: (currentPage - 1) * ordersPerPage,
            limit: ordersPerPage,
        };

        if (selectedDoctor !== "none") {
            params.referredBy = selectedDoctor;
        }
        if (searchQuery) {
            params.searchQuery = searchQuery;
        }

        if (dateRange[0].startDate && dateRange[0].endDate) {
            params.startDate = format(dateRange[0].startDate, 'yyyy-MM-dd');
            params.endDate = format(dateRange[0].endDate, 'yyyy-MM-dd');
        }
        dispatch(fetchOrdersWithFilters(params));
    };

    useEffect(() => {
        fetchReportData();
        const fetchDoctors = async () => {
            try {
                const response = await api.get("/doctors");
                setDoctors(response.data.doctors || []);
            } catch (error) {
                console.error("Error fetching doctors:", error);
            }
        };
        fetchDoctors();
        dispatch(fetchCategories()).then((res) => setCategories(res.payload));
    }, [dispatch, currentPage, ordersPerPage, searchQuery, selectedDoctor, dateRange[0].startDate, dateRange[0].endDate]);

    useEffect(() => {
        const groupOrdersByDoctor = () => {
            const grouped = paginatedOrders.reduce((acc, order) => {
                const doctorId = order.referredBy?._id;
                if (doctorId) {
                    if (!acc[doctorId]) acc[doctorId] = { doctor: order.referredBy, orders: [] };
                    acc[doctorId].orders.push(order);
                }
                return acc;
            }, {});
            setGroupedData(Object.values(grouped));
        };
        groupOrdersByDoctor();
    }, [paginatedOrders]);

    const filteredDoctors = doctors.filter((doctor) =>
        doctor.name && typeof doctor.name === 'string' && doctor.name.toLowerCase().includes(searchQueryDoc.toLowerCase())
    );

    const handleOrdersPerPageChange = (e) => {
        setOrdersPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleDoctorChange = (value) => {
        setSelectedDoctor(value);
        setCurrentPage(1);
    };

    const applyDateFilter = () => {
        setMessage("");
        setShowDatePicker(false);
        setCurrentPage(1);
    };

    const resetDateFilter = () => {
        setDateRange([
            {
                startDate: null,
                endDate: null,
                key: "selection",
            },
        ]);
        setMessage("");
        setShowDatePicker(false);
        setCurrentPage(1);
    };

    const resetAllFilters = () => {
        setSearchQuery("");
        setSearchQueryDoc("");
        setSelectedDoctor("none");
        setDateRange([
            {
                startDate: null,
                endDate: null,
                key: "selection",
            },
        ]);
        setCurrentPage(1);
        setMessage("");
        setShowDatePicker(false);
    };

    const downloadExcel = async () => {
        const params = {
            searchQuery,
            referredBy: selectedDoctor !== "none" ? selectedDoctor : undefined,
            startDate: dateRange[0].startDate ? format(dateRange[0].startDate, 'yyyy-MM-dd') : undefined,
            endDate: dateRange[0].endDate ? format(dateRange[0].endDate, 'yyyy-MM-dd') : undefined,
            download: 'true'
        };

        try {
            const response = await dispatch(fetchOrdersWithFilters(params)).unwrap();
            const allOrders = response.orders || [];

            const grouped = allOrders.reduce((acc, order) => {
                const doctorId = order.referredBy?._id;
                if (doctorId) {
                    if (!acc[doctorId]) acc[doctorId] = { doctor: order.referredBy, orders: [] };
                    acc[doctorId].orders.push(order);
                }
                return acc;
            }, {});
            const groupedDataForExcel = Object.values(grouped);
            const excelData = [];
            let serialNo = 1;
            groupedDataForExcel.forEach((group) => {
                const doctor = group.doctor;
                const totalCommission = group.orders.reduce(
                    (total, order) => total + (order.referralFee - order.discount),
                    0
                );
                excelData.push({
                    "Serial No": serialNo++,
                    "Doctor Name": doctor.name || "Unknown",
                    "Total Commission": totalCommission,
                    "Doctor Mobile": doctor.phoneNo || "N/A",
                    "Doctor Address": doctor.address || "N/A",
                });
            });
            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Doctor Report");
            XLSX.writeFile(wb, "Doctor_Report.xlsx");
        } catch (error) {
            console.error("Error downloading report:", error);
            setMessage("Failed to download report. Please try again.");
        }
    };

    const downloadDetailedExcel = async () => {
        const params = {
            searchQuery,
            referredBy: selectedDoctor !== "none" ? selectedDoctor : undefined,
            startDate: dateRange[0].startDate ? format(dateRange[0].startDate, 'yyyy-MM-dd') : undefined,
            endDate: dateRange[0].endDate ? format(dateRange[0].endDate, 'yyyy-MM-dd') : undefined,
            download: 'true'
        };

        try {
            const response = await dispatch(fetchOrdersWithFilters(params)).unwrap();
            const allOrders = response.orders || [];

            const grouped = allOrders.reduce((acc, order) => {
                const doctorId = order.referredBy?._id;
                if (doctorId) {
                    if (!acc[doctorId]) acc[doctorId] = { doctor: order.referredBy, orders: [] };
                    acc[doctorId].orders.push(order);
                }
                return acc;
            }, {});
            const groupedDataForExcel = Object.values(grouped);
            const excelData = [];
            let serialNo = 1;
            const flattenedData = groupedDataForExcel.flatMap((group) =>
                group.orders.map((order) => ({
                    doctor: group.doctor,
                    order: order,
                }))
            );
            flattenedData.sort((a, b) => {
                const nameA = a.doctor.name?.toLowerCase() || "unknown";
                const nameB = b.doctor.name?.toLowerCase() || "unknown";
                return nameA.localeCompare(nameB);
            });
            flattenedData.forEach(({ doctor, order }) => {
                const totalCommission = order.referralFee - order.discount;
                excelData.push({
                    "Serial No": serialNo++,
                    "Date": new Date(order.createdAt).toLocaleDateString('en-GB'),
                    "Patient Name": order.name || "Unknown",
                    "Doctor Name": doctor.name || "Unknown",
                    "Doctor Mobile": doctor.phoneNo || "N/A",
                    "Doctor Address": doctor.address || "N/A",
                    "Placed By": order.placedBy || "N/A",
                    ...categories.reduce((acc, category) => {
                        acc[category.name] = order.category === category.name ? order.subcategory || "N/A" : "";
                        return acc;
                    }, {}),
                    "Discount": order.discount || 0,
                    "Final Payment": order.finalPayment || 0,
                    "Referral Fee": order.referralFee || 0,
                    "Total Commission": totalCommission,
                });
            });
            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Detailed Report");
            XLSX.writeFile(wb, "Detailed_Report.xlsx");
        } catch (error) {
            console.error("Error downloading detailed report:", error);
            setMessage("Failed to download detailed report. Please try again.");
        }
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

    const handleScroll = () => {
        if (window.scrollY > 300) {
            setShowScrollButton(true);
        } else {
            setShowScrollButton(false);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="p-2 sm:p-6 mt-16">
            <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:space-x-6 items-start">
                <div className="flex flex-col w-full sm:w-72 space-y-2">
                    <Label htmlFor="doctor" className="text-lg font-semibold text-gray-700">
                        Select Doctor
                    </Label>
                    <Select
                        value={selectedDoctor}
                        onValueChange={handleDoctorChange}
                        className="w-full"
                    >
                        <SelectTrigger id="doctor">
                            <SelectValue placeholder="Select a doctor" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-300 shadow-md rounded-lg max-h-60 overflow-auto">
                            <div className="sticky top-0 bg-white p-2 border-b border-gray-300 z-20">
                                <Input
                                    type="text"
                                    placeholder="Search doctor"
                                    value={searchQueryDoc}
                                    onChange={(e) => setSearchQueryDoc(e.target.value)}
                                    className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="max-h-48 overflow-auto">
                                <SelectItem value="none">
                                    None
                                </SelectItem>
                                {filteredDoctors.map((doctor) => (
                                    <SelectItem key={doctor._id} value={doctor._id}>
                                        {doctor.name}
                                    </SelectItem>
                                ))}
                            </div>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                    <button
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition w-full sm:w-auto"
                    >
                        {showDatePicker ? "Hide Date Picker" : "Show Date Picker"}
                    </button>
                    {showDatePicker && (
                        <div className="ml-0 sm:ml-4 bg-white border border-gray-300 shadow-md rounded-lg p-4 w-full sm:w-[600px]">
                            <DateRangePicker
                                editableDateInputs={true}
                                onChange={(item) => setDateRange([item.selection])}
                                moveRangeOnFirstSelection={false}
                                ranges={dateRange}
                                className="text-sm"
                            />
                            <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:space-x-4 justify-end">
                                <Button
                                    onClick={applyDateFilter}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition w-full sm:w-auto"
                                >
                                    Apply Date Filter
                                </Button>
                                <Button
                                    onClick={resetDateFilter}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 transition w-full sm:w-auto"
                                >
                                    Remove Filter
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <button
                        onClick={resetAllFilters}
                        className="flex items-center justify-center space-x-1 p-1.5 border border-gray-300 rounded-md shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                    >
                        <RefreshCcw className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-xs font-medium text-gray-600">Reset Filters</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="orders-per-page" className="font-medium text-sm whitespace-nowrap">Show:</Label>
                        <select
                            id="orders-per-page"
                            value={ordersPerPage}
                            onChange={handleOrdersPerPageChange}
                            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                </div>
                <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="p-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-48 text-sm"
                />
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:space-x-4 w-full sm:w-auto">
                    <button
                        onClick={downloadExcel}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition w-full sm:w-auto"
                    >
                        Download Report
                    </button>
                    <button
                        onClick={downloadDetailedExcel}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition w-full sm:w-auto"
                    >
                        Download Detailed Report
                    </button>
                </div>
            </div>
            {message && <p className="mt-4 text-center text-green-600">{message}</p>}
            <div className="w-full overflow-x-auto shadow-md rounded-lg">
                <div className="min-w-max">
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 p-2 whitespace-nowrap">Serial No</th>
                                <th className="border border-gray-300 p-2 whitespace-nowrap">Date</th>
                                <th className="border border-gray-300 p-2 whitespace-nowrap">Patient</th>
                                <th className="border border-gray-300 p-2 whitespace-nowrap">Doctor Name</th>
                                <th className="border border-gray-300 p-2 whitespace-nowrap">Doctor Mobile</th>
                                <th className="border border-gray-300 p-2 whitespace-nowrap">Doctor Address</th>
                                <th className="border border-gray-300 p-2 whitespace-nowrap">Placed By</th>
                                {categories.map((category) => (
                                    <th key={category._id} className="border border-gray-300 p-2 whitespace-nowrap">
                                        {category.name}
                                    </th>
                                ))}
                                <th className="border border-gray-300 p-2 whitespace-nowrap">Discount</th>
                                <th className="border border-gray-300 p-2 whitespace-nowrap">Final Payment</th>
                                <th className="border border-gray-300 p-2 whitespace-nowrap">Referral Fee</th>
                                <th className="border border-gray-300 p-2 whitespace-nowrap">Total Commission</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ordersLoading ? (
                                <tr>
                                    <td colSpan={12 + categories.length} className="text-center py-4 text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : groupedData.length > 0 ? (
                                groupedData.map((group, groupIndex) =>
                                    group.orders.map((order, orderIndex) => (
                                        <tr
                                            key={order._id}
                                            className={`${(groupIndex + orderIndex) % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}
                                        >
                                            <td className="border border-gray-300 p-2">{order.serialNo}</td>
                                            <td className="border border-gray-300 p-2">
                                                {new Date(order.createdAt).toLocaleDateString('en-GB')}
                                            </td>
                                            <td className="border border-gray-300 p-2">
                                                {order.name || "Unknown"}
                                            </td>
                                            <td className="border border-gray-300 p-2">
                                                {order.referredBy?.name || "Unknown"}
                                            </td>
                                            <td className="border border-gray-300 p-2">
                                                {order.referredBy?.phoneNo || "N/A"}
                                            </td>
                                            <td className="border border-gray-300 p-2">
                                                {order.referredBy?.address || "N/A"}
                                            </td>
                                            <td className="border border-gray-300 p-2">
                                                {order.placedBy || "N/A"}
                                            </td>
                                            {categories.map((category) => (
                                                <td key={category._id} className="border border-gray-300 p-2">
                                                    {order.category === category.name
                                                        ? order.subcategory || "N/A"
                                                        : ""}
                                                </td>
                                            ))}
                                            <td className="border border-gray-300 p-2">
                                                {order.discount || 0}
                                            </td>
                                            <td className="border border-gray-300 p-2">
                                                {order.finalPayment || 0}
                                            </td>
                                            <td className="border border-gray-300 p-2">
                                                {order.referralFee}
                                            </td>
                                            <td className="border border-gray-300 p-2">
                                                {order.referralFee - order.discount}
                                            </td>
                                        </tr>
                                    ))
                                )
                            ) : (
                                <tr>
                                    <td colSpan={12 + categories.length} className="text-center py-4 text-gray-500">
                                        No orders found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Pagination Controls */}
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
            {/* Scroll to top button */}
            <button
                onClick={scrollToTop}
                className="fixed bottom-4 right-4 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition transform hover:scale-105 z-50"
                style={{ display: showScrollButton ? 'block' : 'none' }}
            >
                ↑
            </button>
        </div>
    );
};

export default MonthlyReport;