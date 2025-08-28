const express = require("express");
const { AddDoctor, UpdateDoctor, DeleteDoctor, GetDoctorById, GetAllDoctors,getTotalDoctorsCount} = require("../controller/doctor");
const router = express.Router();

router.post('/doctor/add',AddDoctor);
router.put('/doctor/:doctorId',UpdateDoctor);
router.delete('/doctor/:doctorId',DeleteDoctor);
router.get('/doctor/:doctorId',GetDoctorById);
router.get('/doctors',GetAllDoctors);
router.get('/doctors/count', getTotalDoctorsCount); // New route to get the count-Armaan Siddiqui

module.exports = router;