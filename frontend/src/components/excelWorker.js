// // import * as XLSX from "xlsx";

// // self.onmessage = async (event) => {
// //     const { params, reportType, categories } = event.data;
    
// //     try {
// //         const baseUrl = 'http://localhost:5000'; // Replace with your actual backend URL
// //         const queryParams = new URLSearchParams(params).toString();
// //         const url = `${baseUrl}/api/orders/filter?${queryParams}`;

// //         const response = await fetch(url);
// //         if (!response.ok) {
// //             throw new Error(`HTTP error! status: ${response.status}`);
// //         }
// //         const data = await response.json();
// //         const allOrders = data.orders || [];

// //         if (allOrders.length === 0) {
// //             self.postMessage({ status: 'error', message: 'No orders found to download.' });
// //             return;
// //         }

// //         let excelData = [];
// //         let sheetName = "";
// //         let fileName = "";

// //         if (reportType === 'detailed') {
// //             excelData = allOrders.map((order, index) => {
// //                 const doctor = order.referredBy || {};
// //                 const totalCommission = (order.referralFee || 0) - (order.discount || 0);
// //                 const categoryData = categories.reduce((acc, category) => {
// //                     acc[category.name] = order.category === category.name ? order.subcategory || "N/A" : "";
// //                     return acc;
// //                 }, {});

// //                 return {
// //                     "Serial No": index + 1,
// //                     "Date": new Date(order.createdAt).toLocaleDateString('en-GB'),
// //                     "Patient Name": order.name || "Unknown",
// //                     "Doctor Name": doctor.name || "Unknown",
// //                     "Doctor Mobile": doctor.phoneNo || "N/A",
// //                     "Doctor Address": doctor.address || "N/A",
// //                     "Placed By": order.placedBy || "N/A",
// //                     ...categoryData,
// //                     "Discount": order.discount || 0,
// //                     "Final Payment": order.finalPayment || 0,
// //                     "Referral Fee": order.referralFee || 0,
// //                     "Total Commission": totalCommission,
// //                 };
// //             });
// //             sheetName = "Detailed Report";
// //             fileName = "Detailed_Report.xlsx";
// //         } else if (reportType === 'grouped') {
// //             const grouped = allOrders.reduce((acc, order) => {
// //                 const doctorId = order.referredBy?._id || "unreferred";
// //                 const doctor = order.referredBy || { name: "Unknown", phoneNo: "N/A", address: "N/A" };
                
// //                 if (!acc[doctorId]) {
// //                     acc[doctorId] = { doctor, orders: [] };
// //                 }
// //                 acc[doctorId].orders.push(order);
// //                 return acc;
// //             }, {});

// //             excelData = Object.values(grouped).map((group, index) => {
// //                 const totalCommission = group.orders.reduce(
// //                     (total, order) => total + ((order.referralFee || 0) - (order.discount || 0)),
// //                     0
// //                 );
// //                 return {
// //                     "Serial No": index + 1,
// //                     "Doctor Name": group.doctor.name || "Unknown",
// //                     "Total Commission": totalCommission,
// //                     "Doctor Mobile": group.doctor.phoneNo || "N/A",
// //                     "Doctor Address": group.doctor.address || "N/A",
// //                 };
// //             });
// //             sheetName = "Doctor Report";
// //             fileName = "Doctor_Report.xlsx";
// //         } else {
// //             throw new Error("Invalid report type specified.");
// //         }

// //         const ws = XLSX.utils.json_to_sheet(excelData);
// //         const wb = XLSX.utils.book_new();
// //         XLSX.utils.book_append_sheet(wb, ws, sheetName);
// //         const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        
// //         self.postMessage({ status: 'success', data: wbout, fileName: fileName });
// //     } catch (error) {
// //         console.error("Error in web worker:", error);
// //         self.postMessage({ status: 'error', message: error.message });
// //     }
// // };






// import * as XLSX from "xlsx";
// import api from '@/common/axios'; // Using your common axios instance

// // Define a chunk size for pagination. 5000 is a good starting point.
// // Your API MUST support `page` and `limit` query parameters for this to work.
// const PAGE_LIMIT = 10000;

// /**
//  * Processes a chunk of orders for the 'detailed' report and appends them to the worksheet.
//  */
// function processDetailedChunk(ws, chunkOrders, categories, currentSerialNo) {
//     const excelData = chunkOrders.map((order, index) => {
//         const doctor = order.referredBy || {};
//         const totalCommission = (order.referralFee || 0) - (order.discount || 0);
//         const categoryData = categories.reduce((acc, category) => {
//             acc[category.name] = order.category === category.name ? order.subcategory || "N/A" : "";
//             return acc;
//         }, {});

//         return {
//             "Serial No": currentSerialNo + index,
//             "Date": new Date(order.createdAt).toLocaleDateString('en-GB'),
//             "Patient Name": order.name || "Unknown",
//             "Doctor Name": doctor.name || "Unknown",
//             "Doctor Mobile": doctor.phoneNo || "N/A",
//             "Doctor Address": doctor.address || "N/A",
//             "Placed By": order.placedBy || "N/A",
//             ...categoryData,
//             "Discount": order.discount || 0,
//             "Final Payment": order.finalPayment || 0,
//             "Referral Fee": order.referralFee || 0,
//             "Total Commission": totalCommission,
//         };
//     });

