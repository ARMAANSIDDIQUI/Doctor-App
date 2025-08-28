const DoctorDB = require("../Model/Doctor");

const AddDoctor = async (req, res) => {
  const { name, phoneNo, address, totalCommission } = req.body;
  try {
    // const CheckDoctor = await DoctorDB.findOne({ phoneNo });
    // if (CheckDoctor) {
    //   return res.json({
    //     success: false,
    //     message: "Doctor already exists with the same phone no! Please try again",
    //   });
    // }

    const newDoctor = new DoctorDB({ name, phoneNo, address, totalCommission });
    await newDoctor.save();

    res.status(200).json({
      success: true,
      message: "Doctor registration successful",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred",
    });
  }
};

const UpdateDoctor = async (req, res) => {
  const { doctorId } = req.params;
  const { name, phoneNo, address, totalCommission } = req.body;

  try {
    const updatedDoctor = await DoctorDB.findByIdAndUpdate(
      doctorId,
      { name, phoneNo, address, totalCommission },
      { new: true } // Return the updated document
    );

    if (!updatedDoctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Doctor updated successfully",
      updatedDoctor,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred",
    });
  }
};

const DeleteDoctor = async (req, res) => {
  const { doctorId } = req.params;

  try {
    const deletedDoctor = await DoctorDB.findByIdAndDelete(doctorId);

    if (!deletedDoctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Doctor deleted successfully",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred",
    });
  }
};

// Get doctor by ID
const GetDoctorById = async (req, res) => {
    const { doctorId } = req.params;
    if (doctorId==0){
      return res.status(200).json({
        success: true,
        message: "Doctor selected none",
        doctor:"none"
      });

    }
  
    try {
      const doctor = await DoctorDB.findById(doctorId);
  
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }
  
      res.status(200).json({
        success: true,
        doctor,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        success: false,
        message: "Some error occurred",
      });
    }
  };
  
  // Get all doctors
  const GetAllDoctors = async (req, res) => {
    try {
      const doctors = await DoctorDB.find();
  
      if (!doctors || doctors.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No doctors found",
        });
      }
  
      res.status(200).json({
        success: true,
        doctors,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        success: false,
        message: "Some error occurred",
      });
    }
  };

  const fetchAllDoctorsFromDB = async () => {
  try {
    const doctors = await DoctorDB.find();
    if (!doctors || doctors.length === 0) {
      throw new Error("No doctors found");
    }
    // console.log("Fetched all doctors from DB:", doctors);
    return doctors;
  } catch (error) {
    console.error("Error fetching doctors:", error.message);
    throw error;
  }
};


// Added New Controller for DOctor count-Armaan Siddiqui
/**
 * @description: Fetches the total count of doctors.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {object} - JSON response containing the total doctor count.
 */
const getTotalDoctorsCount = async (req, res) => {
  try {
    const totalDoctors = await DoctorDB.countDocuments();

    res.status(200).json({
      message: 'Total doctor count fetched successfully.',
      totalDoctors: totalDoctors,
    });
  } catch (error) {
    console.error('Error fetching total doctor count:', error);
    res.status(500).json({
      message: 'Error fetching total doctor count.',
      error: error.message,
    });
  }
};
  

module.exports = {
  AddDoctor,
  UpdateDoctor,
  DeleteDoctor,
  GetDoctorById,
  GetAllDoctors,
  fetchAllDoctorsFromDB,
  getTotalDoctorsCount
};
