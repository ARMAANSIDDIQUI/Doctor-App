const express = require("express");
const checkAdminAuth = require("../middleware/checkAdminAuth");

const router = express.Router();

router.get("/checkauth", checkAdminAuth, (req, res) => {
  const user = req.user;
  const userData = user?.admin || user?.operator || {};

  // Clone to avoid mutating original and remove sensitive fields
  const sanitized = { ...userData };
  delete sanitized.password;

  res.status(200).json({
    success: true,
    message: "Authenticated user!",
    user: {
      ...sanitized,
      role: user.role,
    },
  });
});

module.exports = router;
