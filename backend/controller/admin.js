const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../Model/Admin');  // Ensure this path is correct

// Admin login function
const AdminLogin = async (req, res) => {
    const username = req.body?.username || req.headers?.username;
    const password = req.body?.password || req.headers?.password;
    

    try {
        // Find the admin by username
        const admin = await Admin.findOne({ username });

        // Log the retrieved admin for debugging
        // console.log('Admin found:', admin);

        // If admin not found
        if (!admin) {
            return res.status(400).json({ message: 'Admin not found' });
        }

        // Check if the password matches
        const isMatch = await bcrypt.compare(password, admin.password);

        // If password is incorrect
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        // Generate JWT token with admin id
      const token = jwt.sign({ admin, role: 'admin' }, "SECRET", { expiresIn: '1h' });
      res.json({ message: 'Logged in successfully', token });

      

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

// const createAdmin = async () => {
//     const username = 'Armaan'; // your admin username
//     const password = 'armaan123'; // your admin password

//     // Hash the password before saving it to the database
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create and save the admin to the database
//     const admin = new Admin({
//         username,
//         password: hashedPassword,
//     });

//     try {
//         await admin.save();
//         console.log('Admin created successfully');
//     } catch (error) {
//         console.error('Error creating admin:', error);
//     }
// }

// // Call the createAdmin function to add the admin to the database
// createAdmin();

const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify token and get admin ID
    const decoded = jwt.verify(token, "SECRET");
    const admin = await Admin.findById(decoded.admin._id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Error changing password" });
  }
};

module.exports = { AdminLogin, changeAdminPassword };  // Export the correct function
