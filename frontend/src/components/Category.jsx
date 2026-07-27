import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Layers, PlusCircle, ArrowRight } from 'lucide-react';

const Category = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 mt-16 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-600 mb-2">
            <Tag className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Category & Subcategory Management</h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Organize ultrasound procedures, categories, base pricing, and doctor referral fee percentages.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            onClick={() => navigate('/admin/addCategory')}
            className="group relative bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Tag className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Categories
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Create and manage main scan categories (e.g. Ultrasound, X-Ray, Pathology).
              </p>
            </div>
            <div className="mt-8 flex items-center gap-2 text-sm font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
              <span>Manage Categories</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>

          <div
            onClick={() => navigate('/admin/addSubcategory')}
            className="group relative bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Subcategories
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Add specific procedures, define pricing, and set doctor referral commissions.
              </p>
            </div>
            <div className="mt-8 flex items-center gap-2 text-sm font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
              <span>Manage Subcategories</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Category;
