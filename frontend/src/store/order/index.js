import api from '@/common/axios';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Thunk to place an order
export const placeOrder = createAsyncThunk(
    'order/placeOrder',
    async (formData, { rejectWithValue }) => {
        try {
            const response = await api.post('/placeOrder', formData);
            return response.data.order;
        } catch (error) {
            console.error('Error placing order:', error);
            return rejectWithValue('Failed to place order');
        }
    }
);

// Thunk to fetch all orders (for specific use cases)
export const fetchAllOrders = createAsyncThunk(
    'order/fetchAllOrders',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/fetchAllOrder');
            return response.data.orders;
        } catch (error) {
            console.error('Error fetching all orders:', error);
            return rejectWithValue('Failed to fetch orders');
        }
    }
);

// Thunk to fetch orders by date range (for specific use cases)
export const fetchOrdersByDate = createAsyncThunk(
    'order/fetchOrdersByDate',
    async ({ startDate, endDate }, { rejectWithValue }) => {
        try {
            const response = await api.get(
                `/ordersbydate?startDate=${startDate}&endDate=${endDate}`
            );
            return response.data.orders;
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
            return response.data.order;
        } catch (error) {
            console.error('Error updating order:', error);
            return rejectWithValue('Failed to update order');
        }
    }
);

// Thunk to fetch paginated orders with skip and limit (for specific use cases)
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

// Thunk to fetch the total count of all orders (for specific use cases)
export const fetchTotalOrdersCount = createAsyncThunk(
    'order/fetchTotalOrdersCount',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/orders/count');
            return response.data.totalOrders;
        } catch (error) {
            console.error('Error fetching total order count:', error);
            return rejectWithValue('Failed to fetch total order count');
        }
    }
);

// Thunk to handle all searches with pagination and filters
export const fetchOrdersWithFilters = createAsyncThunk(
    'order/fetchOrdersWithFilters',
    async (filters, { rejectWithValue }) => {
        try {
            const { skip, limit, searchQuery, startDate, endDate, referredBy, download } = filters;
            const params = new URLSearchParams();
            
            if (download) {
                // If download flag is true, do not include skip and limit
                params.append('download', download);
            } else {
                params.append('skip', skip);
                params.append('limit', limit);
            }

            if (searchQuery && searchQuery.length > 0) {
                params.append('searchQuery', searchQuery);
            }
            // FIX: Only append referredBy if it is not an empty string or "none"
            if (referredBy && referredBy !== "none" && referredBy.length > 0) {
                params.append('referredBy', referredBy);
            }
            if (startDate && endDate) {
                params.append('startDate', startDate);
                params.append('endDate', endDate);
            }

            const response = await api.get(`/orders/filter?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching orders with filters:', error);
            return rejectWithValue('Failed to fetch orders with filters');
        }
    }
);

// Thunk to fetch ALL filtered orders for reports (unpaginated)
export const fetchAllFilteredOrders = createAsyncThunk(
    'order/fetchAllFilteredOrders',
    async (filters, { rejectWithValue }) => {
        try {
            const { searchQuery, startDate, endDate, referredBy } = filters;
            const params = new URLSearchParams();
            if (searchQuery && searchQuery.length > 0) {
                params.append('searchQuery', searchQuery);
            }
            if (startDate && endDate) {
                params.append('startDate', startDate);
            }
            // FIX: Add validation for referredBy before appending it to the params object.
            if (referredBy && referredBy !== "none" && referredBy.length > 0) {
                params.append('referredBy', referredBy);
            }
            const response = await api.get(`/orders/all-filtered?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching all filtered orders:', error);
            return rejectWithValue('Failed to fetch all filtered orders');
        }
    }
);

// Creating a slice for order
const orderSlice = createSlice({
    name: 'order',
    initialState: {
        orderDetails: null,
        allOrders: [], 
        filteredOrders: [], 
        paginatedOrders: [], 
        totalOrders: 0, 
        loading: false,
        error: null, 
        status: 'idle', 
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
            // Fetch Paginated Orders
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
            })
            // Fetch Total Orders Count
            .addCase(fetchTotalOrdersCount.pending, (state) => {
                state.loading = true;
                state.status = 'pending';
            })
            .addCase(fetchTotalOrdersCount.fulfilled, (state, action) => {
                state.totalOrders = action.payload;
                state.loading = false;
                state.status = 'success';
            })
            .addCase(fetchTotalOrdersCount.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.status = 'failed';
            })
            // Case for the unified filtered search
            .addCase(fetchOrdersWithFilters.pending, (state) => {
                state.loading = true;
                state.status = 'pending';
            })
            .addCase(fetchOrdersWithFilters.fulfilled, (state, action) => {
                state.paginatedOrders = action.payload.orders;
                state.totalOrders = action.payload.totalOrders;
                state.loading = false;
                state.error = null;
                state.status = 'success';
            })
            .addCase(fetchOrdersWithFilters.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.status = 'failed';
            })
            //Cases for fetching all filtered orders (unpaginated)
            .addCase(fetchAllFilteredOrders.pending, (state) => {
                state.loading = true;
                state.status = 'pending';
            })
            .addCase(fetchAllFilteredOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.status = 'success';
            })
            .addCase(fetchAllFilteredOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.status = 'failed';
            });
    },
});

// Exporting the actions and reducer
export const { resetOrderState, updateOrderInState } = orderSlice.actions;
export default orderSlice.reducer;













// import api from '@/common/axios';
// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// export const placeOrder = createAsyncThunk(
//     'order/placeOrder',
//     async (formData, { rejectWithValue }) => {
//         try {
//             const response = await api.post('/placeOrder', formData);
//             return response.data.order;
//         } catch (error) {
//             console.error('Error placing order:', error);
//             return rejectWithValue('Failed to place order');
//         }
//     }
// );

// export const fetchAllOrders = createAsyncThunk(
//     'order/fetchAllOrders',
//     async (_, { rejectWithValue }) => {
//         try {
//             const response = await api.get('/fetchAllOrder');
//             return response.data.orders;
//         } catch (error) {
//             console.error('Error fetching all orders:', error);
//             return rejectWithValue('Failed to fetch orders');
//         }
//     }
// );

// export const fetchOrdersByDate = createAsyncThunk(
//     'order/fetchOrdersByDate',
//     async ({ startDate, endDate }, { rejectWithValue }) => {
//         try {
//             const response = await api.get(
//                 `/ordersbydate?startDate=${startDate}&endDate=${endDate}`
//             );
//             return response.data.orders;
//         } catch (error) {
//             console.error('Error fetching orders by date:', error);
//             return rejectWithValue('Failed to fetch orders by date');
//         }
//     }
// );

// export const updateOrder = createAsyncThunk(
//     'order/updateOrder',
//     async ({ orderId, updatedData }, { rejectWithValue }) => {
//         try {
//             const response = await api.put(`/orders/${orderId}`, updatedData);
//             return response.data.order;
//         } catch (error) {
//             console.error('Error updating order:', error);
//             return rejectWithValue('Failed to update order');
//         }
//     }
// );

// export const fetchPaginatedOrders = createAsyncThunk(
//     'order/fetchPaginatedOrders',
//     async ({ skip, limit }, { rejectWithValue }) => {
//         try {
//             const response = await api.get(`/allordersPaginated?skip=${skip}&limit=${limit}`);
//             return response.data;
//         } catch (error) {
//             console.error('Error fetching paginated orders:', error);
//             return rejectWithValue('Failed to fetch paginated orders');
//         }
//     }
// );

// export const fetchTotalOrdersCount = createAsyncThunk(
//     'order/fetchTotalOrdersCount',
//     async (_, { rejectWithValue }) => {
//         try {
//             const response = await api.get('/orders/count');
//             return response.data.totalOrders;
//         } catch (error) {
//             console.error('Error fetching total order count:', error);
//             return rejectWithValue('Failed to fetch total order count');
//         }
//     }
// );

// export const fetchOrdersWithFilters = createAsyncThunk(
//     'order/fetchOrdersWithFilters',
//     async (filters, { rejectWithValue }) => {
//         try {
//             const { skip, limit, searchQuery, startDate, endDate, referredBy, download } = filters;
//             const params = new URLSearchParams();
            
