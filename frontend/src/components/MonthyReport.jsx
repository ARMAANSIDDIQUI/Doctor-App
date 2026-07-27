import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrdersWithFilters } from "../store/order";
import { fetchCategories } from "../store/categories";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RefreshCcw, ChevronUp, ChevronDown, Check, ChevronsUpDown, Search } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import api from "@/common/axios";
import { format, startOfMonth, endOfMonth, isValid, addDays } from "date-fns";
import { toast } from "react-toastify";
import { useModal } from "../context/ModalContext";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import TableScrollContainer from "@/components/ui/TableScrollContainer";

const MonthlyReport = () => {
    const { showAlert } = useModal();
    const dispatch = useDispatch();
    const [doctors, setDoctors] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    
    // State for Popover control
    const [openDoctorPopover, setOpenDoctorPopover] = useState(false);
    
    // FAST STATE: Controls the input's value for filtering doctors (stable typing)
    const [searchQueryDoc, setSearchQueryDoc] = useState("");
    // SLOW STATE: This state is used for the actual filtering (debounced)
    const [debouncedSearchQueryDoc, setDebouncedSearchQueryDoc] = useState("");
    
    const [selectedDoctor, setSelectedDoctor] = useState("all");
    const [categories, setCategories] = useState([]);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [message, setMessage] = useState("");
    const [isDownloading, setIsDownloading] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [downloadAll, setDownloadAll] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateRange, setDateRange] = useState([
        {
            startDate: null,
            endDate: null,
            key: "selection",
        },
    ]);
    const [currentPage, setCurrentPage] = useState(1);
    const [ordersPerPage, setOrdersPerPage] = useState(50);
    const [goToPageInput, setGoToPageInput] = useState("");

    const { paginatedOrders, totalOrders, loading: ordersLoading } = useSelector((state) => state.order);
    const totalPages = Math.max(1, Math.ceil(totalOrders / ordersPerPage));

    // --- DEBOUNCE EFFECT ---
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQueryDoc(searchQueryDoc);
        }, 300); // 300ms debounce delay

        return () => {
            clearTimeout(handler);
        };
    }, [searchQueryDoc]); 
    // --- END DEBOUNCE EFFECT ---


    const fetchReportData = useCallback(() => {
        const params = {
            skip: (currentPage - 1) * ordersPerPage,
            limit: ordersPerPage,
        };

        if (selectedDoctor !== "all") params.referredBy = selectedDoctor;
        if (searchQuery) params.searchQuery = searchQuery;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        dispatch(fetchOrdersWithFilters(params));
    }, [dispatch, currentPage, ordersPerPage, searchQuery, selectedDoctor, startDate, endDate]);

    useEffect(() => {
        fetchReportData();
    }, [fetchReportData]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const response = await api.get("/doctors");
                setDoctors(response.data.doctors || []);
            } catch (error) {
                console.error("Error fetching doctors:", error);
            }
        };
        fetchInitialData();
        dispatch(fetchCategories()).then((res) => setCategories(res.payload || []));
    }, [dispatch]);
    
    // **CORRECTED ADJUST DATE LOGIC**
    const adjustDate = (dateString, direction) => {
        // **FIX:** Append 'T00:00:00' to force parsing as local midnight, not UTC midnight.
        const initialDate = dateString ? new Date(dateString + 'T00:00:00') : new Date();
        
        if (!isValid(initialDate)) {
            return dateString;
        }
        const amount = direction === 'increment' ? 1 : -1;
        const newDate = addDays(initialDate, amount);
        
        // format() correctly extracts the local date part as 'yyyy-MM-dd'
        return format(newDate, 'yyyy-MM-dd');
    };

    const groupedData = useMemo(() => {
        if (!paginatedOrders) return [];

        const NONE_DOCTOR_PLACEHOLDER = { _id: 'NONE_GROUP', name: 'None', phoneNo: 'N/A', address: 'N/A' };

        return Object.values(paginatedOrders.reduce((acc, order) => {
            const doctorId = order.referredBy?._id;
            if (doctorId) {
                if (!acc[doctorId]) { acc[doctorId] = { doctor: order.referredBy, orders: [] }; }
                acc[doctorId].orders.push(order);
            } else {
                const noneKey = NONE_DOCTOR_PLACEHOLDER._id;
                if (!acc[noneKey]) { acc[noneKey] = { doctor: NONE_DOCTOR_PLACEHOLDER, orders: [] }; }
                acc[noneKey].orders.push(order);
            }
            return acc;
        }, {}));
    }, [paginatedOrders]);

    // Filter calculation uses the SLOW debounced state
    const filteredDoctors = useMemo(() => {
        return doctors.filter((doctor) =>
            doctor.name && typeof doctor.name === 'string' && doctor.name.toLowerCase().includes(debouncedSearchQueryDoc.toLowerCase())
        );
    }, [doctors, debouncedSearchQueryDoc]); 
    
    
    const handleShowDatePicker = () => {
        // **FIX:** Ensure that when reading from state for the DateRangePicker, 
        // we parse the 'YYYY-MM-DD' string into a Date object correctly.
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
        // When setting state from DateRangePicker, the date objects are full Date objects.
        // format() correctly outputs the local 'yyyy-MM-dd' string.
        if (pickerStartDate) setStartDate(format(pickerStartDate, 'yyyy-MM-dd'));
        if (pickerEndDate) setEndDate(format(pickerEndDate, 'yyyy-MM-dd'));
        setShowDatePicker(false);
    };

    const resetDateFilter = () => {
        setStartDate("");
        setEndDate("");
        setDateRange([{ startDate: null, endDate: null, key: 'selection' }]);
        setShowDatePicker(false);
    };

    const resetAllFilters = () => {
        setSearchQuery("");
        setSearchQueryDoc(""); 
        setDebouncedSearchQueryDoc("");
        setSelectedDoctor("all");
        setStartDate("");
        setEndDate("");
        setDownloadAll(false);
        setShowDatePicker(false);
        setCurrentPage(1);
        setMessage("");
    };

    const getDownloadParams = () => {
        if (downloadAll) {
            return {};
        }

        const params = {
            searchQuery: searchQuery || undefined,
            referredBy: selectedDoctor !== "all" ? selectedDoctor : undefined,
        };

        if (startDate && endDate) {
            params.startDate = startDate;
            params.endDate = endDate;
        } else {
            const now = new Date();
            params.startDate = format(startOfMonth(now), 'yyyy-MM-dd');
            params.endDate = format(endOfMonth(now), 'yyyy-MM-dd');
        }

        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
        return params;
    };
    
    const handleDownload = async (reportType) => {
        if (isDownloading) return;
        setIsDownloading(true);
        setMessage("Preparing report...");

        // NOTE: You need to ensure that excelWorker.js exists and is set up correctly.
        // For this fix, I assume the worker setup is correct.
        const worker = new Worker(new URL('./excelWorker.js', import.meta.url), { type: 'module' });
        const params = getDownloadParams();
        
        worker.postMessage({ params, reportType, categories });

        worker.onmessage = (event) => {
            const { status, data, fileName, message: workerMessage } = event.data;
            
            if (status === 'success') {
                const blob = data; 
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                toast.success("Report downloaded successfully.");
                setMessage("Report downloaded successfully.");

            } else {
                console.error("Web worker failed:", workerMessage);
                toast.error(`Download failed: ${workerMessage}`);
                setMessage(`An error occurred: ${workerMessage}`);
            }

            setIsDownloading(false);
            worker.terminate();
            setTimeout(() => setMessage(""), 5000);
        };


        worker.onerror = (error) => {
            console.error("Web worker error:", error);
            setMessage("An error occurred with the web worker.");
            setIsDownloading(false);
            worker.terminate();
            setTimeout(() => setMessage(""), 5000);
        };
    };

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
    
    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(prevPage => prevPage + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(prevPage => prevPage - 1);
    };

    const handleGoToPage = (e) => {
        e.preventDefault();
        const pageNumber = Number(goToPageInput);
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
            setGoToPageInput("");
        } else {
            showAlert({
                title: 'Invalid Page',
                message: `Please enter a valid page number between 1 and ${totalPages}`,
                type: 'warning'
            });
        }
    };

    const handleScroll = () => {
        setShowScrollButton(window.scrollY > 300);
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 mt-16 py-8 px-4 sm:px-8 w-full max-w-full">
            <div className="w-full max-w-full space-y-6">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
                                Doctor Settlements
                            </span>
                        </div>
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-2">Monthly Doctor Reports</h1>
                        <p className="text-xs text-slate-500 mt-1">Filter commission breakdown by doctor, custom month, or download Excel</p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="doctor" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Select Doctor</Label>
                    
                    {/* Popover Structure for stable input */}
                    <Popover open={openDoctorPopover} onOpenChange={setOpenDoctorPopover}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openDoctorPopover}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex justify-between items-center"
                            >
                                <span className="text-left">
                                {selectedDoctor === "all"
                                    ? "All Doctors"
                                    : doctors.find((doctor) => doctor._id === selectedDoctor)?.name
                                    ? doctors.find((doctor) => doctor._id === selectedDoctor)?.name
                                    : "Select Doctor..."}
                                </span>
                                <ChevronsUpDown className="opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        {/* 💡 FIX: Set width to match the trigger button using the Radix CSS variable */}
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0"> 
                            <Command>
                                {/* CommandInput handles the stable input field */}
                                <CommandInput 
                                    placeholder="Search doctor..." 
                                    value={searchQueryDoc} 
                                    onValueChange={setSearchQueryDoc} 
                                />
                                <CommandList>
                                    <CommandItem
                                        value="all-doctors-option"
                                        onSelect={() => {
                                            handleDoctorChange("all");
                                            setOpenDoctorPopover(false);
                                            setSearchQueryDoc(""); // Clear search when option is selected
                                        }}
                                    >
                                        All Doctors
                                    </CommandItem>
                                    
                                    {filteredDoctors.length === 0 ? (
                                        <CommandEmpty>No doctor found.</CommandEmpty>
                                    ) : (
                                        <CommandGroup>
                                            {filteredDoctors.map((doctor) => (
                                                <CommandItem
                                                    key={doctor._id}
                                                    value={doctor.name} 
                                                    onSelect={() => {
                                                        handleDoctorChange(doctor._id);
                                                        setOpenDoctorPopover(false);
                                                        setSearchQueryDoc("");
                                                    }}
                                                >
                                                    {doctor.name}
                                                    <Check
                                                        className={`ml-auto ${
                                                            selectedDoctor === doctor._id ? "opacity-100" : "opacity-0"
                                                        }`}
                                                    />
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    )}
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    {/* End Popover Structure */}

                </div>

                {/* --- Date Input Section with combined UI --- */}
                <div className="flex flex-col space-y-2 relative">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                            <Label htmlFor="from-date" className="text-sm font-medium text-gray-700">From Date</Label>
                            <div className="relative">
                                <Input
                                    id="from-date"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)} // "YYYY-MM-DD" string is kept
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
                                    onChange={(e) => setEndDate(e.target.value)} // "YYYY-MM-DD" string is kept
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
                    <Button onClick={handleShowDatePicker} variant="outline" className="w-full mt-2">
                        Select from Calendar
                    </Button>
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
                                <Button onClick={resetDateFilter} className="bg-red-600 hover:bg-red-700">Remove</Button>
                                <Button variant="ghost" onClick={() => setShowDatePicker(false)}>Close</Button>
                            </div>
                        </div>
                    )}
                </div>
                {/* Remaining empty grid cell for layout alignment */}
                <div></div>
            </div>
            
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 pt-4 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={resetAllFilters}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all active:scale-95"
                    >
                        <RefreshCcw className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Reset Filters</span>
                    </button>
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
                </div>

                <div className="w-full sm:w-64">
                    <Input
                        type="text"
                        placeholder="Search Patient Name..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <label htmlFor="downloadAll" className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                            type="checkbox"
                            id="downloadAll"
                            checked={downloadAll}
                            onChange={(e) => setDownloadAll(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span>Download All</span>
                    </label>
                    <Button
                        onClick={() => handleDownload('grouped')}
                        disabled={isDownloading}
                        variant="default"
                        className="text-xs font-semibold shadow-xs"
                    >
                        {isDownloading ? 'Downloading...' : 'Download Report'}
                    </Button>
                    <Button
                        onClick={() => handleDownload('detailed')}
                        disabled={isDownloading}
                        variant="success"
                        className="text-xs font-semibold shadow-xs"
                    >
                        {isDownloading ? 'Downloading...' : 'Download Detailed'}
                    </Button>
                </div>
            </div>

            {message && (
                <p className={`mt-4 text-center font-semibold text-xs ${message.includes('error') ? 'text-rose-600' : 'text-indigo-600'}`}>
                    {message}
                </p>
            )}

            {/* Table Container */}
            <TableScrollContainer>
                <table className="w-full text-left border-collapse min-w-max">
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 text-xs font-bold uppercase tracking-wider">
                            <th className="py-3.5 px-4">Serial No</th>
                            <th className="py-3.5 px-4">Date</th>
                            <th className="py-3.5 px-4">Patient</th>
                            <th className="py-3.5 px-4">Doctor Name</th>
                            <th className="py-3.5 px-4">Doctor Mobile</th>
                            <th className="py-3.5 px-4">Doctor Address</th>
                            <th className="py-3.5 px-4">Placed By</th>
                            {categories.map((category) => (
                                <th key={category._id} className="py-3.5 px-4">
                                    {category.name}
                                </th>
                            ))}
                            <th className="py-3.5 px-4">Discount</th>
                            <th className="py-3.5 px-4">Final Payment</th>
                            <th className="py-3.5 px-4">Referral Fee</th>
                            <th className="py-3.5 px-4 text-right">Commission</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                        {ordersLoading ? (
                            <tr>
                                <td colSpan={11 + categories.length} className="text-center py-8 text-slate-400 font-medium">Loading reports...</td>
                            </tr>
                        ) : groupedData.length > 0 ? (
                            groupedData.flatMap((group) =>
                                group.orders.map((order) => (
                                    <tr key={order._id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{order.serialNo}</td>
                                        <td className="py-3.5 px-4 text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString('en-GB')}</td>
                                        <td className="py-3.5 px-4 font-semibold text-slate-900">{order.name || "Unknown"}</td>
                                        <td className="py-3.5 px-4 font-semibold text-indigo-700">{order.referredBy?.name || "Unknown"}</td>
                                        <td className="py-3.5 px-4 text-slate-600 text-xs">{order.referredBy?.phoneNo || "N/A"}</td>
                                        <td className="py-3.5 px-4 text-slate-600 text-xs">{order.referredBy?.address || "N/A"}</td>
                                        <td className="py-3.5 px-4 text-slate-600 text-xs">{order.placedBy || "N/A"}</td>
                                        {categories.map((category) => (
                                            <td key={category._id} className="py-3.5 px-4">
                                                {order.category === category.name ? (
                                                    <span className="bg-indigo-50 text-indigo-700 font-semibold text-xs px-2.5 py-1 rounded-full border border-indigo-200/60">
                                                        {order.subcategory || "N/A"}
                                                    </span>
                                                ) : ""}
                                            </td>
                                        ))}
                                        <td className="py-3.5 px-4 text-rose-600 font-semibold">{order.discount ? `₹${order.discount}` : "—"}</td>
                                        <td className="py-3.5 px-4 font-extrabold text-slate-900">₹{order.finalPayment || 0}</td>
                                        <td className="py-3.5 px-4 font-semibold text-slate-600">₹{order.referralFee || 0}</td>
                                        <td className="py-3.5 px-4 font-extrabold text-emerald-700 text-right">
                                            ₹{(order.referralFee || 0) - (order.discount || 0)}
                                        </td>
                                    </tr>
                                ))
                            )
                        ) : (
                            <tr>
                                <td colSpan={11 + categories.length} className="text-center py-10 text-slate-400 text-sm font-medium">No orders found for selected criteria</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </TableScrollContainer>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage === 1 || ordersLoading || isDownloading}>
                        Previous
                    </Button>
                    <span className="text-xs font-semibold text-slate-600">
                        Page <span className="text-slate-900 font-bold">{currentPage}</span> of <span className="text-slate-900 font-bold">{totalPages}</span>
                    </span>
                    <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage >= totalPages || ordersLoading || isDownloading}>
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
            {showScrollButton && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-6 right-6 w-11 h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 z-50 text-base font-bold"
                >
                    ↑
                </button>
            )}
        </div>
    </div>
</div>
  );
};

export default MonthlyReport;