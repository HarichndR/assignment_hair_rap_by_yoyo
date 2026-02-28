import axios from "axios";

const api = axios.create({
    baseURL: "/api/v1",
    withCredentials: true, // send cookies automatically
    headers: { "Content-Type": "application/json" },
});

// Request interceptor — attach Bearer token if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Response interceptor — handle 401 globally
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem("accessToken");
            window.location.href = "/login";
        }
        return Promise.reject(err);
    }
);

// Auth
export const adminLogin = (data) => api.post("/auth/admin/login", data);
export const logout = () => api.post("/auth/logout");
export const getMe = () => api.get("/auth/me");

// Services
export const getServices = (params) => api.get("/services", { params });
export const createService = (data) => api.post("/admin/services", data);
export const updateService = (id, data) => api.put(`/admin/services/${id}`, data);
export const deleteService = (id) => api.delete(`/admin/services/${id}`);
export const getServiceAvailability = (id, date) =>
    api.get(`/services/${id}/availability`, { params: { date } });

// Staff
export const getStaff = (params) => api.get("/admin/staff", { params });
export const createStaff = (data) => api.post("/admin/staff", data);
export const updateStaff = (id, data) => api.put(`/admin/staff/${id}`, data);
export const deleteStaff = (id) => api.delete(`/admin/staff/${id}`);

// Users
export const createUser = (data) => api.post("/users", data);
export const getUserProfile = (id) => api.get(`/users/${id}`);
export const updateUserProfile = (id, data) => api.patch(`/users/${id}`, data);

// Bookings
export const getAdminBookings = (params) => api.get("/admin/bookings", { params });
export const updateBookingStatus = (id, data) => api.patch(`/admin/bookings/${id}/status`, data);
export const createSlot = (data) => api.post("/admin/bookings/slots", data);
export const createBooking = (data) => api.post("/bookings", data);
export const getMyBookings = (params) => api.get("/bookings", { params });
export const cancelBooking = (id, data) => api.patch(`/bookings/${id}/cancel`, data);

// Settings
export const getSettings = () => api.get("/admin/settings");
export const updateSettings = (data) => api.patch("/admin/settings", data);

// Uploads
export const uploadImage = (data) => api.post("/admin/upload", data, { headers: { "Content-Type": "multipart/form-data" } });

// AI Assistant
export const aiChat = (query) => api.post("/admin/ai/chat", { query });

// Analytics
export const getDashboardAnalytics = () => api.get("/admin/analytics/dashboard");

// Search
export const adminSearch = (q) => api.get("/admin/search", { params: { q } });


export default api;
