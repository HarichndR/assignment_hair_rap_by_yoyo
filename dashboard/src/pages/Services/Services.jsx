import React, { useEffect, useState, useCallback } from "react";
import Layout from "../../components/Layout.jsx";
import {
    getServices,
    createService,
    updateService,
    deleteService,
} from "../../services/api.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import Notification from "../../components/Notification.jsx";
import FilterDrawer from "../../components/FilterDrawer.jsx";
import SearchSelect from "../../components/SearchSelect.jsx";
import "./Services.css";

const emptyForm = { name: "", description: "", duration: 30, price: 0, category: "" };

function Services() {
    const [services, setServices] = useState([]);
    const [meta, setMeta] = useState({});
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        search: "", category: "", isActive: "true",
        sortBy: "name", sortOrder: "asc",
    });
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [editId, setEditId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [notification, setNotification] = useState({ message: "", type: "success" });

    const fetchServices = useCallback((f = filters, p = page) => {
        setLoading(true);
        getServices({ ...f, page: p, limit: 12 })
            .then((res) => {
                setServices(res.data.data || []);
                setMeta(res.data.meta || {});
                if (res.data.meta?.categories) setCategories(res.data.meta.categories);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchServices(filters, page); }, [filters, page]);

    const handleFilterChange = (key, val) => {
        setFilters((f) => ({ ...f, [key]: val }));
        setPage(1);
    };

    const clearFilters = () => {
        setFilters({ search: "", category: "", isActive: "true", sortBy: "name", sortOrder: "asc" });
        setPage(1);
    };

    const hasFilters = filters.search || filters.category || filters.isActive !== "true";

    const openCreate = () => { setForm(emptyForm); setEditId(null); setModal("create"); };
    const openEdit = (s) => {
        setForm({ name: s.name, description: s.description || "", duration: s.duration, price: s.price, category: s.category });
        setEditId(s._id);
        setModal("edit");
    };
    const closeModal = () => setModal(null);

    const handleChange = (e) =>
        setForm((f) => ({ ...f, [e.target.name]: e.target.type === "number" ? Number(e.target.value) : e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (modal === "create") await createService(form);
            else await updateService(editId, form);
            setNotification({ message: `Service ${modal === "create" ? "added" : "updated"} successfully!`, type: "success" });
            closeModal();
            fetchServices(filters, page);
        } catch (err) {
            setNotification({ message: err.response?.data?.message || "Error saving service", type: "error" });
        } finally { setSubmitting(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm("Deactivate this service?")) return;
        await deleteService(id).catch(() => { });
        fetchServices(filters, page);
    };

    return (
        <Layout>
            <div className="services-page">
                <header className="page-header">
                    <div>
                        <h1 className="page-title">Services</h1>
                        <p className="page-subtitle">{meta.total ?? 0} services found</p>
                    </div>
                    <div className="page-header__actions">
                        <button
                            className={`btn btn--secondary ${hasFilters ? "btn--has-filters" : ""}`}
                            onClick={() => setIsFilterOpen(true)}
                        >
                            Filter
                        </button>
                        <button className="btn btn--primary" onClick={openCreate} id="create-service-btn">
                            + Add Service
                        </button>
                    </div>
                </header>

                <FilterDrawer
                    isOpen={isFilterOpen}
                    onClose={() => setIsFilterOpen(false)}
                    onClear={clearFilters}
                    hasFilters={hasFilters}
                >
                    <div className="form-group">
                        <label className="form-label">Search</label>
                        <input
                            className="form-input"
                            placeholder="e.g. Haircut..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange("search", e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Category</label>
                        <SearchSelect
                            options={categories.map(c => ({ value: c, label: c }))}
                            value={filters.category}
                            onChange={(val) => handleFilterChange("category", val)}
                            placeholder="All Categories"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select className="form-input" value={filters.isActive} onChange={(e) => handleFilterChange("isActive", e.target.value)}>
                            <option value="">All Status</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Sort By</label>
                        <select className="form-input" value={filters.sortBy} onChange={(e) => handleFilterChange("sortBy", e.target.value)}>
                            <option value="name">Name</option>
                            <option value="price">Price</option>
                            <option value="duration">Duration</option>
                            <option value="createdAt">Newest</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Order</label>
                        <select className="form-input" value={filters.sortOrder} onChange={(e) => handleFilterChange("sortOrder", e.target.value)}>
                            <option value="asc">↑ Ascending</option>
                            <option value="desc">↓ Descending</option>
                        </select>
                    </div>
                </FilterDrawer>

                {loading ? (
                    <LoadingSpinner />
                ) : services.length === 0 ? (
                    <p className="page-loading">No services match your filters.</p>
                ) : (
                    <>
                        <div className="services-grid">
                            {services.map((s) => (
                                <div className={`service-card ${!s.isActive ? "service-card--inactive" : ""}`} key={s._id}>
                                    <div className="service-card__image-container">
                                        {s.images?.[0]?.url ? (
                                            <img
                                                src={s.images[0].url}
                                                alt={s.name}
                                                className="service-card__img"
                                            />
                                        ) : (
                                            <div className="service-card__skeleton">
                                                <span>🖼️</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="service-card__header">
                                        <span className="service-card__category">{s.category}</span>
                                        <span className="service-card__price">₹{s.price}</span>
                                    </div>
                                    <h3 className="service-card__name">{s.name}</h3>
                                    <p className="service-card__description">{s.description || "No description"}</p>
                                    <div className="service-card__meta">
                                        <span>⏱ {s.duration} min</span>
                                        {!s.isActive && <span className="service-card__inactive-badge">Inactive</span>}
                                    </div>
                                    <div className="service-card__actions">
                                        <button className="btn btn--sm btn--secondary" onClick={() => openEdit(s)}>Edit</button>
                                        {s.isActive && (
                                            <button className="btn btn--sm btn--danger" onClick={() => handleDelete(s._id)}>Deactivate</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {meta.totalPages > 1 && (
                            <div className="pagination" style={{ marginTop: 24 }}>
                                <button className="btn btn--secondary btn--sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                                <span className="pagination__info">Page {page} of {meta.totalPages}</span>
                                <button className="btn btn--secondary btn--sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                            </div>
                        )}
                    </>
                )}

                {modal && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <h2 className="modal__title">{modal === "create" ? "Add Service" : "Edit Service"}</h2>
                            <form className="modal__form" onSubmit={handleSubmit}>
                                {[["name", "Name", true], ["description", "Description", false], ["category", "Category", true]].map(([n, l, r]) => (
                                    <div className="form-group" key={n}>
                                        <label className="form-label">{l}{r ? " *" : ""}</label>
                                        <input className="form-input" name={n} value={form[n]} onChange={handleChange} required={r} />
                                    </div>
                                ))}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Duration (min) *</label>
                                        <input className="form-input" name="duration" type="number" min="15" value={form.duration} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Price (₹) *</label>
                                        <input className="form-input" name="price" type="number" min="0" value={form.price} onChange={handleChange} required />
                                    </div>
                                </div>
                                <div className="modal__actions">
                                    <button type="button" className="btn btn--secondary" onClick={closeModal}>Cancel</button>
                                    <button type="submit" className="btn btn--primary" disabled={submitting}>{submitting ? "Saving…" : "Save"}</button>
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
} // Missing closing brace added here
export default Services;
