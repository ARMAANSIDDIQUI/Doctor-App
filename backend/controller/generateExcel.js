const XLSX = require("xlsx");
const nodemailer = require("nodemailer");
const { fetchAllOrdersFromDB } = require("./order"); // Adjust path
const { fetchAllDoctorsFromDB } = require("./doctor"); // Adjust path

const generateExcelReport = async () => {
  try {
    const orders = await fetchAllOrdersFromDB();
    const doctors = await fetchAllDoctorsFromDB(); // Fetch all doctors

    // Group orders by doctor and calculate total commission
    const doctorCommissions = {};

    orders.forEach((order) => {
      // Exclude orders with invalid or missing referredBy field
      if (!order.referredBy || order.referredBy === 0) return;

      const doctor = doctors.find((doc) => doc._id.toString() === order.referredBy);

      if (!doctor) return; // Skip if doctor not found

      if (!doctorCommissions[doctor._id]) {
        doctorCommissions[doctor._id] = {
          doctorName: doctor.name,
          totalCommission: 0,
        };
      }

      const commission = (order.referralFee || 0) - (order.discount || 0);
      doctorCommissions[doctor._id].totalCommission += commission;
    });

    // Prepare data for Excel
    const excelData = [];
    let serialNo = 1;

    for (const doctorId in doctorCommissions) {
      const doctorData = doctorCommissions[doctorId];
      excelData.push({
        "Serial No": serialNo++,
        "Doctor Name": doctorData.doctorName,
        "Total Commission": doctorData.totalCommission.toFixed(2),
      });
    }

    // Generate Excel
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Doctor Commissions Report");

    const filePath = "./Doctor_Commissions_Report.xlsx";
    XLSX.writeFile(wb, filePath);

    console.log("Excel Report Generated:", filePath);

    // Send Email with Nodemailer
    await sendEmailWithAttachment(filePath);

    return filePath;
  } catch (error) {
    console.error("Error generating Excel report:", error);
    throw error;
  }
};

const sendEmailWithAttachment = async (filePath) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", // Use your email service provider
      auth: {
        user: "gozoomtechnologies@gmail.com", // Replace with your email
        pass: "qwuyqyxwiystcbhf", // Replace with your email password or app password
      },
    });

    const mailOptions = {
      from: "gozoomtechnologies@gmail.com", // Sender address
      to: "gozoomtechnologies@gmail.com", // Recipient email
      subject: "Delight Diagnostics - Doctor Commissions Report",
      text: "Please find the attached Delight Diagnostics Doctor Commissions Report.",
      attachments: [
        {
          filename: "Doctor_Commissions_Report.xlsx",
          path: filePath,
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = {
  generateExcelReport,
};

