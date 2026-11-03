const Operator = require("../Model/Operator");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const OpLogin = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const operator = await Operator.findOne({ username });

        if (!operator) {
            return res.status(400).json({ message: 'Operator not found' });
        }

        const isMatch = await bcrypt.compare(password, operator.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        const token = jwt.sign(
            { operator, role: 'operator' },
            process.env.JWT_SECRET || "SECRET",
            { expiresIn: '24h' }
        );
        res.status(200).json({ message: 'Logged in successfully', token });
    } catch (error) {
        console.error('Error during operator login:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { OpLogin };
