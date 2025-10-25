import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '@/common/axios';

const DoctorForm = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phoneNo: '',
    address: '',
  });

  // State for handling success/error messages
  const [message, setMessage] = useState({ text: '', type: '' });

  const doctorId = location.state?._id;

  useEffect(() => {
    if (location.state) {
      setFormData(location.state);
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' }); // Clear previous message

    //Add client-side validation for "None"
    if (formData.name.trim().toLowerCase() === 'none') {
        setMessage({ text: "The name 'None' is reserved and cannot be used.", type: 'error' });
        return;
    }

    try {
      let response;
      if (doctorId) {
        // Update Doctor
        response = await api.put(`/doctor/${doctorId}`, formData);
        setMessage({ text: response.data.message || 'Doctor updated successfully!', type: 'success' });
      } else {
        // Add New Doctor
        response = await api.post('/doctor/add', formData);
        setMessage({ text: response.data.message || 'Doctor added successfully!', type: 'success' });
        setFormData({
          name: '',
          phoneNo: '',
          address: '',
        });
      }
      
      // Navigate back after 2 seconds
      setTimeout(() => navigate('/admin/doctor'), 2000);

    } catch (error) {
      console.error(error);
      // 5. Enhanced error handling to show specific backend messages
      const errorMessage = error.response?.data?.message || 'An error occurred while processing the request.';
      setMessage({ text: errorMessage, type: 'error' });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 mt-16">
      <h1 className="text-3xl font-bold mb-8 text-blue-600"> {doctorId ? 'Update Doctor' : 'Add New Doctor'}</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md"
      >
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name:
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="phoneNo" className="block text-sm font-medium text-gray-700">
            Phone No:
          </label>
          <input
            type="text"
            id="phoneNo"
            name="phoneNo"
            value={formData.phoneNo}
            onChange={handleChange}
            className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Address:
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {doctorId ? 'Update Doctor' : 'Save Doctor'}
        </button>
      </form>

      {/* Conditionally styled message */}
      {message.text && (
        <p className={`mt-4 text-lg font-semibold ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
};

export default DoctorForm;