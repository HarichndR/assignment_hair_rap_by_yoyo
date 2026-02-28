import React, { useEffect, useState, useCallback } from "react";
import Layout from "../../components/Layout.jsx";
import { getAdminBookings, updateBookingStatus, getStaff } from "../../services/api.js";
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
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        status: "", staffId: "", fromDate: "", toDate: "",
        sortBy: "date", sortOrder: "desc",
    });
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [notification, setNotification] = useState({ message: "", type: "success" });

    const fetchBookings = useCallback((f = filters, p = page) => {
        setLoading(true);
        getAdminBookings({ ...f, page: p, limit: 15 })
            .then((r) => { setBookings(r.data.data || []); setMeta(r.data.meta || {}); })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchBookings(filters, page); }, [filters, page]);
    useEffect(() => {
        getStaff({ limit: 100 }).then((r) => setStaffList(r.data.data || [])).catch(() => { });
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
                    <button
                        className={`btn btn--secondary ${hasFilters ? "btn--has-filters" : ""}`}
                        onClick={() => setIsFilterOpen(true)}
                    >
                        Filter
                    </button>
                </header>

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
