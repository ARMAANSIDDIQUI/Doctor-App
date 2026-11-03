const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../Model/Admin');

// Admin login function
const AdminLogin = async (req, res) => {
    const username = req.body?.username || req.headers?.username;
    const password = req.body?.password || req.headers?.password;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const admin = await Admin.findOne({ username });

        if (!admin) {
            return res.status(400).json({ message: 'Admin not found' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        const token = jwt.sign(
            { admin, role: 'admin' },
            process.env.JWT_SECRET || 'SECRET',
            { expiresIn: '24h' }
        );
        res.status(200).json({ message: 'Logged in successfully', token });
    } catch (error) {
        console.error('Error during admin login:', error);
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET");
    if (!decoded || !decoded.admin?._id) {
      return res.status(401).json({ message: "Invalid admin token" });
    }

    const admin = await Admin.findById(decoded.admin._id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Error changing password", error: error.message });
  }
};

module.exports = { AdminLogin, changeAdminPassword };
