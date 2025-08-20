import api from '@/common/axios';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Thunk to place an order
export const placeOrder = createAsyncThunk(
  'order/placeOrder',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post('/placeOrder', formData);
      return response.data.order; // Assuming the response contains the order data or success message
    } catch (error) {
      console.error('Error placing order:', error);
      return rejectWithValue('Failed to place order');
    }
  }
);

// Thunk to fetch all orders
export const fetchAllOrders = createAsyncThunk(
  'order/fetchAllOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/fetchAllOrder');
      return response.data.orders; // Assuming the response contains the array of orders
    } catch (error) {
      console.error('Error fetching all orders:', error);
      return rejectWithValue('Failed to fetch orders');
    }
  }
);

// Thunk to fetch orders by date range
export const fetchOrdersByDate = createAsyncThunk(
  'order/fetchOrdersByDate',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/ordersbydate?startDate=${startDate}&endDate=${endDate}`
      );
      return response.data.orders; // Assuming the response contains the array of filtered orders
    } catch (error) {
      console.error('Error fetching orders by date:', error);
      return rejectWithValue('Failed to fetch orders by date');
    }
  }
);

// Thunk to update an existing order
export const updateOrder = createAsyncThunk(
  'order/updateOrder',
  async ({ orderId, updatedData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/orders/${orderId}`, updatedData);
      return response.data.order; // Assuming the response contains the updated order data
    } catch (error) {
      console.error('Error updating order:', error);
      return rejectWithValue('Failed to update order');
    }
  }
);

// Thunk to fetch paginated orders with skip and limit-Armaan Siddiqui
export const fetchPaginatedOrders = createAsyncThunk(
  'order/fetchPaginatedOrders',
  async ({ skip, limit }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/allordersPaginated?skip=${skip}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching paginated orders:', error);
      return rejectWithValue('Failed to fetch paginated orders');
    }
  }
);

// Creating a slice for order
const orderSlice = createSlice({
  name: 'order',
  initialState: {
    orderDetails: null,
    allOrders: [], // Store all fetched orders
    filteredOrders: [], // Store orders filtered by date
    paginatedOrders: [], // State for storing paginated data-Armaan Siddiqui
    totalOrders: 0, // New state for storing the total count
    loading: false,
    error: null, // For capturing errors
    status: 'idle', // New field to track order status
  },
  reducers: {
    // Resets the order state
    resetOrderState: (state) => {
      state.orderDetails = null;
      state.allOrders = [];
      state.filteredOrders = [];
      state.paginatedOrders = [];
      state.totalOrders = 0;
      state.loading = false;
      state.error = null;
      state.status = 'idle';
    },
    // Optimistically update an order in the state
    updateOrderInState: (state, action) => {
      const updatedOrder = action.payload;
      const index = state.allOrders.findIndex(order => order._id === updatedOrder._id);
      if (index !== -1) {
        state.allOrders[index] = updatedOrder;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Place Order
      .addCase(placeOrder.pending, (state) => {
        state.loading = true;
        state.status = 'pending';
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.orderDetails = action.payload;
        state.loading = false;
        state.status = 'success';
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.status = 'failed';
      })
      // Fetch All Orders
      .addCase(fetchAllOrders.pending, (state) => {
        state.loading = true;
        state.status = 'pending';
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.allOrders = action.payload;
        state.loading = false;
        state.status = 'success';
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.status = 'failed';
      })
      // Fetch Orders by Date
      .addCase(fetchOrdersByDate.pending, (state) => {
        state.loading = true;
        state.status = 'pending';
      })
      .addCase(fetchOrdersByDate.fulfilled, (state, action) => {
        state.filteredOrders = action.payload;
        state.loading = false;
        state.status = 'success';
      })
      .addCase(fetchOrdersByDate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.status = 'failed';
      })
      // Update Order
      .addCase(updateOrder.pending, (state) => {
        state.loading = true;
        state.status = 'pending';
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        const updatedOrder = action.payload;
        state.allOrders = state.allOrders.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order
        );
        state.loading = false;
        state.status = 'success';
      })
      .addCase(updateOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.status = 'failed';
      })
      // Fetch Paginated Orders-Armaan Siddiqui
      .addCase(fetchPaginatedOrders.pending, (state) => {
        state.loading = true;
        state.status = 'pending';
      })
      .addCase(fetchPaginatedOrders.fulfilled, (state, action) => {
        state.paginatedOrders = action.payload.orders;
        state.totalOrders = action.payload.totalOrders;
        state.loading = false;
        state.status = 'success';
      })
      .addCase(fetchPaginatedOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.status = 'failed';
      });
  },
});

// Exporting the actions and reducer
export const { resetOrderState, updateOrderInState } = orderSlice.actions;
export default orderSlice.reducer;