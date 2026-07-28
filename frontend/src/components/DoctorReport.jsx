"use client";

import React, { useState, useEffect } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { format } from "date-fns";
import api from "@/common/axios";
import { useModal } from "../context/ModalContext";
import TableScrollContainer from "@/components/ui/TableScrollContainer";

const DoctorReport = () => {
  const { showAlert } = useModal();
  const [doctors, setDoctors] = useState([]);
  const [doctorDiscount, setDoctorDiscount] = useState();
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);
  const [patients, setPatients] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await api.get("/doctors");
        setDoctors(response.data.doctors || []);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      }
    };
    fetchDoctors();
  }, []);

  const calculateTotalCommission = () => {
    return patients.reduce((total, patient) => {
      const commission = patient.referralFee - (patient.discount || 0);
      return total + commission;
    }, 0);
  };

  const handleSubmit = async () => {
    if (!selectedDoctor) {
      showAlert({
        title: 'Selection Required',
        message: 'Please select a doctor to generate the report.',
        type: 'warning'
      });
      return;
    }

    const { startDate, endDate } = dateRange[0];

    try {
      const reportResponse = await api.get(`/patientsReport`, {
        params: {
          doctorId: selectedDoctor,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
      const reportData = reportResponse.data;

      setPatients(reportData.patients || []);

      const doctorResponse = await api.get(`/doctor/${selectedDoctor}`);
      const doctorData = doctorResponse.data;

      setDoctorDiscount(doctorData.doctor.discount || 0);
      setShowTable(true);
      window.scrollTo({
        top: window.scrollY + 200,
        behavior: "smooth",
      });
    } catch (error) {
      console.error("Error fetching patients or doctor data:", error);
    }
  };

  const filteredDoctors = doctors.filter((doctor) =>
    doctor.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 mt-16 py-8 px-4 sm:px-8 w-full max-w-full transition-colors">
      <div className="w-full max-w-full space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs transition-colors">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-amber-400 bg-indigo-50 dark:bg-amber-950/60 px-3 py-1 rounded-full border border-indigo-200/60 dark:border-amber-800/60">
                Doctor Settlements
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-2">
              Doctor Referral Statement
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Audit individual doctor commissions and referral deductions
            </p>
          </div>
        </div>

        {/* Filter Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 p-6 shadow-sm space-y-6 transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="doctor" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Select Doctor
              </Label>
              <Select onValueChange={setSelectedDoctor}>
                <SelectTrigger id="doctor" className="rounded-xl border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100">
                  <SelectValue placeholder="Select a doctor profile..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  <Input
                    type="text"
                    placeholder="Search doctor name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-slate-200 dark:border-slate-700 mb-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                  <SelectItem value="0">None (Direct Cases)</SelectItem>
                  {filteredDoctors.map((doctor) => (
                    <SelectItem key={doctor._id} value={doctor._id}>
                      {doctor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col space-y-2">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Date Range
              </Label>
              <DateRangePicker
                onChange={(item) => setDateRange([item.selection])}
                ranges={dateRange}
                rangeColors={["#4f46e5"]}
                className="rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSubmit}
              className="bg-indigo-600 hover:bg-indigo-700 dark:bg-amber-600 dark:hover:bg-amber-700 text-white font-semibold rounded-xl text-sm px-6 py-2.5 shadow-md shadow-indigo-500/20 dark:shadow-amber-500/20 active:scale-95"
            >
              Generate Statement Report
            </Button>
          </div>
        </div>

        {/* Statement Table */}
        {showTable && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 p-6 shadow-sm space-y-4 transition-colors">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Patient Case Summary</h2>
              <span className="text-xs font-semibold text-indigo-700 dark:text-amber-400 bg-indigo-50 dark:bg-amber-950/60 px-3 py-1 rounded-full border border-indigo-200/60 dark:border-amber-800/60">
                {patients.length} Total Cases
              </span>
            </div>

            {patients.length > 0 ? (
              <TableScrollContainer>
                <table className="w-full text-left border-collapse min-w-max">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4">Serial No</th>
                      <th className="py-3.5 px-4">Patient Name</th>
                      <th className="py-3.5 px-4">SubCategory</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Price</th>
                      <th className="py-3.5 px-4">Discount</th>
                      <th className="py-3.5 px-4">Final Payment</th>
                      {selectedDoctor !== "0" && <th className="py-3.5 px-4">Referral Fee</th>}
                      {selectedDoctor !== "0" && <th className="py-3.5 px-4 text-right">Commission</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm text-slate-700 dark:text-slate-200">
                    {patients.map((patient) => {
                      const commission = patient.referralFee - (patient.discount || 0);
                      return (
                        <tr key={patient._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">{patient.serialNo}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">{patient.name}</td>
                          <td className="py-3.5 px-4">
                            <span className="bg-indigo-50 dark:bg-amber-950/60 text-indigo-700 dark:text-amber-400 font-semibold text-xs px-2.5 py-1 rounded-full border border-indigo-200/60 dark:border-amber-800/60">
                              {patient.subcategory}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">
                            {format(new Date(patient.createdAt), "yyyy-MM-dd")}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-900 dark:text-white">₹{patient.fees}</td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {patient.discount ? (
                              <span className="inline-block px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold border border-rose-200/60 dark:border-rose-800/80 text-xs shadow-xs">
                                ₹{patient.discount}
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 text-xs">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-amber-950/60 text-indigo-700 dark:text-amber-400 font-extrabold border border-indigo-200/60 dark:border-amber-800/80 text-xs shadow-xs">
                              ₹{patient.finalPayment}
                            </span>
                          </td>
                          {selectedDoctor !== "0" && (
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold border border-slate-200 dark:border-slate-600 text-xs shadow-xs">
                                ₹{patient.referralFee}
                              </span>
                            </td>
                          )}
                          {selectedDoctor !== "0" && (
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-extrabold border border-emerald-200/60 dark:border-emerald-800/80 text-xs shadow-xs">
                                ₹{commission}
                              </span>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                  {selectedDoctor !== "0" && (
                    <tfoot>
                      <tr className="bg-slate-50/80 dark:bg-slate-900/60 font-extrabold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700">
                        <td colSpan="8" className="py-4 px-4 text-right uppercase text-xs tracking-wider text-slate-600 dark:text-slate-300">
                          Total Commission Earned:
                        </td>
                        <td className="py-4 px-4 text-emerald-700 dark:text-emerald-400 text-right text-base font-extrabold">
                          ₹{calculateTotalCommission()}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </TableScrollContainer>
            ) : (
              <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm font-medium">
                No patient records found for the selected criteria.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorReport;