//             if (download) {
//                 params.append('download', download);
//             } else {
//                 params.append('skip', skip);
//                 params.append('limit', limit);
//             }
//             if (searchQuery && searchQuery.length > 0) {
//                 params.append('searchQuery', searchQuery);
//             }
//             if (referredBy && referredBy !== "none" && referredBy.length > 0) {
//                 params.append('referredBy', referredBy);
//             }
//             if (startDate && endDate) {
//                 params.append('startDate', startDate);
//             }
//             const response = await api.get(`/orders/filter?${params.toString()}`);
//             return response.data;
//         } catch (error) {
//             console.error('Error fetching orders with filters:', error);
//             return rejectWithValue('Failed to fetch orders with filters');
//         }
//     }
// );

// const orderSlice = createSlice({
//     name: 'order',
//     initialState: {
//         orderDetails: null,
//         allOrders: [], 
//         filteredOrders: [], 
//         paginatedOrders: [], 
//         totalOrders: 0, 
//         loading: false,
//         error: null, 
//         status: 'idle', 
//     },
//     reducers: {
//         resetOrderState: (state) => {
//             state.orderDetails = null;
//             state.allOrders = [];
//             state.filteredOrders = [];
//             state.paginatedOrders = [];
//             state.totalOrders = 0;
//             state.loading = false;
//             state.error = null;
//             state.status = 'idle';
//         },
//         updateOrderInState: (state, action) => {
//             const updatedOrder = action.payload;
//             const index = state.allOrders.findIndex(order => order._id === updatedOrder._id);
//             if (index !== -1) {
//                 state.allOrders[index] = updatedOrder;
//             }
//         }
//     },
//     extraReducers: (builder) => {
//         builder
//             .addCase(placeOrder.pending, (state) => {
//                 state.loading = true;
//                 state.status = 'pending';
//             })
//             .addCase(placeOrder.fulfilled, (state, action) => {
//                 state.orderDetails = action.payload;
//                 state.loading = false;
//             })
//             .addCase(placeOrder.rejected, (state, action) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })
//             .addCase(fetchAllOrders.pending, (state) => {
//                 state.loading = true;
//                 state.status = 'pending';
//             })
//             .addCase(fetchAllOrders.fulfilled, (state, action) => {
//                 state.allOrders = action.payload;
//                 state.loading = false;
//             })
//             .addCase(fetchAllOrders.rejected, (state, action) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })
//             .addCase(fetchOrdersByDate.pending, (state) => {
//                 state.loading = true;
//                 state.status = 'pending';
//             })
//             .addCase(fetchOrdersByDate.fulfilled, (state, action) => {
//                 state.filteredOrders = action.payload;
//                 state.loading = false;
//             })
//             .addCase(fetchOrdersByDate.rejected, (state, action) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })
//             .addCase(updateOrder.pending, (state) => {
//                 state.loading = true;
//                 state.status = 'pending';
//             })
//             .addCase(updateOrder.fulfilled, (state, action) => {
//                 const updatedOrder = action.payload;
//                 state.allOrders = state.allOrders.map((order) =>
//                     order._id === updatedOrder._id ? updatedOrder : order
//                 );
//                 state.loading = false;
//             })
//             .addCase(updateOrder.rejected, (state, action) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })
//             .addCase(fetchPaginatedOrders.pending, (state) => {
//                 state.loading = true;
//                 state.status = 'pending';
//             })
//             .addCase(fetchPaginatedOrders.fulfilled, (state, action) => {
//                 state.paginatedOrders = action.payload.orders;
//                 state.totalOrders = action.payload.totalOrders;
//                 state.loading = false;
//             })
//             .addCase(fetchPaginatedOrders.rejected, (state, action) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })
//             .addCase(fetchTotalOrdersCount.pending, (state) => {
//                 state.loading = true;
//                 state.status = 'pending';
//             })
//             .addCase(fetchTotalOrdersCount.fulfilled, (state, action) => {
//                 state.totalOrders = action.payload;
//                 state.loading = false;
//             })
//             .addCase(fetchTotalOrdersCount.rejected, (state, action) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })
//             .addCase(fetchOrdersWithFilters.pending, (state) => {
//                 state.loading = true;
//                 state.status = 'pending';
//             })
//             .addCase(fetchOrdersWithFilters.fulfilled, (state, action) => {
//                 state.paginatedOrders = action.payload.orders;
//                 state.totalOrders = action.payload.totalOrders;
//                 state.loading = false;
//             })
//             .addCase(fetchOrdersWithFilters.rejected, (state, action) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             });
//     },
// });

// export const { resetOrderState, updateOrderInState } = orderSlice.actions;
// export default orderSlice.reducer;