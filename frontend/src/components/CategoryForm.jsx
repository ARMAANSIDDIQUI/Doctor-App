import React, { useState, useEffect } from 'react';
import api from '@/common/axios';
import { useModal } from '../context/ModalContext';
import { Tag, Edit3, Trash2, Plus, CheckCircle2 } from 'lucide-react';

const CategoryForm = () => {
  const { showConfirm } = useModal();
  const [formData, setFormData] = useState({ name: '' });
  const [message, setMessage] = useState('');
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        const response = await api.put(`/category/${editingCategory._id}`, formData);
        setMessage(response.data.message || 'Category updated successfully!');
      } else {
        const response = await api.post('/addCategory', formData);
        setMessage(response.data.message || 'Category added successfully!');
      }

      setFormData({ name: '' });
      setEditingCategory(null);
      fetchCategories();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setMessage('An error occurred while processing the request.');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({ name: category.name });
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm({
      title: 'Delete Category',
      message: 'Are you sure you want to delete this category?',
      type: 'danger'
    });
    if (!confirmed) return;
    try {
      await api.delete(`/category/${id}`);
      setMessage('Category deleted successfully!');
      fetchCategories();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting category:', error);
      setMessage('An error occurred while deleting the category.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 mt-16 py-10 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Tag className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Category Setup</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage scan and test category definitions</p>
          </div>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Form Card */}
          <div className="md:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              {editingCategory ? <Edit3 className="h-5 w-5 text-indigo-600" /> : <Plus className="h-5 w-5 text-indigo-600" />}
              {editingCategory ? 'Edit Category' : 'New Category'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Ultrasound, X-Ray"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-all active:scale-95"
                >
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </button>
                {editingCategory && (
                  <button
                    type="button"
                    onClick={() => { setEditingCategory(null); setFormData({ name: '' }); }}
                    className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List Card */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Configured Categories</h2>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {categories.length} Total
              </span>
            </div>

            {categories.length > 0 ? (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                {categories.map((category) => (
                  <div
                    key={category._id}
                    className="flex justify-between items-center p-4 hover:bg-slate-50/80 transition-colors"
                  >
                    <span className="font-semibold text-slate-800 text-sm">{category.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/80 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category._id)}
                        className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/80 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-sm font-medium">
                No categories defined yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryForm;
