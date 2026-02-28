import React, { useEffect, useState, useCallback } from "react";
import Layout from "../../components/Layout.jsx";
import { getStaff, createStaff, updateStaff, deleteStaff, getServices } from "../../services/api.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import Notification from "../../components/Notification.jsx";
import "./Staff.css";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const defaultWorkingHours = DAYS.map(day => ({ day, startTime: "09:00", endTime: "21:00" }));
const emptyForm = { name: "", email: "", phone: "", specialization: "", services: [], workingHours: defaultWorkingHours };

function ServiceTag({ name }) {
    return <span className="service-tag">{name}</span>;
}

function Staff() {
    const [staff, setStaff] = useState([]);
    const [services, setServices] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [editId, setEditId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [notification, setNotification] = useState({ message: "", type: "success" });
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const fetchStaff = useCallback((q, p) => {
        const q_ = q !== undefined ? q : search;
        const p_ = p !== undefined ? p : page;
        setLoading(true);
        getStaff({ search: q_, page: p_, limit: 15 })
            .then((r) => { setStaff(r.data.data || []); setMeta(r.data.meta || {}); })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [search, page]);

    useEffect(() => { fetchStaff(); }, []);
    useEffect(() => {
        getServices({ limit: 100 })
            .then((r) => setServices(r.data.data || []))
            .catch(() => { });
    }, []);

    const handleSearch = (val) => {
        setSearch(val);
        setPage(1);
        fetchStaff(val, 1);
    };

    const openCreate = () => { setForm(emptyForm); setEditId(null); setModal(true); };
    const openEdit = (s) => {
        setForm({
            name: s.name,
            email: s.email,
            phone: s.phone || "",
            specialization: s.specialization || "",
            services: s.services?.map((sv) => sv._id || sv) || [],
            workingHours: s.workingHours?.length ? s.workingHours : defaultWorkingHours,
        });
        setEditId(s._id);
        setModal(true);
    };
    const closeModal = () => setModal(false);
    const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const toggleService = (id) => {
        setForm((f) => ({
            ...f,
            services: f.services.includes(id)
                ? f.services.filter((s) => s !== id)
                : [...f.services, id],
        }));
    };

    const handleHourChange = (day, field, val) => {
        setForm(f => ({
            ...f,
            workingHours: f.workingHours.map(h =>
                h.day === day ? { ...h, [field]: val } : h
            )
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editId) await updateStaff(editId, form);
            else await createStaff(form);
            setNotification({ message: `Stylist ${editId ? "updated" : "added"} successfully!`, type: "success" });
            closeModal();
            fetchStaff();
        } catch (err) {
            setNotification({ message: err.response?.data?.message || "Error saving staff", type: "error" });
        } finally { setSubmitting(false); }
    };

    const handleDeactivate = async (id) => {
        if (!confirm("Deactivate this stylist?")) return;
        await deleteStaff(id).catch(() => { });
        fetchStaff();
    };

    // Group services by category for the modal selector
    const servicesByCategory = services.reduce((acc, s) => {
        if (!acc[s.category]) acc[s.category] = [];
        acc[s.category].push(s);
        return acc;
    }, {});

    return (
        <Layout>
            <div className="staff-page">
                <header className="page-header">
                    <div>
                        <h1 className="page-title">Stylists</h1>
                        <p className="page-subtitle">{meta.total ?? 0} active stylists</p>
                    </div>
                    <button className="btn btn--primary" onClick={openCreate} id="add-staff-btn">
                        + Add Stylist
                    </button>
                </header>

                {/* Search bar */}
                <div className="filter-bar" style={{ marginBottom: 20 }}>
                    <input
                        className="form-input filter-bar__search"
                        placeholder="Search stylists by name…"
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        id="staff-search"
                    />
                </div>

                {loading ? (
                    <LoadingSpinner />
                ) : staff.length === 0 ? (
                    <p className="page-loading">No stylists found.</p>
                ) : (
                    <>
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        {["Name", "Contact", "Specialization", "Services", "Actions"].map((h) => (
                                            <th key={h}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {staff.map((s) => (
                                        <tr key={s._id}>
                                            <td><strong>{s.name}</strong></td>
                                            <td className="muted">
                                                <div>{s.email}</div>
                                                {s.phone && <div style={{ fontSize: "0.75rem" }}>📱 {s.phone}</div>}
                                            </td>
                                            <td>{s.specialization || "—"}</td>
                                            <td>
                                                <div className="service-tags">
                                                    {s.services?.length
                                                        ? s.services.map((sv) => <ServiceTag key={sv._id} name={sv.name} />)
                                                        : <span className="muted">None assigned</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="row-actions">
                                                    <button className="btn btn--sm btn--secondary" onClick={() => openEdit(s)}>Edit</button>
                                                    <button className="btn btn--sm btn--danger" onClick={() => handleDeactivate(s._id)}>Remove</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {meta.totalPages > 1 && (
                            <div className="pagination">
                                <button className="btn btn--secondary btn--sm" disabled={page <= 1} onClick={() => { setPage(p => p - 1); fetchStaff(search, page - 1); }}>← Prev</button>
                                <span className="pagination__info">Page {page} of {meta.totalPages}</span>
                                <button className="btn btn--secondary btn--sm" disabled={page >= meta.totalPages} onClick={() => { setPage(p => p + 1); fetchStaff(search, page + 1); }}>Next →</button>
                            </div>
                        )}
                    </>
                )}

                {modal && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal staff-modal" onClick={(e) => e.stopPropagation()}>
                            <h2 className="modal__title">{editId ? "Edit Stylist" : "Add Stylist"}</h2>
                            <form className="modal__form" onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Name *</label>
                                        <input className="form-input" name="name" value={form.name} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email *</label>
                                        <input className="form-input" name="email" type="email" value={form.email} onChange={handleChange} required />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Phone</label>
                                        <input className="form-input" name="phone" value={form.phone} onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Specialization</label>
                                        <input className="form-input" name="specialization" value={form.specialization} onChange={handleChange} />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Services Offered</label>
                                    <p className="staff-modal__hint">Select which services this stylist performs</p>
                                    <div className="service-picker" style={{ marginBottom: 16 }}>
                                        {Object.entries(servicesByCategory).map(([cat, svcs]) => (
                                            <div key={cat} className="service-picker__group">
                                                <p className="service-picker__cat">{cat}</p>
                                                <div className="service-picker__items">
                                                    {svcs.map((sv) => (
                                                        <label key={sv._id} className="service-picker__item">
                                                            <input
                                                                type="checkbox"
                                                                checked={form.services.includes(sv._id)}
                                                                onChange={() => toggleService(sv._id)}
                                                            />
                                                            <span>{sv.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Weekly Working Hours</label>
                                    <p className="staff-modal__hint">Set the daily start and end times for this stylist</p>
                                    <div className="working-hours-grid">
                                        {form.workingHours.map((h) => (
                                            <div key={h.day} className="hour-row">
                                                <span className="hour-row__day">{h.day}</span>
                                                <div className="hour-row__inputs">
                                                    <input
                                                        type="time"
                                                        className="form-input form-input--sm"
                                                        value={h.startTime}
                                                        onChange={(e) => handleHourChange(h.day, "startTime", e.target.value)}
                                                    />
                                                    <span className="hour-sep">to</span>
                                                    <input
                                                        type="time"
                                                        className="form-input form-input--sm"
                                                        value={h.endTime}
                                                        onChange={(e) => handleHourChange(h.day, "endTime", e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="modal__actions">
                                    <button type="button" className="btn btn--secondary" onClick={closeModal}>Cancel</button>
                                    <button type="submit" className="btn btn--primary" disabled={submitting}>
                                        {submitting ? "Saving…" : "Save"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
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

export default Staff;
