import axios from "axios";

const api = axios.create({
    baseURL: "/api/v1",
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        return Promise.reject(err);
    }
);

export const getServices = (params) => api.get("/admin/services", { params });
export const createService = (data) => api.post("/admin/services", data);
export const updateService = (id, data) => api.put(`/admin/services/${id}`, data);
export const deleteService = (id) => api.delete(`/admin/services/${id}`);
export const getServiceAvailability = (id, date) =>
    api.get(`/services/${id}/availability`, { params: { date } });

export const getStaff = (params) => api.get("/admin/staff", { params });
export const createStaff = (data) => api.post("/admin/staff", data);
export const updateStaff = (id, data) => api.put(`/admin/staff/${id}`, data);
export const deleteStaff = (id) => api.delete(`/admin/staff/${id}`);

export const createUser = (data) => api.post("/users", data);
export const getUserProfile = (id) => api.get(`/users/${id}`);
export const updateUserProfile = (id, data) => api.patch(`/users/${id}`, data);
export const getAdminUsers = (params) => api.get("/admin/users", { params });

export const getAdminBookings = (params) => api.get("/admin/bookings", { params });
export const updateBookingStatus = (id, data) => api.patch(`/admin/bookings/${id}/status`, data);
export const createSlot = (data) => api.post("/admin/bookings/slots", data);
export const createBooking = (data) => api.post("/bookings", data);
export const getMyBookings = (params) => api.get("/bookings", { params });
export const cancelBooking = (id, data) => api.patch(`/bookings/${id}/cancel`, data);

export const getSettings = () => api.get("/admin/settings");
export const updateSettings = (data) => api.patch("/admin/settings", data);

export const uploadImage = (data) => api.post("/admin/upload", data, { headers: { "Content-Type": "multipart/form-data" } });

export const aiChat = (query) => api.post("/admin/ai/chat", { query });

export const getDashboardAnalytics = () => api.get("/admin/analytics/dashboard");

export const adminSearch = (q) => api.get("/admin/search", { params: { q } });


export default api;
