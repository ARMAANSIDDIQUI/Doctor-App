import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { adminApi } from "@/common/axios";

// Helper to get token from storage
const getSavedToken = () => localStorage.getItem("token") || localStorage.getItem("authToken");

// Helper to store tokens consistently
const setAuthTokens = (token, role = null, username = null) => {
  if (token) {
    localStorage.setItem("token", token);
    localStorage.setItem("authToken", token);
  }
  if (role) {
    localStorage.setItem("userRole", role);
  }
  if (username) {
    localStorage.setItem("operatorName", username);
  }
};

// Helper to clear tokens consistently
const clearAuthTokens = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("userRole");
  localStorage.removeItem("operatorName");
};

// Async thunk: Operator Login
export const loginOperator = createAsyncThunk(
  "auth/loginOperator",
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await api.post("/login", { username, password });
      const { token, message } = response.data;
      setAuthTokens(token, "operator", username);
      return { token, role: "operator", user: { username, role: "operator" }, message };
    } catch (error) {
      const message = error.response?.data?.message || "Invalid operator credentials";
      return rejectWithValue(message);
    }
  }
);

// Async thunk: Admin Login
export const loginAdmin = createAsyncThunk(
  "auth/loginAdmin",
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await adminApi.post("/login", { username, password });
      const { token, message } = response.data;
      setAuthTokens(token, "admin", username);
      return { token, role: "admin", user: { username, role: "admin" }, message };
    } catch (error) {
      const message = error.response?.data?.message || "Invalid admin credentials";
      return rejectWithValue(message);
    }
  }
);

// Async thunk: Check Current Authentication Status
export const checkAuth = createAsyncThunk(
  "auth/checkauth",
  async (_, { rejectWithValue }) => {
    const token = getSavedToken();
    if (!token) {
      return rejectWithValue("No token found");
    }

    try {
      const response = await api.get("/checkauth");
      return response.data;
    } catch (error) {
      clearAuthTokens();
      const message = error.response?.data?.message || "Session expired";
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  isAuthenticated: !!getSavedToken(),
  token: getSavedToken() || null,
  user: null,
  role: localStorage.getItem("userRole") || null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.role = null;
      state.loading = false;
      state.error = null;
      clearAuthTokens();
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Operator Login
      .addCase(loginOperator.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginOperator.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(loginOperator.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.role = null;
        state.error = action.payload;
      })

      // Admin Login
      .addCase(loginAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.role = null;
        state.error = action.payload;
      })

      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = !!action.payload.success;
        state.user = action.payload.user || null;
        state.role = action.payload.user?.role || state.role;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.role = null;
      });
  },
});

export const { logout, clearError } = authSlice.actions;

export default authSlice.reducer;
