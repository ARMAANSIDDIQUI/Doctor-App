import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

// Using new store to fetch count api controllers for fast dashboard load-Armaan Siddiqui
import { fetchTotalDoctorsCount } from "../../store/doctor/index.js";
import { fetchTotalPatientsCount } from "../../store/patient/index.js";
import { fetchTotalOrdersCount } from "../../store/order/index.js";

const AdminDashBoard = () => {
  const dispatch = useDispatch();

  // Selecting total counts from the Redux store
  const { totalDoctors, loading: doctorsLoading } = useSelector((state) => state.doctors);
  const { totalPatients, loading: patientsLoading } = useSelector((state) => state.patient);
  const { totalOrders, loading: ordersLoading } = useSelector((state) => state.order);

  // Fetch only the total counts on component mount
  useEffect(() => {
    dispatch(fetchTotalDoctorsCount());
    dispatch(fetchTotalPatientsCount());
    dispatch(fetchTotalOrdersCount());
  }, [dispatch]);

  return (
    <div className="flex h-screen bg-gray-100 mt-16">
      {/* Sidebar can go here */}

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <header className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="p-6 bg-white rounded-md shadow-md">
            <h3 className="text-lg font-medium text-gray-600">Total Doctors</h3>
            <p className="mt-2 text-3xl font-bold text-gray-800">
              {doctorsLoading ? "Loading..." : totalDoctors}
            </p>
          </div>
          <div className="p-6 bg-white rounded-md shadow-md">
            <h3 className="text-lg font-medium text-gray-600">Total Patients</h3>
            <p className="mt-2 text-3xl font-bold text-gray-800">
              {patientsLoading ? "Loading..." : totalPatients}
            </p>
          </div>
          <div className="p-6 bg-white rounded-md shadow-md">
            <h3 className="text-lg font-medium text-gray-600">Total Cases</h3>
            <p className="mt-2 text-3xl font-bold text-gray-800">
              {ordersLoading ? "Loading..." : totalOrders}
            </p>
          </div>
        </div>

        {/* <section className="mt-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Recent Activities</h3>
          <div className="bg-white p-4 rounded-md shadow-md">
            <ul className="divide-y divide-gray-200">
              {doctorsLoading || patientsLoading || ordersLoading ? (
                <li className="py-2 text-gray-600">Loading recent activities...</li>
              ) : (
                <>
                  <li className="py-2 flex justify-between">
                    <span className="text-gray-600">Data</span>
                    <span className="text-sm text-gray-400">doctor</span>
                  </li>
                  <li className="py-2 flex justify-between">
                    <span className="text-gray-600">Data</span>
                    <span className="text-sm text-gray-400">doctor</span>
                  </li>
                  <li className="py-2 flex justify-between">
                    <span className="text-gray-600">data</span>
                    <span className="text-sm text-gray-400">doctor</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </section> */}
      </main>
    </div>
  );
};

export default AdminDashBoard;
