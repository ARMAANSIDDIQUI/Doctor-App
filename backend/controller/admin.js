const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../Model/Admin');

// Admin login function
const AdminLogin = async (req, res) => {
    const username = req.body?.username || req.headers?.username;
    const password = req.body?.password || req.headers?.password;

    try {
        // Find the admin by username
        const admin = await Admin.findOne({ username });

        if (!admin) {
            return res.status(400).json({ message: 'Admin not found' });
        }

        // Check if the password matches
        const isMatch = await bcrypt.compare(password, admin.password);

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
};

const changeAdminPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    if (!newPassword || newPassword.trim() === "") {
      return res.status(400).json({ message: "New password is required" });
    }

    // Verify token and get admin ID
    const decoded = jwt.verify(token, "SECRET");
    const admin = await Admin.findById(decoded.admin._id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Hash new password and update directly without checking current password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    res.json({ message: "Password updated successfully!" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Error changing password" });
  }
};

module.exports = { AdminLogin, changeAdminPassword };
