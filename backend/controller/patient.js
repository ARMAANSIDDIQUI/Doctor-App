const Patient = require("../Model/patient");
const DoctorDB = require("../Model/Doctor");
const Order = require('../Model/Order');

const AddPatient = async (req, res) => {
  const { name, age, gender, address, phoneNo } = req.body;
  try {
    const newPatient = new Patient({
      name, age, gender, address, phoneNo
    });
    await newPatient.save();

    res.status(200).json({
      success: true,
      message: "Patient Registrated successful",
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured",
    });
  }
}
 
const UpdatePatient = async (req, res) => {
  const { patientId } = req.params; // Extract patient ID from the URL parameters
  const { name, age, gender, address, phoneNo } = req.body;

  try {
    // Example: Update the patient data in a database (assuming MongoDB as an example)
    const updatedPatient = await Patient.findByIdAndUpdate(
      patientId,
      {
        name,
        age,
        gender,
        address,
        phoneNo,
      },
      { new: true } // Returns the updated document
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
    // Fetch patient data by ID (assuming MongoDB as an example)
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
    // Fetch all patient data
    const patients = await Patient.find();

    if (!patients || patients.length === 0) {
      return res.status(404).json({ message: "No patients found" });
    }

    res.status(200).json({
      message: "Patients retrieved successfully",
      patients,
    });
  } catch (error) {
    console.error("Error retrieving patients data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const getPatientsByPhone = async (req, res) => {

  const { phoneNo } = req.query;
  try {
    const patients = await Patient.find({ phoneNo: phoneNo });
    res.status(200).json({ patients });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Error fetching patients", error });
  }


}

const checkPatientisNewByPhone = async (req, res) => {
    const { phoneNo } = req.query; // Extract phone number from query
  
    if (!phoneNo) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
  
    try {
      // Check if a patient with the provided phone number exists in the database
      const patient = await Patient.findOne({ phoneNo });
  
      if (patient) {
        // If patient is found, it means the patient is not new
        return res.status(200).json({ message: 'Patient exists', isNew: false });
      } else {
        // If patient is not found, the patient is new
        return res.status(200).json({ message: 'Patient is new', isNew: true });
      }
    } catch (error) {
      console.error('Error checking patient by phone:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
  



  const getPatientsByDoctorAndDate = async (req, res) => {
    const { doctorId, startDate, endDate } = req.query;
  
    try {
      // Validate request parameters
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Missing required parameters." });
      }
  
      // Convert startDate and endDate to Date objects
      const start = new Date(startDate);
      const end = new Date(endDate);
  
      let patients;
  
      if (doctorId === "0") {
        // Fetch patients where referredBy is 0
        patients = await Order.find({
          referredBy: 0,
          createdAt: { $gte: start, $lte: end },
        });
      } else {
        // Fetch patients referred by the specific doctor within the date range
        patients = await Order.find({
          referredBy: doctorId, // Assuming `referredBy` stores the doctor ID in the Order model
          createdAt: { $gte: start, $lte: end },
        });
      }
  
      // If no patients found
      if (!patients.length) {
        return res.status(404).json({ message: "No patients found for the specified criteria." });
      }
  
      // Send the array of patients
      res.status(200).json({ patients });
    } catch (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ message: "Error fetching patients", error });
    }
  };

// Added New Controller for patient count-Armaan Siddiqui
/**
 * @description: Fetches the total count of patients.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {object} - JSON response containing the total patient count.
 */
const getTotalPatientsCount = async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments();

    res.status(200).json({
      message: 'Total patient count fetched successfully.',
      totalPatients: totalPatients,
    });
  } catch (error) {
    console.error('Error fetching total patient count:', error);
    res.status(500).json({
      message: 'Error fetching total patient count.',
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
  getPatientsByDoctorAndDate, // Add the new API here
  checkPatientisNewByPhone,
  getTotalPatientsCount
};