//     // Append this chunk to the sheet, skipping the header
//     XLSX.utils.sheet_add_json(ws, excelData, { skipHeader: true, origin: -1 });
// }

// /**
//  * Processes a chunk of orders for the 'grouped' report by accumulating them in a 'grouped' object.
//  */
// function processGroupedChunk(grouped, chunkOrders) {
//     chunkOrders.reduce((acc, order) => {
//         const doctorId = order.referredBy?._id || "unreferred";
//         const doctor = order.referredBy || { name: "Unknown", phoneNo: "N/A", address: "N/A" };
        
//         if (!acc[doctorId]) {
//             acc[doctorId] = { doctor, orders: [] };
//         }
//         acc[doctorId].orders.push(order);
//         return acc;
//     }, grouped); // Pass in the existing 'grouped' object to accumulate
// }

// /**
//  * Creates the final Excel data for the 'grouped' report *after* all chunks are processed.
//  */
// function createGroupedExcelData(grouped) {
//     return Object.values(grouped).map((group, index) => {
//         const totalCommission = group.orders.reduce(
//             (total, order) => total + ((order.referralFee || 0) - (order.discount || 0)),
//             0
//         );
//         return {
//             "Serial No": index + 1,
//             "Doctor Name": group.doctor.name || "Unknown",
//             "Total Commission": totalCommission,
//             "Doctor Mobile": group.doctor.phoneNo || "N/A",
//             "Doctor Address": group.doctor.address || "N/A",
//         };
//     });
// }

// // --- Main Worker Logic ---

// self.onmessage = async (event) => {
//     const { params, reportType, categories } = event.data;

//     try {
//         let page = 1;
//         let hasMore = true;
//         let totalOrdersFetched = 0;

//         // --- Variables for processing ---
//         let wb, ws, sheetName, fileName;
//         let grouped = {}; // For 'grouped' report
//         let serialNoCounter = 1; // For 'detailed' report

//         // --- Initialize based on report type ---
//         if (reportType === 'detailed') {
//             sheetName = "Detailed Report";
//             fileName = "Detailed_Report.xlsx";

//             // Create headers dynamically from categories
//             const headers = [
//                 "Serial No", "Date", "Patient Name", "Doctor Name", "Doctor Mobile", 
//                 "Doctor Address", "Placed By", ...categories.map(c => c.name),
//                 "Discount", "Final Payment", "Referral Fee", "Total Commission"
//             ];
            
//             // Create workbook and worksheet with *just the headers*
//             wb = XLSX.utils.book_new();
//             ws = XLSX.utils.aoa_to_sheet([headers]);
//             XLSX.utils.book_append_sheet(wb, ws, sheetName);

//         } else if (reportType === 'grouped') {
//             sheetName = "Doctor Report";
//             fileName = "Doctor_Report.xlsx";
//             // 'grouped' report will be built in memory (in 'grouped' object)
//             // We assume the number of *doctors* is manageable
//         } else {
//             throw new Error("Invalid report type specified.");
//         }

//         // --- Fetch loop (Chunking) ---
//         while (hasMore) {
//             console.log(`Fetching page ${page}...`);
//             // Pass the original params, plus our pagination params
//             const queryParams = {
//                 ...params,
//                 page: page,
//                 limit: PAGE_LIMIT
//             };
            
//             // Use 'api' instance. Axios data is on `response.data`
//             const response = await api.get('/orders/filter', { params: queryParams });
            
//             const chunkOrders = response.data.orders || [];
//             totalOrdersFetched += chunkOrders.length;

//             if (chunkOrders.length > 0) {
//                 if (reportType === 'detailed') {
//                     processDetailedChunk(ws, chunkOrders, categories, serialNoCounter);
//                     serialNoCounter += chunkOrders.length; // Increment serial number
//                 } else if (reportType === 'grouped') {
//                     processGroupedChunk(grouped, chunkOrders);
//                 }
//             }

//             // If we got fewer orders than we asked for, we've reached the last page
//             if (chunkOrders.length < PAGE_LIMIT) {
//                 hasMore = false;
//             } else {
//                 page++; // Go to the next page
//             }
//         }

//         // --- Finalization ---
//         if (totalOrdersFetched === 0) {
//             self.postMessage({ status: 'error', message: 'No orders found to download.' });
//             return;
//         }

//         // For 'grouped' report, we create the sheet *after* the loop is done
//         if (reportType === 'grouped') {
//             const excelData = createGroupedExcelData(grouped);
//             wb = XLSX.utils.book_new();
//             ws = XLSX.utils.json_to_sheet(excelData);
//             XLSX.utils.book_append_sheet(wb, ws, sheetName);
//         }

//         // Generate the final Excel file as an array buffer
//         const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        
//         self.postMessage({ status: 'success', data: wbout, fileName: fileName });

