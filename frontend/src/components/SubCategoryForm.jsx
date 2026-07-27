import React, { useState, useEffect } from 'react';
import api from '@/common/axios';
import { useModal } from '../context/ModalContext';
import { Layers, CheckCircle2, Trash2 } from 'lucide-react';

const SubCategoryForm = () => {
  const { showConfirm } = useModal();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    referralFee: '',
  });
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [message, setMessage] = useState('');
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [filteredSubCategories, setFilteredSubCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFormData, setModalFormData] = useState({
    name: '',
    category: '',
    price: '',
    referralFee: '',
  });

  useEffect(() => {
    fetchCategories();
    fetchSubCategories();
  }, []);

  useEffect(() => {
    if (editingSubCategory) {
      // Find the correct category ID from the categories list
      const foundCategory = categories.find(
        (cat) => cat.name === editingSubCategory.category
      );
      setModalFormData({
        name: editingSubCategory.name,
        // Set the modal form's category to the ID for the <select>
        category: foundCategory ? foundCategory._id : '',
        price: editingSubCategory.price,
        referralFee: editingSubCategory.referralFee,
      });
      setIsModalOpen(true);
    }
  }, [editingSubCategory, categories]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSubCategories = async () => {
    try {
      const response = await api.get('/subcategories');
      const subCategoriesData = response.data.Subcategories || [];
      setSubCategories(subCategoriesData);
      setFilteredSubCategories(subCategoriesData);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setModalFormData({
      ...modalFormData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (editingSubCategory) {
        // This logic is now handled by the modal's update handler
      } else {
        // Add new subcategory
        response = await api.post('/addSubCategory', formData);
        setMessage(response.data.message || 'Subcategory added successfully!');
      }

      // Reset form and reload subcategories
      setFormData({
        name: '',
        category: '',
        price: '',
        referralFee: '',
      });
      setEditingSubCategory(null);
      fetchSubCategories();
    } catch (error) {
      console.error(error);
      setMessage('An error occurred while processing the subcategory.');
    }
  };

  const handleUpdateSubCategory = async (e) => {
    e.preventDefault();
    try {
      // Find the category name based on the ID selected in the modal
      const categoryToUpdate = categories.find(
        (cat) => cat._id === modalFormData.category
      );

      const updatedData = {
        ...modalFormData,
        category: categoryToUpdate ? categoryToUpdate.name : '',
      };
      
      const response = await api.put(
        `/subcategory/${editingSubCategory._id}`,
        updatedData
      );
      setMessage(response.data.message || 'Subcategory updated successfully!');
      fetchSubCategories();
      setIsModalOpen(false);
      setEditingSubCategory(null);
    } catch (error) {
      console.error(error);
      setMessage('An error occurred while updating the subcategory.');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm({
      title: 'Delete Subcategory',
      message: 'Are you sure you want to delete this subcategory?',
      type: 'danger'
    });
    if (!confirmed) {
      return;
    }
    try {
      await api.delete(`/subcategory/${id}`);
      setMessage('Subcategory deleted successfully!');
      fetchSubCategories();
    } catch (error) {
      console.error(error);
      setMessage('An error occurred while deleting the subcategory.');
    }
  };

  const handleEdit = (subCategory) => {
    setEditingSubCategory(subCategory);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSubCategory(null);
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = subCategories.filter(
      (subCat) =>
        subCat.name.toLowerCase().includes(query) ||
        (subCat.category && subCat.category.toLowerCase().includes(query))
    );
    setFilteredSubCategories(filtered);
  };

  return (
    <div className="min-h-screen bg-slate-50 mt-16 py-10 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="flex items-center gap-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subcategory Procedures</h1>
            <p className="text-xs text-slate-500 mt-0.5">Define scan procedures, pricing, and doctor referral fees</p>
          </div>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Subcategory Form */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add Subcategory</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Subcategory Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Abdomen Scan"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                >
                  <option value="" disabled>Select category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="1000"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Referral Fee (₹)
                  </label>
                  <input
                    type="number"
                    name="referralFee"
                    value={formData.referralFee}
                    onChange={handleChange}
                    placeholder="200"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-all active:scale-95"
              >
                Add Subcategory
              </button>
            </form>
          </div>

          {/* Subcategory List Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-lg font-bold text-slate-900">Subcategory Catalog</h2>
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Search subcategories..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            {filteredSubCategories.length > 0 ? (
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Referral Fee</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {filteredSubCategories.map((subCat) => (
                      <tr key={subCat._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{subCat.name}</td>
                        <td className="py-3.5 px-4">
                          <span className="bg-indigo-50 text-indigo-700 font-semibold text-xs px-2.5 py-1 rounded-full border border-indigo-200/60">
                            {subCat.category || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">₹{subCat.price}</td>
                        <td className="py-3.5 px-4 font-semibold text-emerald-700">₹{subCat.referralFee}</td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(subCat)}
                              className="bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/80 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(subCat._id)}
                              className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/80 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-sm font-medium">
                No subcategories available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inbuilt Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
          <div className="relative bg-white rounded-lg shadow-lg p-8 w-full max-w-xl mx-4">
            <h2 className="text-2xl font-bold mb-4">Edit SubCategory</h2>
            <form onSubmit={handleUpdateSubCategory}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Name:</label>
                <input
                  type="text"
                  name="name"
                  value={modalFormData.name}
                  onChange={handleModalChange}
                  className="mt-1 p-3 block w-full border rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Category:</label>
                <select
                  name="category"
                  value={modalFormData.category}
                  onChange={handleModalChange}
                  className="mt-1 p-3 block w-full border rounded-md"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Price:</label>
                <input
                  type="number"
                  name="price"
                  value={modalFormData.price}
                  onChange={handleModalChange}
                  className="mt-1 p-3 block w-full border rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Referral Fee:</label>
                <input
                  type="number"
                  name="referralFee"
                  value={modalFormData.referralFee}
                  onChange={handleModalChange}
                  className="mt-1 p-3 block w-full border rounded-md"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-gray-300 text-gray-800 py-2 px-4 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubCategoryForm;