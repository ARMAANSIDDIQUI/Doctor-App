import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "@/common/axios";
import { useModal } from "../../context/ModalContext";
import { Users, UserPlus, KeyRound, Trash2, X, Lock, User, Eye, EyeOff } from 'lucide-react';

const Operator = () => {
  const { showConfirm } = useModal();
  const [operators, setOperators] = useState([]);
  const [newOperator, setNewOperator] = useState({ username: "", password: "" });
  const [isAddingOperator, setIsAddingOperator] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [showAddPass, setShowAddPass] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      const response = await api.get("/operators");
      setOperators(response.data);
    } catch (error) {
      toast.error("Failed to fetch operators");
    }
  };

  const handleAddOperator = async (e) => {
    e.preventDefault();
    try {
      await api.post("/operators", newOperator);
      toast.success("Operator added successfully");
      setIsAddingOperator(false);
      setNewOperator({ username: "", password: "" });
      fetchOperators();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add operator");
    }
  };

  const handleDeleteOperator = async (id) => {
    const confirmed = await showConfirm({
      title: "Delete Operator Account",
      message: "Are you sure you want to delete this operator account? They will lose access immediately.",
      type: "danger"
    });
    if (!confirmed) return;
    try {
      await api.delete(`/operators/${id}`);
      toast.success("Operator deleted successfully");
      fetchOperators();
    } catch (error) {
      toast.error("Failed to delete operator");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/operators/${selectedOperator._id}/password`, { newPassword });
      toast.success("Password changed successfully");
      setIsChangingPassword(false);
      setSelectedOperator(null);
      setNewPassword("");
    } catch (error) {
      toast.error("Failed to change password");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 mt-16 pb-12">
      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200/80 shadow-xs py-6 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Operator Accounts</h1>
            <p className="text-xs text-slate-500 mt-1">Manage staff login credentials and security access</p>
          </div>
          <button
            onClick={() => setIsAddingOperator(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-95 text-sm"
          >
            <UserPlus className="h-4 w-4" /> Add New Operator
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Accounts</span>
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200/60">
              {operators.length} Total Staff
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6">Username</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {operators.map((operator) => (
                  <tr key={operator._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                        {operator.username[0]?.toUpperCase()}
                      </div>
                      <span>{operator.username}</span>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedOperator(operator);
                            setIsChangingPassword(true);
                          }}
                          className="bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/80 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5"
                        >
                          <KeyRound size={13} /> Change Password
                        </button>
                        <button
                          onClick={() => handleDeleteOperator(operator._id)}
                          className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/80 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 flex items-center gap-1"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Operator Modal */}
        {isAddingOperator && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 w-full max-w-md space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">New Operator</h2>
                </div>
                <button
                  onClick={() => setIsAddingOperator(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddOperator} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={newOperator.username}
                      onChange={(e) => setNewOperator({ ...newOperator, username: e.target.value })}
                      placeholder="Operator username"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showAddPass ? "text" : "password"}
                      value={newOperator.password}
                      onChange={(e) => setNewOperator({ ...newOperator, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddPass(!showAddPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showAddPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingOperator(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md transition-all active:scale-95"
                  >
                    Create Operator
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {isChangingPassword && selectedOperator && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 w-full max-w-md space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Change Password</h2>
                    <p className="text-xs text-slate-500">For user: <span className="font-semibold text-slate-800">{selectedOperator.username}</span></p>
                  </div>
                </div>
                <button
                  onClick={() => { setIsChangingPassword(false); setSelectedOperator(null); }}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showChangePass ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowChangePass(!showChangePass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showChangePass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsChangingPassword(false); setSelectedOperator(null); }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-xs shadow-md transition-all active:scale-95"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Operator;
