import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPaginatedOrders, fetchOrdersByDate, fetchAllOrders } from "../store/order"; // Added fetchOrdersByDate
import { fetchCategories } from "../store/categories";
import { DateRangePicker } from "react-date-range";// Import date-range picker
import * as XLSX from "xlsx"; // Import xlsx library
import "react-date-range/dist/styles.css"; // Import default styles
import "react-date-range/dist/theme/default.css"; // Import theme styles
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RefreshCcw } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import api from "@/common/axios";

const MonthlyReport = () => {
  const dispatch = useDispatch();
  const [groupedData, setGroupedData] = useState([]);
  const [records, setRecords] = useState([]); 
  const [message, setMessage] = useState(""); 
  const [categories, setCategories] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchQueryDoc, setSearchQueryDoc] = useState("");
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Now using filteredOrders to hold the data after applying any filter-Armaan Siddiqui
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  // New states for pagination-Armaan Siddiqui
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 100;

  // Get paginated orders and total count from Redux store
  const { paginatedOrders, totalOrders, loading: ordersLoading, filteredOrders: ordersByDateRange } = useSelector((state) => state.order);

  // Calculate total pages based on the total count from the server
  const totalPages = Math.ceil(totalOrders / ordersPerPage);

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

  // Fetch paginated orders on component and when currentPage changes-Armaan Siddiqui
  useEffect(() => {
    dispatch(fetchPaginatedOrders({ 
      skip: (currentPage - 1) * ordersPerPage, 
      limit: ordersPerPage 
    }));
    
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

  }, [dispatch, currentPage]);

  // Initially set the filtered orders to paginated orders-Armaan Siddiqui
  useEffect(() => {
    setFilteredOrders(paginatedOrders);
  }, [paginatedOrders]);

  // Update filtered orders when ordersByDateRange changes (from applyDateFilter)-Armaan Siddiqui
  useEffect(() => {
    if (ordersByDateRange.length) {
      setFilteredOrders(ordersByDateRange);
    }
  }, [ordersByDateRange]);

  const filteredDoctors = doctors.filter((doctor) =>
    doctor.name.toLowerCase().includes(searchQueryDoc.toLowerCase())
  );

  const applyDateFilter = () => {
    const { startDate, endDate } = dateRange[0];
    const normalizedStartDate = startDate.toISOString();
    const normalizedEndDate = endDate.toISOString();

    // Dispatch the thunk to fetch orders by date from the server
    dispatch(fetchOrdersByDate({ startDate: normalizedStartDate, endDate: normalizedEndDate }));
    
    setMessage("");
    setShowDatePicker(false);
  };

  const handleDateChange = (selectedDate) => {
    setFilteredOrders([]);
    setMessage("");
    const normalizedSelectedDate = new Date(selectedDate).setHours(0, 0, 0, 0);
    const dataForSelectedDate = groupedData.filter(order => {
      const orderDate = new Date(order.createdAt).setHours(0, 0, 0, 0);
      return orderDate === normalizedSelectedDate;
    });
    if (dataForSelectedDate.length > 0) {
      setFilteredOrders(dataForSelectedDate);
    } else {
      setMessage("No records found for this date.");
    }
  };


  const resetDateFilter = () => {
    setFilteredOrders(paginatedOrders);
    setDateRange([
      {
        startDate: new Date(),
        endDate: new Date(),
        key: "selection",
      },
    ]);
    setMessage("");
    setShowDatePicker(!showDatePicker);
  };
  
  useEffect(() => {
    if (filteredOrders.length) {
      const groupOrdersByDoctor = () => {
        const filteredOrdersData = filteredOrders.filter((order) => {
          const doctor = doctors.find((doctor) => doctor._id === order.referredBy);
          return (
            (order.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (doctor &&
                (doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  doctor.phoneNo.toString().includes(searchQuery))) ||
              order.serialNo.toLowerCase().includes(searchQuery.toLowerCase())) &&
            order.referredBy !== 0 &&
            order.referredBy !== null
          );
        });

        const grouped = filteredOrdersData.reduce((acc, order) => {
          const doctorId = order.referredBy;
          if (!acc[doctorId]) acc[doctorId] = [];
          acc[doctorId].push(order);
          return acc;
        }, {});

        const validGroupedData = Object.keys(grouped).map((id) => ({
          doctor: doctors.find((doc) => doc._id === id) || {},
          orders: grouped[id],
        }));
        setGroupedData(validGroupedData);
      };
      groupOrdersByDoctor();
    }
  }, [filteredOrders, doctors, searchQuery]);

  // Download the grouped data as an Excel file
  const downloadExcel = () => {
    const excelData = [];
    let serialNo = 1;
    groupedData.forEach((group) => {
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
  };

  // Download detailed Excel with all orders
  const downloadDetailedExcel = () => {
    const excelData = [];
    let serialNo = 1;
    const flattenedData = groupedData.flatMap((group) =>
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
  };

  const applyDoctorFilter = () => {
    if (!selectedDoctor) {
      setMessage("Please select a doctor to filter.");
      return;
    }
    const filteredByDoctor = filteredOrders.filter(
      (order) => order.referredBy === selectedDoctor
    );
    setFilteredOrders(filteredByDoctor);
    if (filteredByDoctor.length === 0) {
      setMessage("No records found for the selected doctor.");
    } else {
      setMessage("");
    }
  };

  const resetAllFilters = () => {
    setSelectedDoctor(null);
    setSearchQueryDoc("");
    setDateRange([
      {
        startDate: new Date(),
        endDate: new Date(),
        key: "selection",
      },
    ]);
    dispatch(fetchAllOrders()); // Fetch all orders to reset the view
    setMessage("");
    setShowDatePicker(false);
  };
  
  // Pagination Handlers-Armaan Siddiqui
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
    <div className="p-2 sm:p-6 mt-16">
      {/* Controls Section - Made responsive */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:space-x-6 items-start">
        {/* Doctor Select Section */}
        <div className="flex flex-col w-full sm:w-72 space-y-2">
          <Label htmlFor="doctor" className="text-lg font-semibold text-gray-700">
            Select Doctor
          </Label>
          <Select
            value={selectedDoctor || ""}
            onValueChange={setSelectedDoctor}
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
                {filteredDoctors.map((doctor) => (
                  <SelectItem key={doctor._id} value={doctor._id}>
                    {doctor.name}
                  </SelectItem>
                ))}
              </div>
            </SelectContent>
          </Select>
          <button
            onClick={applyDoctorFilter}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition w-full sm:w-auto"
          >
            Apply Filter by Doctor
          </button>
        </div>

        {/* Date Picker Section */}
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
                <button
                  onClick={applyDateFilter}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition w-full sm:w-auto"
                >
                  Apply Date Filter
                </button>
                <button
                  onClick={resetDateFilter}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 transition w-full sm:w-auto"
                >
                  Remove Filter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls and Search Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <button
          onClick={() => resetAllFilters()}
          className="flex items-center justify-center space-x-1 p-1.5 border border-gray-300 rounded-md shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 w-full sm:w-auto"
        >
          <RefreshCcw className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-xs font-medium text-gray-600">Reset Filters</span>
        </button>

        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Message Display */}
      {message && <p className="mt-4 text-center text-green-600">{message}</p>}

      {/* Responsive Table Container */}
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
              {groupedData.map((group, index) =>
                group.orders.map((order, orderIndex) => (
                  <tr
                    key={order._id}
                    className={`${orderIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-gray-100`}
                  >
                    <td className="border border-gray-300 p-2">{order.serialNo}</td>
                    <td className="border border-gray-300 p-2">
                      {new Date(order.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {order.name || "Unknown"}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {group.doctor.name || "Unknown"}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {group.doctor.phoneNo || "N/A"}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {group.doctor.address || "N/A"}
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
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination Controls-Armaan Siddiqui */}
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
