import React, { useEffect, useState, useCallback } from "react";
import Layout from "../../components/Layout.jsx";
import { getAdminBookings, updateBookingStatus, getStaff, getServices, getAdminUsers } from "../../services/api.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import Notification from "../../components/Notification.jsx";
import FilterDrawer from "../../components/FilterDrawer.jsx";
import SearchSelect from "../../components/SearchSelect.jsx";
import Pagination from "../../components/Pagination.jsx";
import "./Bookings.css";

const STATUS_COLORS = {
    pending: "#f59e0b",
    confirmed: "#22c55e",
    cancelled: "#ef4444",
};

const SORT_OPTIONS = [
    { value: "date", label: "Date" },
    { value: "createdAt", label: "Created At" },
];

function Bookings() {
    const [bookings, setBookings] = useState([]);
    const [meta, setMeta] = useState({});
    const [staffList, setStaffList] = useState([]);
    const [serviceList, setServiceList] = useState([]);
    const [userList, setUserList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        status: "", staffId: "", fromDate: "", toDate: "",
        sortBy: "date", sortOrder: "desc",
    });
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newBooking, setNewBooking] = useState({
        userId: "", serviceId: "", staffId: "", date: new Date().toISOString().split('T')[0], startTime: "10:00"
    });
    const [notification, setNotification] = useState({ message: "", type: "success" });

    const fetchBookings = useCallback((f = filters, p = page) => {
        setLoading(true);
        getAdminBookings({ ...f, page: p, limit: 15 })
            .then((r) => {
                setBookings(r?.data?.data || []);
                setMeta(r?.data?.meta || {});
            })
            .catch((err) => console.warn("Bookings fetch failed", err))
            .finally(() => setLoading(false));
    }, [filters, page]);

    useEffect(() => { fetchBookings(filters, page); }, [filters, page]);
    useEffect(() => {
        getStaff({ limit: 100 })
            .then((r) => setStaffList(r?.data?.data || []))
            .catch((err) => console.warn("Staff fetch failed", err));

        getServices({ limit: 100 })
            .then(r => setServiceList(r?.data?.data || []))
            .catch(err => console.warn("Services fetch failed", err));

        getAdminUsers({ limit: 100 })
            .then(r => setUserList(r?.data?.data || []))
            .catch(err => console.warn("Users fetch failed", err));
    }, []);

    const handleFilter = (key, val) => {
        setFilters((f) => ({ ...f, [key]: val }));
        setPage(1);
    };

    const handleStatusChange = async (id, status) => {
        try {
            await updateBookingStatus(id, { status });
            setNotification({ message: `Booking ${status} successfully!`, type: "success" });
            fetchBookings(filters, page);
        } catch (err) {
            setNotification({ message: err.response?.data?.message || "Update failed", type: "error" });
        }
    };

    const handleAddBooking = async (e) => {
        e.preventDefault();
        try {
            import("../../services/api.js").then(async api => {
                await api.createBooking(newBooking);
                setNotification({ message: "Booking created successfully!", type: "success" });
                setIsAddModalOpen(false);
                setNewBooking({
                    userId: "", serviceId: "", staffId: "", date: new Date().toISOString().split('T')[0], startTime: "10:00"
                });
                fetchBookings(filters, 1);
            });
        } catch (err) {
            setNotification({ message: err.response?.data?.message || "Creation failed", type: "error" });
        }
    };

    const clearFilters = () => {
        setFilters({ status: "", staffId: "", fromDate: "", toDate: "", sortBy: "date", sortOrder: "desc" });
        setPage(1);
    };

    const hasFilters = filters.status || filters.staffId || filters.fromDate || filters.toDate;

    return (
        <Layout>
            <div className="bookings-page">
                <header className="page-header">
                    <div>
                        <h1 className="page-title">Bookings</h1>
                        <p className="page-subtitle">{meta.total ?? 0} results</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn btn--primary" onClick={() => setIsAddModalOpen(true)}>
                            + Add Booking
                        </button>
                        <button
                            className={`btn btn--secondary ${hasFilters ? "btn--has-filters" : ""}`}
                            onClick={() => setIsFilterOpen(true)}
                        >
                            Filter
                        </button>
                    </div>
                </header>

                {isAddModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content glass-card animate-in fade-in-up">
                            <h2 className="modal-title">New Appointment</h2>
                            <form onSubmit={handleAddBooking} className="add-booking-form">
                                <div className="form-group">
                                    <label className="form-label">Customer</label>
                                    <select
                                        className="form-input"
                                        required
                                        value={newBooking.userId}
                                        onChange={(e) => setNewBooking({ ...newBooking, userId: e.target.value })}
                                    >
                                        <option value="">Select Customer</option>
                                        {(userList || []).map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                                    </select>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Service</label>
                                        <select
                                            className="form-input"
                                            required
                                            value={newBooking.serviceId}
                                            onChange={(e) => setNewBooking({ ...newBooking, serviceId: e.target.value })}
                                        >
                                            <option value="">Select Service</option>
                                            {(serviceList || []).map(s => <option key={s._id} value={s._id}>{s.name} - ₹{s.price}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Stylist</label>
                                        <select
                                            className="form-input"
                                            required
                                            value={newBooking.staffId}
                                            onChange={(e) => setNewBooking({ ...newBooking, staffId: e.target.value })}
                                        >
                                            <option value="">Select Stylist</option>
                                            {(staffList || []).map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Date</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            required
                                            value={newBooking.date}
                                            onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Start Time</label>
                                        <input
                                            type="time"
                                            className="form-input"
                                            required
                                            value={newBooking.startTime}
                                            onChange={(e) => setNewBooking({ ...newBooking, startTime: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn btn--secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn btn--primary">Create Booking</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <FilterDrawer
                    isOpen={isFilterOpen}
                    onClose={() => setIsFilterOpen(false)}
                    onClear={clearFilters}
                    hasFilters={hasFilters}
                >
                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select
                            className="form-input"
                            value={filters.status}
                            onChange={(e) => handleFilter("status", e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Stylist</label>
                        <SearchSelect
                            options={staffList.map(s => ({ value: s._id, label: s.name }))}
                            value={filters.staffId}
                            onChange={(val) => handleFilter("staffId", val)}
                            placeholder="All Stylists"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">From Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={filters.fromDate}
                            onChange={(e) => handleFilter("fromDate", e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">To Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={filters.toDate}
                            max={new Date().toISOString().split("T")[0]}
                            onChange={(e) => handleFilter("toDate", e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Sort By</label>
                        <select
                            className="form-input"
                            value={filters.sortBy}
                            onChange={(e) => handleFilter("sortBy", e.target.value)}
                        >
                            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Order</label>
                        <select
                            className="form-input"
                            value={filters.sortOrder}
                            onChange={(e) => handleFilter("sortOrder", e.target.value)}
                        >
                            <option value="desc">↓ Newest First</option>
                            <option value="asc">↑ Oldest First</option>
                        </select>
                    </div>
                </FilterDrawer>

                {loading ? (
                    <LoadingSpinner />
                ) : bookings.length === 0 ? (
                    <p className="page-loading">No bookings match your filters.</p>
                ) : (
                    <>
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        {["Customer", "Service", "Stylist", "Date & Time", "Status", "Actions"].map(
                                            (h) => <th key={h}>{h}</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map((b) => (
                                        <tr key={b._id}>
                                            <td>
                                                <div><strong>{b.userId?.name || "—"}</strong></div>
                                                <div className="muted td-small">{b.userId?.email}</div>
                                                {b.userId?.phone && <div className="muted td-small">📱 {b.userId.phone}</div>}
                                            </td>
                                            <td>
                                                <div>{b.serviceId?.name || "—"}</div>
                                                <div className="muted td-small">₹{b.serviceId?.price}</div>
                                            </td>
                                            <td>
                                                <div>{b.staffId?.name || "—"}</div>
                                                <div className="muted td-small">{b.staffId?.specialization}</div>
                                            </td>
                                            <td>
                                                <div>{b.date ? new Date(b.date).toLocaleDateString("en-IN") : "—"}</div>
                                                <div className="muted td-small">{b.startTime} – {b.endTime}</div>
                                            </td>
                                            <td>
                                                <span className="status-badge" style={{ "--scolor": STATUS_COLORS[b.status] }}>
                                                    {b.status}
                                                </span>
                                                {b.cancellationReason && (
                                                    <div className="muted td-small" title={b.cancellationReason}>
                                                        Reason: {b.cancellationReason.slice(0, 20)}…
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <div className="row-actions">
                                                    {b.status === "pending" && (
                                                        <button
                                                            className="btn btn--sm btn--primary"
                                                            onClick={() => handleStatusChange(b._id, "confirmed")}
                                                        >
                                                            Confirm
                                                        </button>
                                                    )}
                                                    {b.status !== "cancelled" && (
                                                        <button
                                                            className="btn btn--sm btn--danger"
                                                            onClick={() => handleStatusChange(b._id, "cancelled")}
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            currentPage={page}
                            totalPages={meta.totalPages}
                            onPageChange={(p) => setPage(p)}
                            totalResults={meta.total}
                        />
                    </>
                )}

                <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification({ message: "", type: "success" })}
                />
            </div>
        </Layout>
    );
}

export default Bookings;
