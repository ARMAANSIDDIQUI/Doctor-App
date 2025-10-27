import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchDoctors } from "../store/doctor";
import api from '@/common/axios';
import { ShieldAlert, Trash2, X } from 'lucide-react'; // Added icons

const Doctor = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { doctors } = useSelector((state) => state.doctors);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // --- State for Modal and Messaging ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState(null);
  const [message, setMessage] = useState({ text: "", isError: false });

  useEffect(() => {
    dispatch(fetchDoctors());
  }, [dispatch]);

  const handleEdit = (doctor) => {
    navigate("/admin/addDoctor", { state: doctor });
  };

  // 1. Opens the confirmation modal
  const handleDeleteClick = (doctor) => {
    if (doctor.name.toLowerCase() === 'none') {
      // Show error message
      setMessage({ text: "Cannot delete the Doctor named 'None'.", isError: true });
      setTimeout(() => setMessage({ text: "", isError: false }), 3000);
      return; 
    }
    // Set the doctor to delete and open the modal
    setDoctorToDelete(doctor);
    setIsModalOpen(true);
  };

  // 2. Runs the actual delete logic
  const confirmDelete = async () => {
    if (!doctorToDelete) return;

    try {
      await api.delete(`/doctor/${doctorToDelete._id}`);
      setMessage({ text: "Doctor deleted successfully!", isError: false });
      dispatch(fetchDoctors());
    } catch (error) {
      console.error("Error deleting doctor:", error);
      setMessage({ text: "An error occurred while deleting the doctor.", isError: true });
    } finally {
      // Close modal and reset
      setIsModalOpen(false);
      setDoctorToDelete(null);
      // Clear message after 3 seconds
      setTimeout(() => setMessage({ text: "", isError: false }), 3000);
    }
  };

  useEffect(() => {
    if (doctors) {
      setFilteredDoctors(
        // The API at GET /doctors already filters out "None" by default,
        // so we don't need to filter it again on the frontend.
        doctors.filter((doctor) =>
            `${doctor.name} ${doctor.phoneNo}`
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          )
      );
    }
  }, [searchTerm, doctors]);

  return (
    <div className="min-h-screen bg-gray-100 mt-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-blue-900 text-white p-4 shadow-md gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Doctor Management</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-4 w-full sm:w-auto">
          <button
            className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
            onClick={() => navigate("/admin/addDoctor")}
          >
            Add New Doctor
          </button>
        </div>
      </div>

      {/* --- Message Banner --- */}
      {message.text && (
        <div className={`p-4 text-center text-white ${message.isError ? 'bg-red-500' : 'bg-green-500'}`}>
          {message.text}
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-2 sm:px-6 py-4 sm:py-6">
        {/* Search Bar */}
        <div className="flex justify-end mb-4">
          <input
            type="text"
            placeholder="Search by name or phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-auto p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Doctor List */}
        <div className="bg-white rounded-md shadow-md overflow-hidden">
          <div className="w-full overflow-x-auto">
            <div className="min-w-max">
              <table className="w-full border-collapse border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left font-medium text-gray-600 border-b whitespace-nowrap">Name</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-600 border-b whitespace-nowrap">Phone Number</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-600 border-b whitespace-nowrap">Address</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-600 border-b whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDoctors && filteredDoctors.length > 0 ? (
                    filteredDoctors.map((doctor) => (
                      <tr key={doctor._id} className="hover:bg-gray-100">
                        <td className="py-3 px-4 border-b whitespace-nowrap">{doctor.name}</td>
                        <td className="py-3 px-4 border-b whitespace-nowrap">{doctor.phoneNo}</td>
                        <td className="py-3 px-4 border-b whitespace-nowrap">{doctor.address}</td>
                        <td className="py-3 px-4 border-b whitespace-nowrap">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => handleEdit(doctor)}
                              className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 rounded"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(doctor)}
                              className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded flex items-center justify-center gap-1"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </td>
              _         </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-3 px-4 text-center text-gray-500">
                        No doctors found.
                      </td>
                    </tr>
                  )}
                </tbody>
      _       </table>
            </div>
          </div>
        </div>
      </div>

      {/* --- Confirmation Modal --- */}
      {isModalOpen && doctorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <ShieldAlert className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4 text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Delete Doctor
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete <strong>{doctorToDelete.name}</strong>?
                    All associated orders will be reassigned to 'None'. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:w-auto sm:text-sm"
                onClick={confirmDelete}
              >
                Delete
              </button>
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Doctor;
