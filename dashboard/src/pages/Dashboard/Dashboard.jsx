import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout.jsx";
import { getAdminBookings, aiChat, getStaff, updateStaff, getDashboardAnalytics } from "../../services/api.js";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import "./Dashboard.css";

function StatCard({ label, value, sub, accent }) {
    return (
        <div className="stat-card" style={{ "--accent": accent }}>
            <p className="stat-card__label">{label}</p>
            <p className="stat-card__value">{value ?? "—"}</p>
            {sub && <p className="stat-card__sub">{sub}</p>}
        </div>
    );
}

function StatusDonut({ pending, confirmed, cancelled, total }) {
    if (!total) return null;

    const data = [
        { name: "Confirmed", value: confirmed, color: "#22c55e" },
        { name: "Pending", value: pending, color: "#f59e0b" },
        { name: "Cancelled", value: cancelled, color: "#ef4444" },
    ].filter(d => d.value > 0);

    return (
        <div className="dashboard__chart-card" style={{ width: '100%' }}>
            <h2 className="dash-section-title" style={{ textAlign: "center" }}>Booking Status Breakdown</h2>
            <div style={{ width: '100%', height: 320, display: 'flex', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={120}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            itemStyle={{ color: 'var(--color-heading)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}


function Dashboard() {
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState({ topServices: [], topStaff: [] });
    const [staffList, setStaffList] = useState([]);
    const [chartLoading, setChartLoading] = useState(true);
    const [loading, setLoading] = useState(true);

    const [aiSummary, setAiSummary] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [summaryDays, setSummaryDays] = useState(3);

    useEffect(() => {
        // Fetch All-in-one Dashboard Analytics
        getDashboardAnalytics()
            .then(res => {
                const { stats, charts } = res.data.data;
                setStats({
                    pending: stats.pendingBookings,
                    confirmed: stats.confirmedBookings,
                    cancelled: stats.cancelledBookings,
                    today: stats.todayBookings,
                    totalRevenue: stats.totalRevenue,
                    totalCustomers: stats.totalCustomers,
                    totalBookings: stats.totalBookings
                });
                setChartData(charts);
            })
            .catch(err => console.error("Error fetching analytics", err))
            .finally(() => {
                setLoading(false);
                setChartLoading(false);
            });

        // Fetch Staff for the availability toggle section
        getStaff({ limit: 10 })
            .then(res => setStaffList(res.data.data || []))
            .catch(() => { });
    }, []);


    const toggleStaffAvailability = async (id, currentStatus) => {
        try {
            await updateStaff(id, { isAvailable: !currentStatus });
            setStaffList(prev => prev.map(s => s._id === id ? { ...s, isAvailable: !currentStatus } : s));
        } catch (err) {
            console.error("Failed to toggle availability", err);
        }
    };

    // Fetch AI Summary whenever the date range (summaryDays) changes
    useEffect(() => {
        setSummaryLoading(true);
        aiChat(`Provide a big, comprehensive business analysis report for the last ${summaryDays} days. Include key trends, revenue breakdown insights, customer growth analysis, staff performance highlights, and 3 specific strategic recommendations for improvement. Use HTML tags (<h3>, <p>, <strong>, <ul>, <li>) for formatting; do NOT use markdown stars or hashes.`)
            .then((res) => setAiSummary(res.data.data.answer))
            .catch(() => setAiSummary("Failed to generate AI Insights."))
            .finally(() => setSummaryLoading(false));
    }, [summaryDays]);


    const total = stats ? stats.pending + stats.confirmed + stats.cancelled : 0;

    return (
        <Layout>
            <div className="dashboard">
                <header className="page-header dashboard-header">
                    <div>
                        <h1 className="page-title">Dashboard Overview</h1>
                        <p className="page-subtitle">
                            {new Date().toLocaleDateString("en-IN", {
                                weekday: "long", year: "numeric", month: "long", day: "numeric",
                            })}
                        </p>
                    </div>
                    <div className="dashboard-actions-top">
                        <a href="/bookings" className="btn-primary">View All Bookings</a>
                    </div>
                </header>

                {/* AI Business Analyst Widget */}
                <section className="dashboard__ai-analyst">
                    <div className="ai-analyst-header">
                        <h2 className="dash-section-title" style={{ marginBottom: 0 }}>
                            <span style={{ color: "var(--color-primary)", marginRight: 8 }}>✨</span>
                            AI Business Summary
                        </h2>
                        <select
                            className="ai-period-select"
                            value={summaryDays}
                            onChange={(e) => setSummaryDays(Number(e.target.value))}
                            disabled={summaryLoading}
                        >
                            <option value={3}>Last 3 Days</option>
                            <option value={7}>Last 7 Days</option>
                            <option value={30}>Last 30 Days</option>
                        </select>
                    </div>
                    <div className="ai-analyst-content">
                        {summaryLoading ? (
                            <div className="ai-loading-skeleton">
                                <div className="skeleton-line" style={{ width: '90%' }}></div>
                                <div className="skeleton-line" style={{ width: '70%' }}></div>
                                <div className="skeleton-line" style={{ width: '80%' }}></div>
                                <p className="dashboard__loading-text" style={{ marginTop: 16 }}>Gemini is analyzing your data...</p>
                            </div>
                        ) : (
                            <div className="ai-markdown" dangerouslySetInnerHTML={{ __html: aiSummary }}></div>
                        )}
                    </div>
                </section>

                {loading ? (
                    <LoadingSpinner />
                ) : (
                    <>
                        {/* 4 Stat Cards */}
                        <div className="dashboard__stats-grid">
                            <StatCard
                                label="Total Revenue"
                                value={`₹${stats?.totalRevenue?.toLocaleString("en-IN") ?? 0}`}
                                sub="Confirmed earnings"
                                accent="#059669"
                            />
                            <StatCard
                                label="Total Customers"
                                value={stats?.totalCustomers ?? 0}
                                sub="Registered users"
                                accent="#2563eb"
                            />
                            <StatCard
                                label="Pending Approval"
                                value={stats?.pending ?? 0}
                                sub="Awaiting confirmation"
                                accent="#f59e0b"
                            />
                            <StatCard
                                label="Total Bookings"
                                value={stats?.totalBookings ?? 0}
                                sub="All-time volume"
                                accent="#111827"
                            />
                        </div>

                    </>
                )}

                {/* Two Column Charts */}
                <div className="dashboard__charts-container">
                    {/* Top Services */}
                    <div className="dashboard__chart-card">
                        <h2 className="dash-section-title">Top 5 Services</h2>
                        <div className="dashboard__ai-chart">
                            {chartLoading ? (
                                <p className="dashboard__loading-text">Loading insights...</p>
                            ) : chartData.topServices?.length === 0 ? (
                                <p className="dashboard__loading-text">Not enough data to graph.</p>
                            ) : (
                                <div style={{ width: '100%', height: 280 }}>
                                    <ResponsiveContainer>
                                        <BarChart data={chartData.topServices} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <XAxis dataKey="name" stroke="var(--color-text-light)" fontSize={11} tickFormatter={(val) => val.length > 10 ? val.substring(0, 10) + '...' : val} />
                                            <YAxis stroke="var(--color-text-light)" fontSize={11} allowDecimals={false} />
                                            <Tooltip cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                            <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top Staff */}
                    <div className="dashboard__chart-card">
                        <h2 className="dash-section-title">Top 5 Staff Members</h2>
                        <div className="dashboard__ai-chart">
                            {chartLoading ? (
                                <p className="dashboard__loading-text">Loading insights...</p>
                            ) : chartData.topStaff?.length === 0 ? (
                                <p className="dashboard__loading-text">Not enough data to graph.</p>
                            ) : (
                                <div style={{ width: '100%', height: 280 }}>
                                    <ResponsiveContainer>
                                        <BarChart data={chartData.topStaff} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <XAxis dataKey="name" stroke="var(--color-text-light)" fontSize={11} />
                                            <YAxis stroke="var(--color-text-light)" fontSize={11} allowDecimals={false} />
                                            <Tooltip cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                            <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status Breakdown Donut Chart */}
                <div style={{ marginTop: 24, marginBottom: 24 }}>
                    <StatusDonut
                        pending={stats?.pending ?? 0}
                        confirmed={stats?.confirmed ?? 0}
                        cancelled={stats?.cancelled ?? 0}
                        total={total}
                    />
                </div>

                {/* Team Availability Toggle Section */}
                <section className="dashboard__team-status">
                    <h2 className="dash-section-title">Team Availability</h2>
                    <div className="staff-toggle-grid">
                        {staffList.map(s => (
                            <div key={s._id} className={`staff-toggle-card ${s.isAvailable ? 'staff--online' : 'staff--offline'}`}>
                                <div className="staff-toggle-info">
                                    <strong>{s.name}</strong>
                                    <span>{s.specialization}</span>
                                </div>
                                <button
                                    className={`btn btn--sm ${s.isAvailable ? 'btn--success' : 'btn--secondary'}`}
                                    onClick={() => toggleStaffAvailability(s._id, s.isAvailable)}
                                >
                                    {s.isAvailable ? 'Available' : 'Offline'}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </Layout>
    );
}

export default Dashboard;
