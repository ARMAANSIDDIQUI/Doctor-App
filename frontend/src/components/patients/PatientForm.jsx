import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import { Search } from 'lucide-react';
import "react-toastify/dist/ReactToastify.css";
import { fetchPatients, checkPatientByPhone, setIsNewEntry } from "../../store/patient";
import { useLocation } from 'react-router-dom';
import { fetchDoctors } from '../../store/doctor';
import { fetchCategories } from '../../store/categories';
import { addPatient } from '../../store/patient';
import {  fetchSubcategoryDetail } from '../../store/subcategories';
import { placeOrder,resetOrderState } from '../../store/order';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronsUpDown } from "lucide-react"
import { createUnbilled } from '../../store/unbilled';
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import AddDoctorModal from "./AddDoctor";
import api from "@/common/axios";

const PatientForm = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { patients, phoneNo, isNewEntry } = useSelector((state) => state.patient);
    const { doctors} = useSelector((state) => state.doctors);
    const { categories} = useSelector((state) => state.categories);
    const { status, error } = useSelector((state) => state.order);
    const { subcategory, loading} = useSelector((state) => state.subcategory);
    const orderDetails = useSelector((state) => state.order.orderDetails);
    const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTermC, setSearchTermC] = useState("");

    const [openC, setOpenC] = React.useState(false)
    const [isAddDoctorModalOpen, setIsAddDoctorModalOpen] = useState(false);
    
  const [valueC, setValueC] = React.useState("")

    const [openS, setOpenS] = React.useState(false)
  const [valueS, setValueS] = React.useState("")
  const [searchTermS, setSearchTermS] = useState("");

 
  const location = useLocation();
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [formData, setFormData] = useState({
    phoneNo: "",
    name: "",
    age: "",
    gender:"",
    address: "",
    referredBy: "",
    category: "",
    subcategory: "",
    fees: "",
    discount: "",
    finalPayment: "",
    paymentMode:"",
    referralFee: 0 // MODIFICATION: Default referralFee to 0
  });

  // special state for Online + Cash amount spitting - Armaan Siddiqui
  const [splitPayments, setSplitPayments] = useState({
    online: "",
    cash: "",
  });

  // MODIFICATION START #1: Find the 'None' doctor from the list and get its ID
  const noneDoctor = doctors.find(doc => doc.name.toLowerCase() === 'none');
  const noneDoctorId = noneDoctor ? noneDoctor._id : null;
  // MODIFICATION END

  const selectedPatient = location.state?.patient;
  const NewphoneNo= location.state?.phoneNo;
  const filteredDoctors = doctors.filter((doctor) =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTermC.toLowerCase())
  );

  const filteredSubcategoriesNew = filteredSubcategories.filter((subcategory) =>
    subcategory.name.toLowerCase().includes(searchTermS.toLowerCase())
  );


  useEffect(() => {
    dispatch(fetchDoctors());
    dispatch(fetchCategories()); 
    
    
  }, [dispatch]);
  const handleOpenModal = () => {
    setIsAddDoctorModalOpen(true);
  };

  // Close the modal
  const handleCloseModal = () => {
    setIsAddDoctorModalOpen(false);
  };


  
  // useEffect(() => {
  //   dispatch(resetOrderState());
  // }, [dispatch]);

  // // Navigate on success
  // useEffect(() => {
  //   if (status === "success") {
  //     dispatch(resetOrderState()); // Reset after navigating
  //     navigate("/print-report", { state: { orderDetails } });
  //   }
  // }, [status, navigate, dispatch, orderDetails]);

  useEffect(() => {
    const fetchSubcategoriesByCategory = async () => {
      if (!formData.category) {
        setFilteredSubcategories([]);
        return;
      }
 
      try {
        const response = await api.get(
          `/subcategory?category=${formData.category}`
        );
        setFilteredSubcategories(response.data.subcategories); // Update with actual key from API response
      } catch (error) {
        console.error('Error fetching subcategories:', error);
      }
    };
 
    fetchSubcategoriesByCategory();
  }, [valueC, formData.category]);

  useEffect(() => {
    
 
    if (valueS) {
      dispatch(fetchSubcategoryDetail(valueS));
    }
  }, [valueS, dispatch]);

  useEffect(() => {
    if (subcategory) {
      setFormData((prevState) => ({
        ...prevState,
        fees: subcategory.price || '',
        finalPayment: subcategory.price || '',
        referralFee:subcategory.referralFee || 0 // MODIFICATION: Default to 0
      }));
    }
  }, [subcategory]);

  


  const handleInputChange = (e) => {
    const { name, value } = e.target;
 
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
 
    // Handle fees and discount calculation
    if (name === "fees" || name === "discount") {
      let fees = name === "fees" ? parseFloat(value) || 0 : parseFloat(formData.fees) || 0;
      let discount = name === "discount" ? parseFloat(value) || 0 : parseFloat(formData.discount) || 0;
 
      // Check if discount is greater than referralFee and show a warning
      if (name === "discount" && discount > (parseFloat(formData.referralFee) || 0)) {
        toast.warn("Discount exceeds the referral fee.", { autoClose: 3000 });
      }
      
 
      const final = fees - discount;
      setFormData((prev) => ({
        ...prev,
        finalPayment: final,
        discount: discount,
        [name]:value
      }));
    }
 
    // Check phone number length for existing patient check
    if (name === "phoneNo" && value.length === 10) {
      dispatch(checkPatientByPhone(value)).then((action) => {
        if (action.payload.isNew === false) {
          dispatch(setIsNewEntry(false));   // If patient exists, set isNewEntry to false
        } else {
          dispatch(setIsNewEntry(true));   // If patient is new, set isNewEntry to true
        }
      });
    }
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
 
    const operatorName = localStorage.getItem('operatorName'); // Get operator name
 
    if (!operatorName) {
      toast.error("Session expired. Please login again.");
      navigate('/login');
      return;
    }

    // Prevent submit if discount > referralFee - Armaan Siddiqui
    if (parseFloat(formData.discount) > parseFloat(formData.referralFee || 0)) {
      toast.error("Discount cannot exceed referral fee.");
      return;
    }


    // Check if required fields are filled
    if (
      !formData.phoneNo || 
      !formData.name || 
      !formData.age || 
      !formData.gender || 
      !formData.address || 
      !formData.category || 
      !formData.fees || 
      !formData.finalPayment ||
      !formData.paymentMode
    ) {
      toast.error("Please fill in all required fields");
      return;
    }


    // handle Online + Cash payment mode input validation- Armaan Siddiqui
    if (formData.paymentMode === "Online + Cash") {
      const online = parseFloat(splitPayments.online) || 0;
      const cash = parseFloat(splitPayments.cash) || 0;
      const total = parseFloat(formData.finalPayment) || 0;

      if (online + cash !== total) {
        toast.error("Online + Cash must add up to Final Payment.");
        return;
      }
    }

    try {
      let orderData = {
        ...formData,
        placedBy: operatorName
      }


      // handle Online + Cash payment mode data payload prepration- Armaan Siddiqui
      if (formData.paymentMode === "Online + Cash") {
        orderData.online = parseFloat(splitPayments.online) || 0;
        orderData.cash = parseFloat(splitPayments.cash) || 0;
        orderData.total = parseFloat(formData.finalPayment) || 0;

      }

      // First, handle adding new patient if isNewEntry is true
      if (isNewEntry) {
        const patientData = {
          phoneNo: formData.phoneNo,
          name: formData.name,
          age: formData.age,
          gender: formData.gender,
          address: formData.address,
        };
 
        // Dispatch action to add new patient
        await dispatch(addPatient(patientData));
      }
 
      // Check payment mode and handle accordingly
      if (formData.paymentMode === "Unbilled") {
        // Create unbilled record
        const unbilledResponse = await dispatch(createUnbilled(orderData));
 
        if (unbilledResponse.meta.requestStatus === "fulfilled") {
          toast.success("Unbilled record created successfully");
          navigate("/unbilled-transactions"); // Navigate to unbilled transactions page
        } else {
          toast.error("Failed to create unbilled record. Please try again.");
        }
      } else {
        // Place regular order for other payment modes
        const orderResponse = await dispatch(placeOrder(orderData));
 
        if (orderResponse.meta.requestStatus === "fulfilled") {
          navigate("/print-report");
        } else {
          toast.error("Failed to place order. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Error creating order");
    }
  };
  
  
  useEffect(() => {
    // Check if selectedPatient is available
    if (selectedPatient) {
      // If selectedPatient exists, fill the form with its data
      setFormData({
        phoneNo: selectedPatient.phoneNo || "",
        name: selectedPatient.name || "",
        age: selectedPatient.age || "",
        gender: selectedPatient.gender || "",
        address: selectedPatient.address || "",
        referredBy: selectedPatient.referredBy || "",
        category: selectedPatient.category || "",
        subcategory: selectedPatient.subcategory || "",
        fees: selectedPatient.fees || "",
        discount: selectedPatient.discount || "",
        finalPayment: selectedPatient.finalPayment || "",
        referralFee: selectedPatient.referralFee || 0
        
      });
    } else if (patients.length === 1) {
      // If no selectedPatient, but only one patient in the list, auto-fill the form with the first patient data
      const patient = patients[0]; // Get the first patient directly
      setFormData({
        phoneNo: patient.phoneNo || "",
        name: "",
        age: "",
        gender: "",
        address: "",
        referredBy:  "",
        category: "",
        subcategory: "",
        fees: "",
        discount: "",
        finalPayment:  "",
        referralFee: 0,
        
        

      });
    } else if (patients.length === 0) {
      // If no patients, reset the form to blank
      setFormData({
        phoneNo: NewphoneNo || "",
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
        paymentMode:"",
        referralFee : 0 // MODIFICATION: Default to 0
      });
    }
    else if (!selectedPatient) {
      setFormData({
        phoneNo:   NewphoneNo || "",
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
        paymentMode:"",
        referralFee : 0 // MODIFICATION: Default to 0
      });
    }
  }, [patients, phoneNo, selectedPatient, NewphoneNo]);
  
  return (
    <div className="min-h-screen bg-slate-50 mt-16 py-10 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Hero Card */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm text-center flex flex-col items-center justify-center space-y-6">
          <div className="h-20 w-20 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
            <img src="/p2.svg" alt="Patient Registration" className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Delight Diagnostics</h1>
            <p className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full inline-block border border-indigo-200/60">
              Patient Registration & Billing
            </p>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
            Enter patient demographics, select scan categories, procedure subcategories, and process payment receipt.
          </p>
          <ToastContainer position="top-right" autoClose={3000} />
        </div>

        {/* Right Form Card */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm">
       
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Form fields for phone and name */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phoneNo"
                value={formData.phoneNo}
                onChange={handleInputChange}
                  pattern="^\d{10}$"
                placeholder="Enter Your Phone Number"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter Your Name"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Form fields for age and address */}
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                Age *
              </label>
              <input
                type="text"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                placeholder="Enter Your Age"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                  }
                }}
                onChange={handleInputChange}
                placeholder="Enter Your Address"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                required
              />
            </div>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
  <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
    Gender *
  </label>
  <select
    id="gender"
    name="gender"
    value={formData.gender}
    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
    required
  >
    <option value="">Select Your Gender</option>
    <option value="Male">Male</option>
    <option value="Female">Female</option>
    <option value="Other">Other</option>
  </select>
</div>
   

      {/* Additional form fields */}

            {/* Form fields for referredBy and category */}
            <div>
      <label htmlFor="referredBy" className="block text-sm font-medium text-gray-700">
        Referred By
      </label>
      <Popover open={open} onOpenChange={setOpen} className="">
  <PopoverTrigger asChild>
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex justify-between items-center"
    >
      <span className="text-left">
      {formData.referredBy === 0
          ? "None"
          : formData.referredBy
          ? doctors.find((doctor) => doctor._id === formData.referredBy)?.name
          : "Select Doctor..."}
      </span>
      <ChevronsUpDown className="opacity-50" />
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-full p-0">
    <Command>
      <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500  w-5 h-5" />
        <input
          type="text"
          placeholder="Search doctor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9 w-full px-10 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
        />
      </div>
      <CommandList>
      <CommandItem
          value="none" // Make sure the value for "None" is a specific string
          onSelect={() => {
            // MODIFICATION START #2: Use the found noneDoctorId instead of 0
            setValue(noneDoctorId); 
            handleInputChange({
              target: { name: "referredBy", value: noneDoctorId }, 
            });
            // MODIFICATION END
            setOpen(false); // Close the popover
          }}
        >
          None
        </CommandItem>
        <CommandItem
  value="addNew"
  onSelect={() => {
    handleOpenModal(); // Open the modal to add a new doctor
    setOpen(false); // Close the popover
  }}
  className="text-green-700 hover:text-blue-600 focus:text-blue-600"
>
  Add New Doctor
</CommandItem>

        {filteredDoctors.length === 0 ? (
          <CommandEmpty>No doctor found.</CommandEmpty>
        ) : (
          <CommandGroup>
            {filteredDoctors.map((doctor) => (
              <CommandItem
                key={doctor._id}
                value={doctor._id}
                onSelect={(currentValue) => {
                  setValue(currentValue === value ? "" : currentValue); // Toggle value
                  handleInputChange({
                    target: { name: "referredBy", value: currentValue },
                  }); // Update form data
                  setOpen(false);
                }}
              >
                {doctor.name}
                <Check
                  className={`ml-auto ${
                    value === doctor._id ? "opacity-100" : "opacity-0"
                  }`}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>

    </div>
    </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
        Category
      </label>
      <Popover open={openC} onOpenChange={setOpenC} className="">
  <PopoverTrigger asChild>
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={openC}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex justify-between items-center"
    >
      <span className="text-left">
        {valueC ? valueC : "Select Category..."}
      </span>
      <ChevronsUpDown className="opacity-50" />
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-full p-0">
    <Command>
      <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500  w-5 h-5" />
        <input
          type="text"
          placeholder=" Search category..."
          value={searchTermC}
          onChange={(e) => setSearchTermC(e.target.value)}
          className="h-9 w-full px-10 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
        />
      </div>
      <CommandList>
        {filteredCategories.length === 0 ? (
          <CommandEmpty>No category found.</CommandEmpty>
        ) : (
          <CommandGroup>
            {filteredCategories.map((category) => (
              <CommandItem
                key={category._id}
                value={category.name}   // Use category name as the value
                onSelect={(currentValue) => {
                  setValueC(currentValue === valueC ? "" : currentValue); // Toggle value
                  handleInputChange({
                    target: { name: "category", value: currentValue },
                  }); // Update form data
                  setOpenC(false);
                }}
              >
                {category.name}
                <Check
                  className={`ml-auto ${valueC === category.name ? "opacity-100" : "opacity-0"}`} // Compare with category name
                />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>




    </div>
      
 
      
            {/* Form fields for subcategory and fees */}
            <div>
      <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700">
        Subcategory
      </label>
      <Popover open={openS} onOpenChange={setOpenS} className="">
  <PopoverTrigger asChild>
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={openS}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex justify-between items-center"
    >
      <span className="text-left">
        {formData.subcategory
          ? filteredSubcategories.find(
              (subcategory) => subcategory.name === formData.subcategory
            )?.name
          : "Select Subcategory..."}
      </span>
      <ChevronsUpDown className="opacity-50" />
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-full p-0">
    <Command>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
        <input
          type="text"
          placeholder="Search subcategory..."
          value={searchTermS}
          onChange={(e) => setSearchTermS(e.target.value)}
          className="h-9 w-full px-10 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
        />
      </div>
      <CommandList>
        {filteredSubcategoriesNew.length === 0 ? (
          <CommandEmpty>No subcategory found.</CommandEmpty>
        ) : (
          <CommandGroup>
  {filteredSubcategoriesNew.map((subcategory) => (
    <CommandItem
      key={subcategory.name} // Use name as the key
      value={subcategory.name} // Display the subcategory name
      onSelect={(currentValue) => {
        setValueS(subcategory._id); // Set the value as subcategory._id
        handleInputChange({
          target: { name: "subcategory", value: subcategory.name }, // Save subcategory name in form data
        });
        setOpenS(false);
      }}
    >
      {subcategory.name}
      <Check
        className={`ml-auto ${
          valueS === subcategory._id ? "opacity-100" : "opacity-0"
        }`}
      />
    </CommandItem>
  ))}
</CommandGroup>

        )}
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>

    </div>
    </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
              <label htmlFor="fees" className="block text-sm font-medium text-gray-700">
                Fees
              </label>
              <input
                type="number"
                id="fees"
                name="fees"
                value={formData.fees}
                onChange={handleInputChange}
                readOnly
                placeholder="Enter Fees"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
      
 
      
            {/* Form fields for discount and finalPayment */}
            <div>
              <label htmlFor="discount" className="block text-sm font-medium text-gray-700">
                Discount
              </label>
              <input
                type="number"
                id="discount"
                name="discount"
                value={formData.discount}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  // Prevent arrow keys from changing the value
                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.preventDefault();
                  }
                }}
                placeholder="Enter Discount"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
              />
            </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
              <label htmlFor="finalPayment" className="block text-sm font-medium text-gray-700">
                Final Payment
              </label>
              <input
                type="number"
                id="finalPayment"
                name="finalPayment"
                value={formData.finalPayment}
                readOnly
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                required
              />
            </div>
            
            <div>
              <label htmlFor="finalPayment" className="block text-sm font-medium text-gray-700">
                Payment Mode
              </label>
              <select
                id="paymentMode"
                name="paymentMode"
                value={formData.paymentMode}
                onChange={(e) => {
                  const mode = e.target.value;
                  setFormData({ ...formData, paymentMode: mode });

                  // for Clearing fields if mode is not "Online + Cash" - Armaan Siddiqui
                  if (mode !== "Online + Cash") {
                    setSplitPayments({ online: "", cash: "" });
                  }
                }}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Payment Mode</option>
                <option value="Online">Online</option>
                <option value="Cash">Cash</option>
                <option value="Online + Cash">Online + Cash</option> {/* Added option for Online + Cash Armaan Siddiqui */}
                <option value="Unbilled">Unbilled</option>
              </select>
            </div>
          </div>
          
          
          {/* Armaan Siddiqui */}
          {/* Input fields for online + cash */}

          {formData.paymentMode === "Online + Cash" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/*Online*/}
              <div>
                <label htmlFor="online" className="block text-sm font-medium text-gray-700">
                  Online Payment
                </label>
                <input
                  type="number"
                  id="online"
                  name="online"
                  value={splitPayments.online}
                  onChange={(e) => {
                    const online = parseFloat(e.target.value) || 0;
                    const total = parseFloat(formData.finalPayment) || 0;
                    setSplitPayments({
                      online: online,
                      cash: Math.max(0, total - online)
                    });
                  }}
                  min="0"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              {/*Cash*/}
              <div>
                <label htmlFor="cash" className="block text-sm font-medium text-gray-700">
                  Cash Payment
                </label>
                <input
                  type="number"
                  id="cash"
                  name="cash"
                  value={splitPayments.cash}
                  onChange={(e) => {
                    const cash = parseFloat(e.target.value) || 0;
                    const total = parseFloat(formData.finalPayment) || 0;
                    setSplitPayments({
                      cash: cash,
                      online: Math.max(0, total - cash)
                    });
                  }}
                  min="0"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
          )}
 
          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-500/25 transition-all active:scale-98 cursor-pointer mt-4"
          >
            Complete Registration & Place Order
          </button>
        </form>
      </div>

      <AddDoctorModal isOpen={isAddDoctorModalOpen} onClose={handleCloseModal} />
      </div>
    </div>
  );
};

export default PatientForm;
