const DoctorDB = require("../Model/Doctor");
const Order = require("../Model/Order");
const mongoose = require('mongoose'); // <--- CRITICAL: Mongoose import needed for explicit casting

// const AddDoctor = async (req, res) => {
//   const { name, phoneNo, address, totalCommission } = req.body;
//   try {
//     // const CheckDoctor = await DoctorDB.findOne({ phoneNo });
//     // if (CheckDoctor) {
//     //   return res.json({
//     //     success: false,
//     //     message: "Doctor already exists with the same phone no! Please try again",
//     //   });
//     // }

//     const newDoctor = new DoctorDB({ name, phoneNo, address, totalCommission });
//     await newDoctor.save();

//     res.status(200).json({
//       success: true,
//       message: "Doctor registration successful",
//     });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({
//       success: false,
//       message: "Some error occurred",
//     });
//   }
// };


const AddDoctor = async (req, res) => {
  const { name, phoneNo, address, totalCommission } = req.body;
  try {
    // --- START: 'None' doctor validation ---
    // Check if the name is 'None' (case-insensitive)
    if (name.toLowerCase() === 'none') {
      // If so, check if a 'None' doctor already exists in the database
      const noneDoctorExists = await DoctorDB.findOne({ name: /^None$/i });

      // If it exists, block the creation and return an error
      if (noneDoctorExists) {
        return res.status(409).json({ // 409 Conflict is an appropriate HTTP status
          success: false,
          message: "A doctor named 'None' already exists and cannot be created again.",
        });
      }
    }
    // --- END: 'None' doctor validation ---

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

// const DeleteDoctor = async (req, res) => {
//   const { doctorId } = req.params;

//   try {
//     const deletedDoctor = await DoctorDB.findByIdAndDelete(doctorId);

//     if (!deletedDoctor) {
//       return res.status(404).json({
//         success: false,
//         message: "Doctor not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Doctor deleted successfully",
//     });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({
//       success: false,
//       message: "Some error occurred",
//     });
//   }
// };

// Get doctor by ID






// Created New controller for Doctor Delete that rewrites the reffered by of orders to id of none- Armaan Siddiqui


const DeleteDoctor = async (req, res) => {
    const { doctorId } = req.params;

    try {
        // 1. Find the doctor to be deleted (This implicitly casts doctorId to ObjectId)
        const doctorToDelete = await DoctorDB.findById(doctorId);
        if (!doctorToDelete) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found",
            });
        }

        // 2. Find or create the "None" doctor placeholder (using case-insensitive search for safety)
        let noneDoctor = await DoctorDB.findOne({ name: /^None$/i });
        
        if (!noneDoctor) {
            console.log("Placeholder doctor 'None' not found. Creating a new one.");
            noneDoctor = await DoctorDB.create({
                name: 'None',
                phoneNo: '0',
                address: 'NA',
                totalCommission: 0 // Added for schema consistency
            });
            if (!noneDoctor) {
                const errorMessage = "Failed to create placeholder doctor 'None'. Cannot proceed with deletion.";
                console.error(`Error: ${errorMessage}`);
                return res.status(500).json({
                    success: false,
                    message: errorMessage,
                });
            }
        }
        
        const noneDoctorId = noneDoctor._id;

        // CRITICAL FIX: Force the string doctorId into a true Mongoose ObjectId object
        let targetDoctorId = doctorId;
        if (mongoose.Types.ObjectId.isValid(doctorId)) {
            targetDoctorId = new mongoose.Types.ObjectId(doctorId);
        }

        // 3. Update all orders associated with the doctor to be deleted
        // This query now uses the explicitly cast ObjectId, ensuring a match.
        await Order.updateMany(
            { referredBy: targetDoctorId }, // <-- Use the forced ObjectId
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
        console.error(e);
        res.status(500).json({
            success: false,
            message: "Some error occurred",
        });
    }
};


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
      // 1. Check for the includeNone query parameter
      const { includeNone } = req.query;

      // 2. Set up the query
      let query = {};
      if (includeNone !== 'true') {
        // DEFAULT: Filter out the "None" doctor (case-insensitive)
        query.name = { $not: /^None$/i };
      }
      // If includeNone === 'true', query remains {} and will fetch all doctors.
      
      const doctors = await DoctorDB.find(query); // 3. Execute the query
  
      // Returning an empty array is valid, so we only check for a database error
      if (!doctors) {
        return res.status(500).json({
          success: false,
          message: "An error occurred while fetching doctors",
        });
      }
  
      res.status(200).json({
        success: true,
        doctors, // This will be [] if no doctors match, which is correct
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
    // This function is used internally, so it should filter "None" by default
    const doctors = await DoctorDB.find({ name: { $not: /^None$/i } });
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
 * @param {object} req - The request object,
 * @param {object} res - The response object.
 * @returns {object} - JSON response containing the total doctor count.
 */
const getTotalDoctorsCount = async (req, res) => {
  try {
    // Filter out the "None" doctor from the count by default
    const totalDoctors = await DoctorDB.countDocuments({ name: { $not: /^None$/i } });

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
