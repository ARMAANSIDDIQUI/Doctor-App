import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchTotalDoctorsCount } from "../../store/doctor/index.js";
import { fetchTotalPatientsCount } from "../../store/patient/index.js";
import { fetchTotalOrdersCount } from "../../store/order/index.js";
import { UserCheck, Users, Receipt, FileText, Tag, ArrowRight } from 'lucide-react';

const AdminDashBoard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { totalDoctors, loading: doctorsLoading } = useSelector((state) => state.doctors);
  const { totalPatients, loading: patientsLoading } = useSelector((state) => state.patient);
  const { totalOrders, loading: ordersLoading } = useSelector((state) => state.order);

  useEffect(() => {
    dispatch(fetchTotalDoctorsCount());
    dispatch(fetchTotalPatientsCount());
    dispatch(fetchTotalOrdersCount());
  }, [dispatch]);

  const quickActions = [
    { label: 'Register Doctor', desc: 'Add new doctor profile & fee setup', path: '/admin/addDoctor', icon: UserCheck, color: 'bg-indigo-50 dark:bg-amber-950/50 text-indigo-600 dark:text-amber-400' },
    { label: 'Manage Categories', desc: 'Configure scan categories & subcategories', path: '/admin/category', icon: Tag, color: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' },
    { label: 'View Transactions', desc: 'Search, alter & export order reports', path: '/admin/reports', icon: Receipt, color: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400' },
    { label: 'Monthly Reports', desc: 'Generate doctor commission summary', path: '/admin/monthlyReport', icon: FileText, color: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 mt-16 py-10 px-4 sm:px-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs transition-colors">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-amber-400 bg-indigo-50 dark:bg-amber-950/60 px-3 py-1 rounded-full border border-indigo-200/60 dark:border-amber-800/60">
                Admin Console
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-2">
              Delight Diagnostics Overview
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time statistics & management metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/admin/reports')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-amber-600 dark:hover:bg-amber-700 text-white rounded-xl font-semibold text-xs shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Receipt className="h-4 w-4 text-white" />
              View Transactions
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-between transition-colors">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Registered Doctors</p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {doctorsLoading ? "..." : totalDoctors}
              </h3>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-amber-400 flex items-center justify-center border border-indigo-200/50 dark:border-indigo-800/50">
              <UserCheck className="h-7 w-7" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-between transition-colors">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Patients</p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {patientsLoading ? "..." : totalPatients}
              </h3>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/50 dark:border-emerald-800/50">
              <Users className="h-7 w-7" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-between transition-colors">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Orders & Cases</p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {ordersLoading ? "..." : totalOrders}
              </h3>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/50 dark:border-blue-800/50">
              <Receipt className="h-7 w-7" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <div
                  key={idx}
                  onClick={() => navigate(action.path)}
                  className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className={`h-11 w-11 rounded-xl ${action.color} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-amber-400 transition-colors text-sm">
                      {action.label}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {action.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-amber-400">
                    <span>Open</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashBoard;
