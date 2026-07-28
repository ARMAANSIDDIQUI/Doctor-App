import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setPhoneNo, fetchPatients, setIsNewEntry } from '../../store/patient';
import { useNavigate } from 'react-router-dom';
import { Phone, Search, AlertCircle, ArrowRight } from 'lucide-react';

const Patient = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchInitiated, setSearchInitiated] = useState(false);
  const { phoneNo, patients, loading } = useSelector((state) => state.patient);

  // Local state to handle phone validation message and selected patient
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  const handlePhoneNoChange = (e) => {
    const phone = e.target.value;
    dispatch(setPhoneNo(phone));
    setErrorMessage(''); // Reset error message when the user types
  };

  useEffect(() => {
    if (searchInitiated && !loading) {
      if (patients.length === 0) {
        dispatch(setIsNewEntry(true));
        navigate('/patient-form', { state: { patient: null, phoneNo: phoneNo } });
      } else if (patients.length === 1) {
        dispatch(setIsNewEntry(false));
        setSearchInitiated(false);
      } else if (patients.length > 1) {
        dispatch(setIsNewEntry(false));
        setSearchInitiated(false);
      }
    }
  }, [patients, searchInitiated, navigate, loading, phoneNo, dispatch]);

  const handleSearch = async (e) => {
    e.preventDefault();

    // Phone number validation
    if (phoneNo.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit phone number.');
      return;
    }
    setSearchInitiated(true);
    await dispatch(fetchPatients(phoneNo));
  };

  const handlePatientSelection = (e) => {
    const patientId = e.target.value;
    if (patientId === "new") {
      setSelectedPatient("new");
    } else {
      const selected = patients.find((patient) => patient._id === patientId);
      setSelectedPatient(selected);
    }
  };

  const handleProceed = () => {
    if (selectedPatient) {
      if (selectedPatient === "new") {
        dispatch(setIsNewEntry(true));
        navigate('/patient-form', { state: { patient: null, phoneNo: phoneNo } });
      } else {
        dispatch(setIsNewEntry(false));
        navigate('/patient-form', { state: { patient: selectedPatient } });
      }
    }
  };

  return (
    <div className="flex-1 w-full min-h-[calc(100vh-4rem)] pt-16 flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors relative overflow-hidden px-4">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Search Container */}
      <div className="relative z-10 w-full max-w-xl my-8">
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none">
          
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Search Patient
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enter 10-digit phone number to fetch records or create a new entry
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Phone className="h-5 w-5" />
              </div>
              <input
                type="text"
                id="phone-input"
                className="w-full pl-12 pr-28 py-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-base font-medium"
                placeholder="1234567890"
                pattern="^\d{10}$"
                maxLength={10}
                value={phoneNo}
                onChange={handlePhoneNoChange}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 bottom-2 px-5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? 'Searching...' : (
                  <>
                    <span>Search</span>
                    <Search className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </form>

          {/* Multiple Patients Dropdown Selection */}
          {patients.length >= 1 && (
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/60 space-y-4 animate-in fade-in duration-200">
              <div>
                <label
                  htmlFor="patient-select"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2"
                >
                  Select Existing Patient or Add New
                </label>
                <select
                  id="patient-select"
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer font-medium"
                  onChange={handlePatientSelection}
                  value={selectedPatient?._id || selectedPatient || ""}
                >
                  <option value="" disabled>
                    -- Choose matching record --
                  </option>
                  <option value="new" className="font-semibold text-indigo-600 dark:text-indigo-400">
                    + Register New Patient with same Number
                  </option>
                  {patients.map((patient) => (
                    <option key={patient._id} value={patient._id}>
                      {patient.name} ({patient.age || 'N/A'} yrs, {patient.gender || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleProceed}
                disabled={!selectedPatient}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Proceed to Patient Form</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3D Doctor Illustration - Seamlessly Integrated */}
      <div className="hidden lg:block absolute right-6 bottom-0 z-0 pointer-events-none max-w-[36rem] opacity-95">
        <img 
          src="/pateint.svg" 
          alt="Doctor Illustration" 
          className="w-full max-h-[78vh] object-contain drop-shadow-xl" 
        />
      </div>
    </div>
  );
};

export default Patient;
