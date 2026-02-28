import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout.jsx";
import { getSettings, updateSettings } from "../../services/api.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import Notification from "../../components/Notification.jsx";
import "./Settings.css";

function Settings() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [notification, setNotification] = useState({ message: "", type: "success" });
    const [success, setSuccess] = useState("");

    useEffect(() => {
        getSettings()
            .then(res => {
                setSettings(res.data.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSubmitting(true);
        try {
            await updateSettings(settings);
            setNotification({ message: "Salon settings and business hours updated!", type: "success" });
        } catch (err) {
            setNotification({ message: err.response?.data?.message || "Error saving settings", type: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Layout><LoadingSpinner fullPage /></Layout>;

    return (
        <Layout>
            <div className="settings-page">
                <header className="page-header">
                    <div>
                        <h1 className="page-title">Salon Settings</h1>
                        <p className="page-subtitle">Configure global business hours and policies</p>
                    </div>
                </header>

                <div className="settings-content">
                    <div className="settings-section">
                        <h2 className="settings-section__title">General Policies</h2>
                        <div className="settings-card">
                            <div className="form-group">
                                <label className="form-label">Cancellation Window (Hours)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={settings.cancellationWindowHours}
                                    onChange={(e) => setSettings({ ...settings, cancellationWindowHours: parseInt(e.target.value) })}
                                />
                                <p className="form-help">Minimum time before appointment for customer cancellations.</p>
                            </div>
                        </div>
                    </div>

                    <div className="settings-section">
                        <h2 className="settings-section__title">Global Business Hours</h2>
                        <div className="settings-card">
                            <div className="form-group">
                                <label className="form-label">Salon Operational Hours (Every Day)</label>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <input
                                        type="time"
                                        className="form-input"
                                        value={settings.salonStartTime || "09:00"}
                                        onChange={(e) => setSettings({ ...settings, salonStartTime: e.target.value })}
                                    />
                                    <span>to</span>
                                    <input
                                        type="time"
                                        className="form-input"
                                        value={settings.salonEndTime || "21:00"}
                                        onChange={(e) => setSettings({ ...settings, salonEndTime: e.target.value })}
                                    />
                                </div>
                                <p className="form-help">Set the start and end time when the salon is open for all days.</p>
                            </div>
                        </div>
                    </div>


                    <button
                        className="btn btn--primary btn--large"
                        onClick={handleSave}
                        disabled={submitting}
                    >
                        {submitting ? "Saving…" : "Apply Global Settings"}
                    </button>
                </div>

                <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification({ message: "", type: "success" })}
                />
            </div>
        </Layout>
    );
}

export default Settings;
