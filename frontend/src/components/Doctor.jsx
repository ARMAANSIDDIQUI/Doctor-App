import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchDoctors } from "../store/doctor";
import api from '@/common/axios';

const Doctor = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { doctors } = useSelector((state) => state.doctors);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchDoctors());
  }, [dispatch]);

  const handleEdit = (doctor) => {
    navigate("/admin/addDoctor", { state: doctor });
  };

  const handleDelete = async (id, name) => {
    // Check if the doctor's name is "none"
    if (name.toLowerCase() === 'none') {
        alert("Cannot delete the Doctor named 'None'.");
        return; 
    }

    if (window.confirm("Are you sure you want to delete this doctor?")) {
      try {
        await api.delete(`/doctor/${id}`);
        alert("Doctor deleted successfully!");
        dispatch(fetchDoctors());
      } catch (error) {
        console.error("Error deleting doctor:", error);
        alert("An error occurred while deleting the doctor. Please try again.");
      }
    }
  };

  useEffect(() => {
    if (doctors) {
      setFilteredDoctors(
        doctors
          // 1. First, filter out any doctor named "None"
          .filter((doctor) => doctor.name.toLowerCase() !== 'none')
          // 2. Then, apply the search term to the remaining doctors
          .filter((doctor) =>
            `${doctor.name} ${doctor.phoneNo}`
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          )
      );
    }
  }, [searchTerm, doctors]);

  return (
    <div className="min-h-screen bg-gray-100 mt-16">
      {/* Header - Made Responsive */}
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

      {/* Main Content - Made Responsive */}
      <div className="container mx-auto px-2 sm:px-6 py-4 sm:py-6">
        {/* Search Bar - Made Responsive */}
        <div className="flex justify-end mb-4">
          <input
            type="text"
            placeholder="Search by name or phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-auto p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Doctor List - Made Responsive with Horizontal Scroll */}
        <div className="bg-white rounded-md shadow-md overflow-hidden">
          <div className="w-full overflow-x-auto">
            <div className="min-w-max">
              <table className="w-full border-collapse border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left font-medium text-gray-600 border-b whitespace-nowrap">
                      Name
                    </th>
                    <th className="py-3 px-4 text-left font-medium text-gray-600 border-b whitespace-nowrap">
                      Phone Number
                    </th>
                    <th className="py-3 px-4 text-left font-medium text-gray-600 border-b whitespace-nowrap">
                      Address
                    </th>
                    <th className="py-3 px-4 text-left font-medium text-gray-600 border-b whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDoctors && filteredDoctors.length > 0 ? (
                    filteredDoctors.map((doctor) => (
                      <tr key={doctor._id} className="hover:bg-gray-100">
                        <td className="py-3 px-4 border-b whitespace-nowrap">
                          {doctor.name}
                        </td>
                        <td className="py-3 px-4 border-b whitespace-nowrap">
                          {doctor.phoneNo}
                        </td>
                        <td className="py-3 px-4 border-b whitespace-nowrap">
                          {doctor.address}
                        </td>
                        <td className="py-3 px-4 border-b whitespace-nowrap">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => handleEdit(doctor)}
                              className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 rounded"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(doctor._id, doctor.name)}
                              className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="py-3 px-4 text-center text-gray-500"
                      >
                        No doctors found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Doctor;