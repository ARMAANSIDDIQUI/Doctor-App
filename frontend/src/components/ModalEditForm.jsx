import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDoctors } from "../store/doctor";
import { fetchCategories } from '../store/categories';
import { fetchSubcategoryDetail } from '../store/subcategories';

import api from "@/common/axios";
import { toast } from "react-toastify";

const ModalEditForm = ({ isOpen, onClose, onSubmit, initialData }) => {
    const dispatch = useDispatch();
    const [filteredSubcategories, setFilteredSubcategories] = useState([]);
    const [valueS, setValueS] = useState("");

    // Redux state
    const { doctors } = useSelector((state) => state.doctors);
    const { categories } = useSelector((state) => state.categories);
    const { subcategory, loading } = useSelector((state) => state.subcategory);

    // state for managing wrong disc input- Armaan Siddiqui
    const [prevDiscount, setPrevDiscount] = useState("");

    // MODIFICATION START: Add state for doctor search functionality
    const [doctorSearchTerm, setDoctorSearchTerm] = useState("");
    const [isDoctorListVisible, setIsDoctorListVisible] = useState(false);
    // MODIFICATION END

    // MODIFICATION START #1: Find the "None" doctor and safely get its ID
    const noneDoctor = doctors.find(doc => doc.name?.toLowerCase() === 'none');
    const noneDoctorId = noneDoctor ? noneDoctor._id : null;
    // MODIFICATION END

    // Local state for form fields
    const [formData, setFormData] = useState({
        phoneNo: "",
        name: "",
        age: "",
        gender: "",
        address: "",
        referredBy: "",
        category: "",
        subcategory: "",
        fees: "",
        discount: "",
        finalPayment: "",
        paymentMode: "",
        online: "",
        cash: "",
        referralFee: "",
    });

    // Initialize form data if editing existing data
    useEffect(() => {
        if (initialData) {
            setFormData({
                phoneNo: initialData.phoneNo || "",
                name: initialData.name || "",
                age: initialData.age || "",
                gender: initialData.gender || "",
                address: initialData.address || "",
                referredBy: initialData.referredBy?._id || initialData.referredBy || "",
                category: initialData.category || "",
                subcategory: initialData.subcategory || "",
                fees: initialData.fees || "",
                discount: initialData.discount || "",
                finalPayment: initialData.finalPayment || "",
                paymentMode: initialData.paymentMode || "",
                online: initialData.online || "",
                cash: initialData.cash || "",
                referralFee: initialData.referralFee || "",
            });
            if (initialData.referredBy?._id) {
                const referredDoctor = doctors.find(doc => doc._id === initialData.referredBy._id);
                if (referredDoctor) {
                    setDoctorSearchTerm(referredDoctor.name);
                }
            } else if (typeof initialData.referredBy === 'string') {
                const referredDoctor = doctors.find(doc => doc._id === initialData.referredBy);
                if (referredDoctor) {
                    setDoctorSearchTerm(referredDoctor.name);
                } else if (initialData.referredBy === noneDoctorId) {
                    setDoctorSearchTerm("None");
                }
            } else {
                setDoctorSearchTerm("");
            }
        }
    }, [initialData, doctors, noneDoctorId]);


    // Fetch data on mount or when modal opens
    useEffect(() => {
        if (isOpen) {
            dispatch(fetchDoctors());
            dispatch(fetchCategories());
        }
    }, [isOpen, dispatch]);

    useEffect(() => {
        const fetchSubcategoriesByCategory = async () => {
            if (!formData.category) {
                setFilteredSubcategories([]);
                return;
            }
            try {
                const response = await api.get(`/subcategory?category=${formData.category}`);
                setFilteredSubcategories(response.data.subcategories);
            } catch (error) {
                console.error('Error fetching subcategories:', error);
            }
        };
        fetchSubcategoriesByCategory();
    }, [formData.category]);

    useEffect(() => {
        if (valueS) {
            dispatch(fetchSubcategoryDetail(valueS));
        }
    }, [valueS, dispatch]);

    useEffect(() => {
        if (subcategory && subcategory._id === valueS) {
            setFormData(prev => {
                const newFees = subcategory.price || 0;
                const newReferralFee = subcategory.referralFee || 0;
                const newDiscount = parseFloat(prev.discount) || 0;
                return {
                    ...prev,
                    fees: newFees,
                    referralFee: newReferralFee,
                    finalPayment: (newFees - newDiscount).toFixed(2),
                    online: "",
                    cash: "",
                };
            });
        }
    }, [subcategory, valueS]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            let updatedData = { ...prev, [name]: value };
            if (name === "category") {
                updatedData = {
                    ...updatedData,
                    subcategory: "",
                    fees: "",
                    referralFee: "",
                    discount: "",
                    finalPayment: "",
                    online: "",
                    cash: "",
                };
                setValueS("");
                return updatedData;
            }
            if (name === "subcategory") {
                const selectedSub = filteredSubcategories.find((sub) => sub.name === value);
                if (selectedSub) {
                    setValueS(selectedSub._id);
                }
            }
            if (name === "fees" || name === "discount" || name === "online" || name === "cash" || name === "paymentMode") {
                const fees = parseFloat(updatedData.fees) || 0;
                const discount = parseFloat(updatedData.discount) || 0;
                const referralFee = parseFloat(updatedData.referralFee) || 0;
                if (name === "discount" && discount > referralFee) {
                    toast.warn("Discount cannot be greater than Referral Fee.");
                }
                updatedData.finalPayment = Math.max(0, fees - discount).toFixed(2);
                const final = parseFloat(updatedData.finalPayment);

                if (name === "paymentMode") {
                    if (value !== "Online + Cash") {
                        updatedData.online = "";
                        updatedData.cash = "";
                    }
                } else if (updatedData.paymentMode === "Online + Cash") {
                    const onlineVal = parseFloat(updatedData.online) || 0;
                    if (name === "online") {
                        updatedData.cash = Math.max(0, final - onlineVal).toFixed(2);
                    } else if (name === "cash") {
                        const cashVal = parseFloat(value) || 0;
                        updatedData.online = Math.max(0, final - cashVal).toFixed(2);
                    }
                }
            }
            if (name === "discount" && updatedData.paymentMode === "Online + Cash") {
                updatedData.online = "";
                updatedData.cash = "";
            }
            return updatedData;
        });
        if (name === "discount") {
            setPrevDiscount(formData.discount);
        }
    };

    const handleDoctorSearchChange = (e) => {
        const term = e.target.value;
        setDoctorSearchTerm(term);
        if (!isDoctorListVisible) {
            setIsDoctorListVisible(true);
        }
    };

    const handleDoctorSelect = (doctor) => {
        setFormData(prev => ({ ...prev, referredBy: doctor._id }));
        setDoctorSearchTerm(doctor.name);
        setIsDoctorListVisible(false);
    };

    const handleSelectNoneDoctor = () => {
        setFormData(prev => ({ ...prev, referredBy: noneDoctorId || "" }));
        setDoctorSearchTerm("None");
        setIsDoctorListVisible(false);
    };

    const handleDoctorInputBlur = () => {
        setTimeout(() => {
            setIsDoctorListVisible(false);
        }, 200);
    };

    const filteredDoctors = doctors.filter(
        doctor =>
            doctor.name?.toLowerCase() !== 'none' &&
            doctor.name?.toLowerCase().includes(doctorSearchTerm.toLowerCase())
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        const online = (formData.paymentMode === "Online + Cash" && parseFloat(formData.online)) || 0;
        const cash = (formData.paymentMode === "Online + Cash" && parseFloat(formData.cash)) || 0;
        const final = parseFloat(formData.finalPayment) || 0;
        const discount = parseFloat(formData.discount) || 0;
        const referralFee = parseFloat(formData.referralFee) || 0;

        if (discount > referralFee) {
            toast.error("Discount cannot be greater than Referral Fee.");
            return;
        }
        if (formData.paymentMode === "Online + Cash" && (online + cash).toFixed(2) !== final.toFixed(2)) {
            toast.error("Online + Cash must exactly equal Final Payment.");
            return;
        }
        
        const referredById = typeof formData.referredBy === 'object' ? formData.referredBy._id : formData.referredBy;

        onSubmit({
            ...formData,
            referredBy: referredById,
            discount,
            referralFee,
            online,
            cash,
            finalPayment: final
        });
    };

    return (
        isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6 relative overflow-y-auto max-h-[90vh]">
                    <button
                        className="absolute top-3 right-3 text-gray-600 hover:text-gray-800 focus:outline-none"
                        onClick={onClose}
                    >
                        &times;
                    </button>
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Form</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="mt-2 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2 text-sm"
                            />
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label htmlFor="phoneNo" className="block text-sm font-medium text-gray-700">
                                Phone Number
                            </label>
                            <input
                                type="text"
                                id="phoneNo"
                                name="phoneNo"
                                value={formData.phoneNo}
                                onChange={handleChange}
                                className="mt-2 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2 text-sm"
                            />
                        </div>

                        {/* Age */}
                        <div>
                            <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                                Age
                            </label>
                            <input
                                type="text"
                                id="age"
                                name="age"
                                value={formData.age}
                                onChange={handleChange}
                                className="mt-2 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2 text-sm"
                            />
                        </div>

                        <div>
                            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                                Gender
                            </label>
                            <select
                                id="gender"
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="mt-2 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2 text-sm"
                            >
                                <option value="">Select Your Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* Address */}
                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                                Address
                            </label>
                            <textarea
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="mt-2 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2 text-sm"
                            />
                        </div>

                        {/* MODIFICATION START: Replaced dropdown with searchable input */}
                        <div>
                            <label htmlFor="referredBy" className="block text-sm font-medium text-gray-700">
                                Referred By
                            </label>
                            <div className="relative">
                                <input
                                    id="referredBy"
                                    type="text"
                                    value={doctorSearchTerm}
                                    onChange={handleDoctorSearchChange}
                                    onFocus={() => setIsDoctorListVisible(true)}
                                    onBlur={handleDoctorInputBlur}
                                    placeholder="Search for a doctor..."
                                    className="mt-2 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2 text-sm"
                                    autoComplete="off"
                                />
                                {isDoctorListVisible && (
                                    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                                        <li
                                            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                            onMouseDown={handleSelectNoneDoctor}
                                        >
                                            None
                                        </li>
                                        {filteredDoctors.length > 0 ? (
                                            filteredDoctors.map((doctor) => (
                                                <li
                                                    key={doctor._id}
                                                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                                    onMouseDown={() => handleDoctorSelect(doctor)}
                                                >
                                                    {doctor.name}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="px-4 py-2 text-sm text-gray-500">No doctors found</li>
                                        )}
                                    </ul>
                                )}
                            </div>
                        </div>
                        {/* MODIFICATION END */}



                        {/* Category (Select Dropdown) */}
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                                Category
                            </label>
                            <select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="mt-2 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2 text-sm"
                            >
                                <option value="">Select Category</option>
                                {/* Add categories here */}
                                {categories?.map((category) => (
                                    <option key={category._id} value={category.name}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Subcategory (Select Dropdown) */}
                        {/* Subcategory (Select Dropdown) */}
                        <div>
                            <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700">
                                Subcategory
                            </label>
                            <select
                                id="subcategory"
                                name="subcategory"
                                value={formData.subcategory} // Bind value to the formData.subcategory state
                                onChange={handleChange}
                                className="mt-2 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2 text-sm"
                            >
                                <option value="">Select Subcategory</option>
                                {filteredSubcategories?.map((sub) => (
                                    <option key={sub._id} value={sub.name}>
                                        {sub.name}
                                    </option>
                                ))}
                            </select>
                        </div>


                        {/* Fees */}
                        <div>
                            <label htmlFor="fees" className="block text-sm font-medium text-gray-700">
                                Fees
                            </label>
                            <input
                                type="text"
                                id="fees"
                                name="fees"
                                value={formData.fees}
                                onChange={handleChange}
                                className="mt-2 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2 text-sm"
                                readOnly
                            />
                        </div>

                        {/* Discount */}
                        <div>
                            <label htmlFor="discount" className="block text-sm font-medium text-gray-700">
                                Discount
                            </label>
                            <input
                                type="text"
                                id="discount"
                                name="discount"
                                value={formData.discount}
                                onChange={handleChange}
                                className="mt-2 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2 text-sm"
                            />
                        </div>

                        {/* Final Payment */}
                        {/* Final Payment */}
                        <div>
                            <label htmlFor="finalPayment" className="block text-sm font-medium text-gray-700">
                                Final Payment
                            </label>
                            <input
                                type="text"
                                id="finalPayment"
                                name="finalPayment"
                                value={formData.finalPayment}
                                onChange={handleChange} // You might want to prevent manual edits here
                                className="mt-2 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2 text-sm"
                                readOnly

                            />
                        </div>


                        {/* Payment Mode */}
                        <div>
                            <label htmlFor="paymentMode" className="block text-sm font-medium text-gray-700">
                                Payment Mode
                            </label>
                            <select
                                id="paymentMode"
                                name="paymentMode"
                                value={formData.paymentMode || ""}
                                onChange={handleChange}
                                className="mt-2 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2 text-sm"
                            >
                                <option value="">Select Payment Mode</option>
                                <option value="Cash">Cash</option>
                                <option value="Online">Online</option>
                                <option value="Online + Cash">Online + Cash</option> {/* Online + cash option added- Armaan Siddiqui */}
                            </select>
                        </div>

                        {/* Adding fields for new feature online + cash mode -Armaan Siddiqui*/}
                        {formData.paymentMode === "Online + Cash" && (
                            <>
                                <div>
                                    <label htmlFor="online" className="block text-sm font-medium text-gray-700">Online Paid</label>
                                    <input
                                        type="number"
                                        id="online"
                                        name="online"
                                        value={formData.online || ""}
                                        onChange={handleChange}
                                        max={formData.finalPayment}
                                        className="mt-2 block w-full rounded-md border-2 border-gray-300 shadow-sm px-4 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="cash" className="block text-sm font-medium text-gray-700">Cash Paid</label>
                                    <input
                                        type="number"
                                        id="cash"
                                        name="cash"
                                        value={formData.cash || ""}
                                        onChange={handleChange}
                                        className="mt-2 block w-full rounded-md border-2 border-gray-300 shadow-sm px-4 py-2 text-sm"
                                    />
                                </div>
                            </>
                        )}
                        {/*
                        // Placed by field removed as per user request
                        <div>
                            <label htmlFor="placedBy" className="block text-sm font-medium text-gray-700">
                                Placed By
                            </label>
                            <input
                                type="text"
                                id="placedBy"
                                name="placedBy"
                                value={formData.placedBy || ""}
                                readOnly
                                className="mt-2 block w-full rounded-md border-2 border-gray-300 bg-gray-100 shadow-sm px-4 py-2 text-sm cursor-not-allowed"
                            />
                        </div>
                        */}
                        {/* Referral Fee */}

                        <div className="flex justify-end space-x-4 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                            >
                                Update Report
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    );
};

export default ModalEditForm;