//     } catch (error) {
//         console.error("Error in web worker:", error);
//         // Handle Axios errors, which might be on error.response.data
//         const message = error.response?.data?.message || error.message || "An unknown error occurred.";
//         self.postMessage({ status: 'error', message: message });
//     }
// };





import api from "@/common/axios"; // Use your axios instance

const PAGE_LIMIT = 10000;

/**
 * Safely escapes a field for CSV format.
 */
const csvSafe = (field) => {
    const str = String(field === null || typeof field === 'undefined' ? "" : field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

/**
 * Converts a single order object into a CSV row string (for detailed report).
 */
function getDetailedRow(order, categories, currentSerialNo) {
    const doctor = order.referredBy || {};
    const totalCommission = (order.referralFee || 0) - (order.discount || 0);

    const row = [
        currentSerialNo,
        new Date(order.createdAt).toLocaleDateString('en-GB'),
        csvSafe(order.name || "Unknown"),
        csvSafe(doctor.name || "Unknown"),
        csvSafe(doctor.phoneNo || "N/A"),
        csvSafe(doctor.address || "N/A"),
        csvSafe(order.placedBy || "N/A"),
    ];

    for (const category of categories) {
        if (order.category === category.name) {
            row.push(csvSafe(order.subcategory || "N/A"));
        } else {
            row.push("");
        }
    }

    row.push(
        order.discount || 0,
        order.finalPayment || 0,
        order.referralFee || 0,
        totalCommission
    );

    return row.join(',') + '\n';
}

/**
 * Creates the final CSV string for the 'grouped' report.
 */
function createGroupedCSV(grouped) {
    const headers = [
        "Serial No", "Doctor Name", "Total Commission", 
        "Doctor Mobile", "Doctor Address"
    ];
    let csvString = headers.join(',') + '\n';

    Object.values(grouped).forEach((group, index) => {
        const totalCommission = group.orders.reduce(
            (total, order) => total + ((order.referralFee || 0) - (order.discount || 0)),
            0
        );

        const row = [
            index + 1,
            csvSafe(group.doctor.name || "Unknown"),
            totalCommission,
            csvSafe(group.doctor.phoneNo || "N/A"),
            csvSafe(group.doctor.address || "N/A"),
        ];
        csvString += row.join(',') + '\n';
    });
    return csvString;
}

// --- Main Worker Logic ---
self.onmessage = async (event) => {
    const { params, reportType, categories } = event.data;
    console.log(`Worker started for report: ${reportType} with params:`, params);

    try {
        let page = 1;
        let totalPages = 1;
        let totalOrdersFetched = 0;
        let fileContent = "";
        let fileName = "";
        let grouped = {};
        let serialNoCounter = 1;

        if (reportType === 'detailed') {
            fileName = "Detailed_Report.csv";
            const headers = [
                "Serial No", "Date", "Patient Name", "Doctor Name", "Doctor Mobile",
                "Doctor Address", "Placed By", ...categories.map(c => c.name),
                "Discount", "Final Payment", "Referral Fee", "Total Commission"
            ];
            fileContent += headers.join(',') + '\n';
        } else if (reportType === 'grouped') {
            fileName = "Doctor_Report.csv";
        } else {
            throw new Error("Invalid report type specified.");
        }

        // --- Fetch loop (Chunking) ---
        while (page <= totalPages) {
            console.log(`Fetching page ${page} of ${totalPages}...`);
            
            const queryParams = new URLSearchParams({
                ...params,
                page: page,
                limit: PAGE_LIMIT
            });

            const url = `/orders/filter?${queryParams.toString()}`;

            // --- Axios call instead of fetch ---
            const { data } = await api.get(url);
            
            const chunkOrders = data.orders || [];
            totalPages = data.totalPages || 1; // Get total pages from the API
            totalOrdersFetched += chunkOrders.length;

            if (chunkOrders.length > 0) {
                if (reportType === 'detailed') {
                    let csvChunk = "";
                    for (const order of chunkOrders) {
                        csvChunk += getDetailedRow(order, categories, serialNoCounter);
                        serialNoCounter++;
                    }
                    fileContent += csvChunk;
                } else if (reportType === 'grouped') {
                    chunkOrders.forEach(order => {
                        const doctorId = order.referredBy?._id || "unreferred";
                        const doctor = order.referredBy || { name: "Unknown", phoneNo: "N/A", address: "N/A" };
                        if (!grouped[doctorId]) {
                            grouped[doctorId] = { doctor, orders: [] };
                        }
                        grouped[doctorId].orders.push(order);
                    });
                }
            }
            
            if (page >= totalPages) break;
            page++;
        }

        if (totalOrdersFetched === 0) {
            self.postMessage({ status: 'error', message: 'No orders found to download.' });
            return;
        }

        if (reportType === 'grouped') {
            fileContent = createGroupedCSV(grouped);
        }

        const blob = new Blob([fileContent], { type: 'text/csv;charset=utf-8;' });
        self.postMessage({ status: 'success', data: blob, fileName: fileName });

    } catch (error) {
        console.error("Error in web worker:", error);
        self.postMessage({ status: 'error', message: error.message });
    }
};
