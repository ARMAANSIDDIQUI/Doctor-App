import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/common/axios';
import { Stethoscope, User, Lock, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/login', { username, password });
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('operatorName', username);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials or server error');
      console.error('Login failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-50/80 via-slate-50 to-blue-50/60 p-4 sm:p-6">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-white border border-slate-200/80 shadow-2xl grid grid-cols-1 md:grid-cols-2">
        {/* Left Side: Decorative Panel */}
        <div className="hidden md:flex flex-col justify-between p-8 bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 text-white relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-400/20 rounded-full blur-2xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md p-2 text-white shadow-md flex items-center justify-center border border-white/20">
                <Stethoscope className="h-6 w-6" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">DoctorApp</span>
            </div>

            <div className="mt-12 space-y-4">
              <h2 className="text-3xl font-extrabold text-white leading-tight">
                Operator Portal
              </h2>
              <p className="text-indigo-100 text-sm leading-relaxed">
                Log in to manage billing records, patient reports, ultrasound transactions, and doctor commission reports efficiently.
              </p>
            </div>
          </div>


        </div>

        {/* Right Side: Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center bg-white">
          <div className="md:hidden flex items-center gap-2 mb-6 justify-center">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 p-2 text-white flex items-center justify-center">
              <Stethoscope className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl text-slate-900">DoctorApp</span>
          </div>

          <div className="mb-6 text-center md:text-left">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Operator Login</h3>
            <p className="text-sm text-slate-500 mt-1">Enter your credentials to access your account</p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm text-center font-medium animate-in fade-in duration-200">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter operator username"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <ShieldCheck className="h-4 w-4 text-indigo-500" />
              Switch to Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
