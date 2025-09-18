import * as XLSX from "xlsx";

self.onmessage = async (event) => {
    const { params, reportType, categories } = event.data;
    
    try {
        const baseUrl = 'http://localhost:5000'; // Replace with your actual backend URL
        const queryParams = new URLSearchParams(params).toString();
        const url = `${baseUrl}/api/orders/filter?${queryParams}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const allOrders = data.orders || [];

        if (allOrders.length === 0) {
            self.postMessage({ status: 'error', message: 'No orders found to download.' });
            return;
        }

        let excelData = [];
        let sheetName = "";
        let fileName = "";

        if (reportType === 'detailed') {
            excelData = allOrders.map((order, index) => {
                const doctor = order.referredBy || {};
                const totalCommission = (order.referralFee || 0) - (order.discount || 0);
                const categoryData = categories.reduce((acc, category) => {
                    acc[category.name] = order.category === category.name ? order.subcategory || "N/A" : "";
                    return acc;
                }, {});

                return {
                    "Serial No": index + 1,
                    "Date": new Date(order.createdAt).toLocaleDateString('en-GB'),
                    "Patient Name": order.name || "Unknown",
                    "Doctor Name": doctor.name || "Unknown",
                    "Doctor Mobile": doctor.phoneNo || "N/A",
                    "Doctor Address": doctor.address || "N/A",
                    "Placed By": order.placedBy || "N/A",
                    ...categoryData,
                    "Discount": order.discount || 0,
                    "Final Payment": order.finalPayment || 0,
                    "Referral Fee": order.referralFee || 0,
                    "Total Commission": totalCommission,
                };
            });
            sheetName = "Detailed Report";
            fileName = "Detailed_Report.xlsx";
        } else if (reportType === 'grouped') {
            const grouped = allOrders.reduce((acc, order) => {
                const doctorId = order.referredBy?._id || "unreferred";
                const doctor = order.referredBy || { name: "Unknown", phoneNo: "N/A", address: "N/A" };
                
                if (!acc[doctorId]) {
                    acc[doctorId] = { doctor, orders: [] };
                }
                acc[doctorId].orders.push(order);
                return acc;
            }, {});

            excelData = Object.values(grouped).map((group, index) => {
                const totalCommission = group.orders.reduce(
                    (total, order) => total + ((order.referralFee || 0) - (order.discount || 0)),
                    0
                );
                return {
                    "Serial No": index + 1,
                    "Doctor Name": group.doctor.name || "Unknown",
                    "Total Commission": totalCommission,
                    "Doctor Mobile": group.doctor.phoneNo || "N/A",
                    "Doctor Address": group.doctor.address || "N/A",
                };
            });
            sheetName = "Doctor Report";
            fileName = "Doctor_Report.xlsx";
        } else {
            throw new Error("Invalid report type specified.");
        }

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        
        self.postMessage({ status: 'success', data: wbout, fileName: fileName });
    } catch (error) {
        console.error("Error in web worker:", error);
        self.postMessage({ status: 'error', message: error.message });
    }
};