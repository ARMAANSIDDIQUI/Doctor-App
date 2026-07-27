import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../store/auth';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, Home, Tag, UserCheck, FileSpreadsheet, Receipt, Layers, Users, KeyRound, LogOut, Menu, X } from 'lucide-react';

const AdminNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const navLinks = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: Home },
    { path: '/admin/category', label: 'Category', icon: Tag },
    { path: '/admin/doctor', label: 'Doctor', icon: UserCheck },
    { path: '/admin/monthlyReport', label: 'Reports', icon: FileSpreadsheet },
    { path: '/admin/reports', label: 'Transactions', icon: Receipt },
    { path: '/admin/collection', label: 'Collection', icon: Layers },
    { path: '/admin/operator', label: 'Operators', icon: Users },
    { path: '/admin/change-password', label: 'Security', icon: KeyRound },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white/90 text-slate-800 backdrop-blur-md border-b border-slate-200/80 fixed top-0 left-0 w-full z-50 transition-all shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <Link to="/admin/dashboard" className="flex items-center gap-2.5 group">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 p-2 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
                <Shield className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-slate-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
                  Delight Diagnostics
                </span>
                <span className="text-[10px] text-indigo-600 font-bold tracking-wider uppercase">
                  Admin Console
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {link.label}
                </Link>
              );
            })}

            <div className="h-5 w-[1px] bg-slate-200 mx-2" />

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/80 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>

          {/* Mobile menu toggle */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Links */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-1 animate-in slide-in-from-top-2 duration-150">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                {link.label}
              </Link>
            );
          })}

          <div className="pt-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all active:scale-95"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default AdminNavbar;
