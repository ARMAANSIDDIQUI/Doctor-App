import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/common/axios';

// Async thunk to fetch doctors from the server
export const fetchDoctors = createAsyncThunk(
  'doctors/fetchDoctors',
  async () => {
    try {
      const response = await api.get('/doctors');
      return response.data.doctors; // Assuming the data you need is in response.data
    } catch (error) {
      console.error('Error fetching doctors:', error);
      return [];
    }
  }
);

// Async thunk to fetch a doctor by ID
export const fetchDoctorById = createAsyncThunk(
  'doctors/fetchDoctorById',
  async (doctorId) => {
    try {
      const response = await api.get(`/doctor/${doctorId}`);
      return response.data.doctor; // Assuming the data you need is the doctor's details
    } catch (error) {
      console.error('Error fetching doctor by ID:', error);
      return null; // Return null or an appropriate error message
    }
  }
);

// Redux store added for doctor total count-Armaan Siddiqui
/**
 * @description: Async thunk to fetch the total count of all doctors.
 * This function makes a GET request to a new API endpoint to get the count.
 */
export const fetchTotalDoctorsCount = createAsyncThunk(
  'doctors/fetchTotalDoctorsCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/doctors/count');
      return response.data.totalDoctors;
    } catch (error) {
      console.error('Error fetching total doctor count:', error);
      return rejectWithValue('Failed to fetch total doctor count');
    }
  }
);

// Creating the slice
const doctorsSlice = createSlice({
  name: 'doctors',
  initialState: {
    doctors: [],
    doctorDetails: null, // Store the details of a single doctor
    totalDoctors: 0, // State for storing the total count of doctors
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetching all doctors
      .addCase(fetchDoctors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDoctors.fulfilled, (state, action) => {
        state.loading = false;
        state.doctors = action.payload;
      })
      .addCase(fetchDoctors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Fetching a single doctor by ID
      .addCase(fetchDoctorById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDoctorById.fulfilled, (state, action) => {
        state.loading = false;
        state.doctorDetails = action.payload; // Store the doctor details
      })
      .addCase(fetchDoctorById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Fetching the total count of doctors-Armaan Siddiqui
      .addCase(fetchTotalDoctorsCount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTotalDoctorsCount.fulfilled, (state, action) => {
        state.loading = false;
        state.totalDoctors = action.payload; // Store the total count
      })
      .addCase(fetchTotalDoctorsCount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default doctorsSlice.reducer;
