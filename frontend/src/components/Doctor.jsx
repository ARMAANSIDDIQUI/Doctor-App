import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchDoctors } from "../store/doctor";
import api from '@/common/axios';
import { ShieldAlert, Trash2, X } from 'lucide-react'; // Added icons
import TableScrollContainer from "@/components/ui/TableScrollContainer";

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
    <div className="min-h-screen bg-slate-50 mt-16 pb-12 w-full max-w-full">
      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200/80 shadow-xs py-6 px-4 sm:px-8">
        <div className="w-full max-w-full mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Doctor Directory</h1>
            <p className="text-xs text-slate-500 mt-1">Manage registered doctors and referral commission profiles</p>
          </div>
          <button
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-95 text-sm"
            onClick={() => navigate("/admin/addDoctor")}
          >
            + Add New Doctor
          </button>
        </div>
      </div>

      {/* --- Message Banner --- */}
      {message.text && (
        <div className="w-full max-w-full mx-auto mt-4 px-4 sm:px-8">
          <div className={`p-4 rounded-xl text-center text-sm font-semibold border shadow-sm ${message.isError ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
            {message.text}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="w-full max-w-full mx-auto px-4 sm:px-8 py-6">
        {/* Search Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm font-semibold text-slate-700">
            Total Doctors: <span className="text-indigo-600 font-bold">{filteredDoctors.length}</span>
          </div>
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl shadow-xs text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Doctor Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-4">
          <TableScrollContainer>
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6">Name</th>
                  <th className="py-3.5 px-6">Phone Number</th>
                  <th className="py-3.5 px-6">Address</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredDoctors && filteredDoctors.length > 0 ? (
                  filteredDoctors.map((doctor) => (
                    <tr key={doctor._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-900 whitespace-nowrap">{doctor.name}</td>
                      <td className="py-4 px-6 whitespace-nowrap text-slate-600">{doctor.phoneNo}</td>
                      <td className="py-4 px-6 whitespace-nowrap text-slate-600">{doctor.address}</td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(doctor)}
                            className="bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/80 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(doctor)}
                            className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/80 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 flex items-center gap-1"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-slate-400 text-sm font-medium">
                      No doctors found matching "{searchTerm}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableScrollContainer>
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
