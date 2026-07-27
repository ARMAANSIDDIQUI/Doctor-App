import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '@/common/axios';
import { UserCheck, User, Phone, MapPin, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';

const DoctorForm = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phoneNo: '',
    address: '',
  });

  const [message, setMessage] = useState({ text: '', type: '' });
  const doctorId = location.state?._id;

  useEffect(() => {
    if (location.state) {
      setFormData(location.state);
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (formData.name.trim().toLowerCase() === 'none') {
      setMessage({ text: "The name 'None' is reserved and cannot be used.", type: 'error' });
      return;
    }

    try {
      let response;
      if (doctorId) {
        response = await api.put(`/doctor/${doctorId}`, formData);
        setMessage({ text: response.data.message || 'Doctor profile updated successfully!', type: 'success' });
      } else {
        response = await api.post('/doctor/add', formData);
        setMessage({ text: response.data.message || 'Doctor profile created successfully!', type: 'success' });
        setFormData({ name: '', phoneNo: '', address: '' });
      }
      
      setTimeout(() => navigate('/admin/doctor'), 1500);

    } catch (error) {
      console.error(error);
      const errorMessage = error.response?.data?.message || 'An error occurred while processing the request.';
      setMessage({ text: errorMessage, type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 mt-16 py-10 px-4 sm:px-8">
      <div className="max-w-xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/admin/doctor')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Doctor Directory
        </button>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{doctorId ? 'Update Doctor Profile' : 'Add New Doctor'}</h1>
              <p className="text-xs text-slate-500 mt-0.5">Define referral profile and contact information</p>
            </div>
          </div>

          {message.text && (
            <div className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 animate-in fade-in ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-rose-600" />}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Doctor Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Dr. John Doe"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  name="phoneNo"
                  value={formData.phoneNo}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Clinic / Hospital Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="City, Clinic address..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-indigo-500/20 transition-all active:scale-95"
            >
              {doctorId ? 'Update Profile' : 'Save Doctor Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DoctorForm;