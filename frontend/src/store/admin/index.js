import { adminApi } from '@/common/axios';
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'adminLogin',
  initialState,
  reducers: {
    loginRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.token = action.payload;
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.token = null;
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
    },
  },
});

export const { loginRequest, loginSuccess, loginFailure, logout } = authSlice.actions;

export const login = (username, password) => async (dispatch) => {
  dispatch(loginRequest());
  try {
    const response = await adminApi.post('/login', {
      username,
      password,
    });
    const token = response.data.token;
    localStorage.setItem('token', token);
    localStorage.setItem('authToken', token);
    localStorage.setItem('userRole', 'admin');
    dispatch(loginSuccess(token));
  } catch (error) {
    dispatch(loginFailure(error.response?.data?.message || 'Invalid admin credentials'));
  }
};

export default authSlice.reducer;
