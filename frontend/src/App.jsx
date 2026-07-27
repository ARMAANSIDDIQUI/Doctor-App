import { useEffect, useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Route, Routes, useNavigate  } from "react-router-dom";
import Navbar from './components/Navbar';
import Doctor from './components/Doctor';
import CheckAuth from './common/CheckAuth';
import DoctorForm from './components/DoctorForm';
import DoctorReport from './components/DoctorReport';
import Category from './components/Category';
import CategoryForm from './components/CategoryForm';
import SubCategoryForm from './components/SubCategoryForm';
import PrintReport from './components/PrintReport';
import Patient from './components/patients/Patient';
import PatientForm from './components/patients/PatientForm';
import AdminDashBoard from './components/admin/AdminDashBoard';
import { checkAuth } from "./store/auth";
import { useDispatch, useSelector } from "react-redux";
import AdminLogin from './components/admin/AdminLogin';
import AdminNavbar from './components/AdminNavbar';
import AdminOrdersPage from './components/AdminOrderPage';
import MonthyReport from './components/MonthyReport';
import Login from './components/Login';
import Collections from './components/patients/Collections';
import AdminCollection from './components/admin/AdminCollection';
import Unbilled from './components/patients/Unbilled';
import Operator from './components/admin/Operator';
import ChangePassword from './components/admin/ChangePassword';
import { ModalProvider } from './context/ModalContext';

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('authToken')) {
      // Redirect to login if not authenticated
      navigate('/login');
    }
  }, [navigate]);

  return children;
};

function App() {
  const dispatch = useDispatch();

  return (
    <ModalProvider>
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
        <ToastContainer />
        <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login /> } />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navbar />
              <Patient />
            </ProtectedRoute>
          }
        />
        <Route
          path="/print-report"
          element={
            <ProtectedRoute>
              <Navbar />
              <PrintReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient-form"
          element={
            <ProtectedRoute>
              <Navbar />
              <PatientForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/collection"
          element={
            <ProtectedRoute>
              <Navbar />
              <Collections />
            </ProtectedRoute>
          }
        />
        <Route
          path="/unbilled-transactions"
          element={
            <ProtectedRoute>
              <Navbar />
              <Unbilled />
            </ProtectedRoute>
          }
          />

        {/* Admin Routes (scoped under /admin) */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected Admin Routes */}
        <Route path="/admin/*" element={
          <CheckAuth>
            <AdminNavbar />
            <Routes>
              <Route path="dashboard" element={<AdminDashBoard />} />
              <Route path="doctor" element={<Doctor />} />
              <Route path="addDoctor" element={<DoctorForm />} />
              <Route path="doctorReport" element={<DoctorReport />} />
              <Route path="monthlyReport" element={<MonthyReport />} />
              <Route path="category" element={<Category />} />
              <Route path="addCategory" element={<CategoryForm />} />
              <Route path="addSubcategory" element={<SubCategoryForm />} />
              <Route path="reports" element={<AdminOrdersPage />} />
              <Route path="collection" element={<AdminCollection />} />
              <Route path="operator" element={<Operator />} />
              <Route path="change-password" element={<ChangePassword />} />
            </Routes>
          </CheckAuth>
        } />
      </Routes>
    </div>
    </ModalProvider>
  );
}

export default App;

