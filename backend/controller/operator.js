const Operator = require("../Model/Operator");
const bcrypt = require("bcryptjs");

const createOperator = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password || String(username).trim() === "" || String(password).trim() === "") {
      return res.status(400).json({ message: "Username and password are required" });
    }

    // Check if operator already exists
    const existingOperator = await Operator.findOne({ username });
    if (existingOperator) {
      return res.status(400).json({ message: "Operator already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new operator
    const operator = new Operator({
      username,
      password: hashedPassword,
    });

    await operator.save();
    res.status(201).json({ message: "Operator created successfully" });
  } catch (error) {
    console.error("Error creating operator:", error);
    res.status(500).json({ message: "Error creating operator", error: error.message });
  }
};

const getAllOperators = async (req, res) => {
  try {
    const operators = await Operator.find({}, { password: 0 });
    res.status(200).json(operators);
  } catch (error) {
    console.error("Error fetching operators:", error);
    res.status(500).json({ message: "Error fetching operators", error: error.message });
  }
};

const deleteOperator = async (req, res) => {
  try {
    const deleted = await Operator.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Operator not found" });
    }
    res.status(200).json({ message: "Operator deleted successfully" });
  } catch (error) {
    console.error("Error deleting operator:", error);
    res.status(500).json({ message: "Error deleting operator", error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || String(newPassword).trim() === "") {
      return res.status(400).json({ message: "New password is required" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updated = await Operator.findByIdAndUpdate(req.params.id, {
      password: hashedPassword,
    });

    if (!updated) {
      return res.status(404).json({ message: "Operator not found" });
    }

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Error changing password", error: error.message });
  }
};

module.exports = {
  createOperator,
  getAllOperators,
  deleteOperator,
  changePassword,
};
