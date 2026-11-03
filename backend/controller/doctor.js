const DoctorDB = require("../Model/Doctor");
const Order = require("../Model/Order");
const Unbilled = require("../Model/Unbilled");
const mongoose = require("mongoose");

const AddDoctor = async (req, res) => {
  const { name, phoneNo, address, totalCommission } = req.body;
  try {
    if (!name || String(name).trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Doctor name is required",
      });
    }

    // 'None' doctor validation: Check if the name is 'None' (case-insensitive)
    if (name.toLowerCase() === "none") {
      const noneDoctorExists = await DoctorDB.findOne({ name: /^None$/i });
      if (noneDoctorExists) {
        return res.status(409).json({
          success: false,
          message: "A doctor named 'None' already exists and cannot be created again.",
        });
      }
    }

    const newDoctor = new DoctorDB({ name, phoneNo, address, totalCommission });
    await newDoctor.save();

    res.status(200).json({
      success: true,
      message: "Doctor registration successful",
    });
  } catch (e) {
    console.error("Error adding doctor:", e);
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
    // If attempting to rename to 'None', ensure another 'None' doctor doesn't exist
    if (name && name.toLowerCase() === "none") {
      const existingNone = await DoctorDB.findOne({ name: /^None$/i, _id: { $ne: doctorId } });
      if (existingNone) {
        return res.status(409).json({
          success: false,
          message: "A doctor named 'None' already exists.",
        });
      }
    }

    const updatedDoctor = await DoctorDB.findByIdAndUpdate(
      doctorId,
      { name, phoneNo, address, totalCommission },
      { new: true, runValidators: true }
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
    console.error("Error updating doctor:", e);
    res.status(500).json({
      success: false,
      message: "Some error occurred",
    });
  }
};

const DeleteDoctor = async (req, res) => {
  const { doctorId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID format",
      });
    }

    // 1. Find the doctor to be deleted
    const doctorToDelete = await DoctorDB.findById(doctorId);
    if (!doctorToDelete) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Prevent deleting the placeholder 'None' doctor
    if (doctorToDelete.name.toLowerCase() === "none") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete the default 'None' placeholder doctor.",
      });
    }

    // 2. Find or create the 'None' doctor placeholder
    let noneDoctor = await DoctorDB.findOne({ name: /^None$/i });
    if (!noneDoctor) {
      console.log("Placeholder doctor 'None' not found. Creating a new one.");
      noneDoctor = await DoctorDB.create({
        name: "None",
        phoneNo: "0",
        address: "NA",
        totalCommission: 0,
      });
      if (!noneDoctor) {
        return res.status(500).json({
          success: false,
          message: "Failed to create placeholder doctor 'None'. Cannot proceed with deletion.",
        });
      }
    }

    const noneDoctorId = noneDoctor._id;

    // Match both ObjectId and String versions of doctorId
    const queryMatches = [doctorId, String(doctorId)];
    if (mongoose.Types.ObjectId.isValid(doctorId)) {
      queryMatches.push(new mongoose.Types.ObjectId(doctorId));
    }

    // 3. Reassign orders and unbilled records associated with the doctor to 'None' doctor
    await Order.updateMany(
      { referredBy: { $in: queryMatches } },
      { $set: { referredBy: noneDoctorId } }
    );

    await Unbilled.updateMany(
      { referredBy: { $in: queryMatches } },
      { $set: { referredBy: noneDoctorId } }
    );

    // 4. Delete the doctor record
    const deletedDoctor = await DoctorDB.findByIdAndDelete(doctorId);
    if (!deletedDoctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found (already reassigned orders)",
      });
    }

    res.status(200).json({
      success: true,
      message: `Doctor ${doctorToDelete.name} and all associated orders have been reassigned to 'None' doctor successfully.`,
    });
  } catch (e) {
    console.error("Error deleting doctor:", e);
    res.status(500).json({
      success: false,
      message: "Some error occurred",
    });
  }
};

const GetDoctorById = async (req, res) => {
  const { doctorId } = req.params;
  if (doctorId === "0" || String(doctorId).toLowerCase() === "none") {
    return res.status(200).json({
      success: true,
      message: "Doctor selected none",
      doctor: "none",
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
    console.error("Error fetching doctor:", e);
    res.status(500).json({
      success: false,
      message: "Some error occurred",
    });
  }
};

const GetAllDoctors = async (req, res) => {
  try {
    const { includeNone } = req.query;
    let query = {};
    if (includeNone !== "true") {
      query.name = { $not: /^None$/i };
    }

    const doctors = await DoctorDB.find(query);
    res.status(200).json({
      success: true,
      doctors,
    });
  } catch (e) {
    console.error("Error fetching all doctors:", e);
    res.status(500).json({
      success: false,
      message: "Some error occurred",
    });
  }
};

const fetchAllDoctorsFromDB = async () => {
  try {
    const doctors = await DoctorDB.find({ name: { $not: /^None$/i } });
    if (!doctors || doctors.length === 0) {
      throw new Error("No doctors found");
    }
    return doctors;
  } catch (error) {
    console.error("Error fetching doctors:", error.message);
    throw error;
  }
};

const getTotalDoctorsCount = async (req, res) => {
  try {
    const totalDoctors = await DoctorDB.countDocuments({ name: { $not: /^None$/i } });
    res.status(200).json({
      message: "Total doctor count fetched successfully.",
      totalDoctors: totalDoctors,
    });
  } catch (error) {
    console.error("Error fetching total doctor count:", error);
    res.status(500).json({
      message: "Error fetching total doctor count.",
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
  getTotalDoctorsCount,
};
