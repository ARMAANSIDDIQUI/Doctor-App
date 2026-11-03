const Patient = require("../Model/patient");
const DoctorDB = require("../Model/Doctor");
const Order = require("../Model/Order");
const mongoose = require("mongoose");

const AddPatient = async (req, res) => {
  const { name, age, gender, address, phoneNo } = req.body;
  try {
    if (!name || !phoneNo) {
      return res.status(400).json({
        success: false,
        message: "Name and phone number are required",
      });
    }

    const newPatient = new Patient({
      name,
      age,
      gender,
      address,
      phoneNo,
    });
    await newPatient.save();

    res.status(200).json({
      success: true,
      message: "Patient Registrated successful",
      patient: newPatient,
    });
  } catch (e) {
    console.error("Error adding patient:", e);
    res.status(500).json({
      success: false,
      message: "Some error occured",
    });
  }
};

const UpdatePatient = async (req, res) => {
  const { patientId } = req.params;
  const { name, age, gender, address, phoneNo } = req.body;

  try {
    const updatedPatient = await Patient.findByIdAndUpdate(
      patientId,
      { name, age, gender, address, phoneNo },
      { new: true, runValidators: true }
    );

    if (!updatedPatient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.status(200).json({
      message: "Patient data updated successfully",
      updatedPatient,
    });
  } catch (error) {
    console.error("Error updating patient data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getPatientById = async (req, res) => {
  const { patientId } = req.params;

  try {
    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.status(200).json({
      message: "Patient data retrieved successfully",
      patient,
    });
  } catch (error) {
    console.error("Error retrieving patient data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });

    res.status(200).json({
      message: "Patients retrieved successfully",
      patients: patients || [],
    });
  } catch (error) {
    console.error("Error retrieving patients data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getPatientsByPhone = async (req, res) => {
  const { phoneNo } = req.query;
  try {
    const patients = await Patient.find({ phoneNo });
    res.status(200).json({ patients: patients || [] });
  } catch (error) {
    console.error("Error fetching patients by phone:", error);
    res.status(500).json({ message: "Error fetching patients", error: error.message });
  }
};

const checkPatientisNewByPhone = async (req, res) => {
  const { phoneNo } = req.query;

  if (!phoneNo) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  try {
    const patient = await Patient.findOne({ phoneNo });

    if (patient) {
      return res.status(200).json({ message: "Patient exists", isNew: false, patient });
    } else {
      return res.status(200).json({ message: "Patient is new", isNew: true });
    }
  } catch (error) {
    console.error("Error checking patient by phone:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getPatientsByDoctorAndDate = async (req, res) => {
  const { doctorId, startDate, endDate } = req.query;

  try {
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Missing required parameters." });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    let doctorMatch;

    if (doctorId === "0" || String(doctorId).toLowerCase() === "none") {
      const noneDoc = await DoctorDB.findOne({ name: /^None$/i });
      const noneMatches = [0, "0", "none"];
      if (noneDoc) {
        noneMatches.push(noneDoc._id, String(noneDoc._id));
      }
      doctorMatch = { $in: noneMatches };
    } else {
      const matches = [doctorId, String(doctorId)];
      if (mongoose.Types.ObjectId.isValid(doctorId)) {
        matches.push(new mongoose.Types.ObjectId(doctorId));
      }
      doctorMatch = { $in: matches };
    }

    const patients = await Order.find({
      referredBy: doctorMatch,
      createdAt: { $gte: start, $lte: end },
    }).populate("referredBy").sort({ createdAt: -1 });

    res.status(200).json({ patients: patients || [] });
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ message: "Error fetching patients", error: error.message });
  }
};

const getTotalPatientsCount = async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments();

    res.status(200).json({
      message: "Total patient count fetched successfully.",
      totalPatients: totalPatients,
    });
  } catch (error) {
    console.error("Error fetching total patient count:", error);
    res.status(500).json({
      message: "Error fetching total patient count.",
      error: error.message,
    });
  }
};

module.exports = {
  AddPatient,
  UpdatePatient,
  getPatientById,
  getAllPatients,
  getPatientsByPhone,
  getPatientsByDoctorAndDate,
  checkPatientisNewByPhone,
  getTotalPatientsCount,
};
