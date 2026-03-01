import React, { useEffect, useState, useCallback } from "react";
import Layout from "../../components/Layout.jsx";
import { aiChat, getStaff, updateStaff, getDashboardAnalytics } from "../../services/api.js";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from "recharts";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import "./Dashboard.css";

function StatCard({ label, value, sub, accent, indicator }) {
    return (
        <div className="stat-card animate-in" style={{ "--accent": accent }}>
            <p className="stat-card__label">{label}</p>
            <div style={{ display: "flex", alignItems: "baseline" }}>
                <p className="stat-card__value">{value ?? "—"}</p>
                {indicator && (
                    <span className={`stat-card__indicator indicator--${indicator.type}`}>
                        {indicator.type === 'up' ? '↑' : ''} {indicator.value}
                    </span>
                )}
            </div>
            {sub && <p className="stat-card__sub">{sub}</p>}
        </div>
    );
}

function RevenueTrend({ data }) {
    if (!data || data.length === 0) return <p className="dashboard__loading-text">No trend data available.</p>;

    return (
        <div className="dashboard__chart-card glass-card animate-in">
            <h2 className="dash-section-title">📈 Revenue Trajectory</h2>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="name" stroke="var(--color-text-light)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--color-text-light)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)' }}
                            formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="var(--color-primary)"
                            strokeWidth={3}
                            dot={{ r: 4, fill: "var(--color-primary)", strokeWidth: 2, stroke: "#fff" }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function ActivityFeed({ activities }) {
    const getStatusIcon = (status) => {
        switch (status) {
            case 'confirmed': return { icon: '✅', bg: '#dcfce7' };
            case 'pending': return { icon: '⏳', bg: '#fef3c7' };
            case 'cancelled': return { icon: '❌', bg: '#fee2e2' };
            default: return { icon: '📅', bg: '#f1f5f9' };
        }
    };

    return (
        <div className="dashboard__chart-card glass-card animate-in">
            <h2 className="dash-section-title">⚡ Live Activity</h2>
            <div className="activity-feed">
                {activities.length === 0 ? (
                    <p className="dashboard__loading-text">No recent activity.</p>
                ) : (
                    activities.map((item, idx) => {
                        const style = getStatusIcon(item.status);
                        return (
                            <div key={item.id} className="activity-item" style={{ animationDelay: `${idx * 0.05}s` }}>
                                <div className="activity-icon" style={{ background: style.bg }}>{style.icon}</div>
                                <div className="activity-info">
                                    <p className="activity-text">
                                        <strong>{item.user}</strong> booked <strong>{item.service}</strong>
                                    </p>
                                    <p className="activity-time">{new Date(item.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {item.status}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
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
        <div className="dashboard__chart-card glass-card animate-in">
            <h2 className="dash-section-title">🎯 Booking Distribution</h2>
            <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
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
    const [chartData, setChartData] = useState({ topServices: [], topStaff: [], revenueTrend: [] });
    const [activities, setActivities] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [aiSummary, setAiSummary] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [summaryDays, setSummaryDays] = useState(7);

    const fetchData = useCallback(async (isInitial = false) => {
        if (isInitial) setLoading(true);
        else setRefreshing(true);

        try {
            const res = await getDashboardAnalytics();
            const { stats, charts, recentActivities } = res.data.data;

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
            setActivities(recentActivities || []);
        } catch (err) {
            console.error("Error fetching analytics", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData(true);


        getStaff({ limit: 8 })
            .then(res => setStaffList(res.data.data || []))
            .catch(() => { });


        const interval = setInterval(() => fetchData(), 30000);
        return () => clearInterval(interval);
    }, [fetchData]);


    const toggleStaffAvailability = async (id, currentStatus) => {
        try {
            await updateStaff(id, { isAvailable: !currentStatus });
            setStaffList(prev => prev.map(s => s._id === id ? { ...s, isAvailable: !currentStatus } : s));
        } catch (err) {
            console.error("Failed to toggle availability", err);
        }
    };

    useEffect(() => {
        if (!stats) return;
        setSummaryLoading(true);
        aiChat(`Business context: Total Revenue is ₹${stats.totalRevenue}, Customers: ${stats.totalCustomers}, Active Bookings: ${stats.confirmed + stats.pending}. 
        Provide a strategic business analysis report for the last ${summaryDays} days. Focus on growth and optimization. Use HTML tags (<h3>, <p>, <strong>, <ul>, <li>).`)
            .then((res) => setAiSummary(res.data.data.answer))
            .catch(() => setAiSummary("Failed to generate AI Insights."))
            .finally(() => setSummaryLoading(false));
    }, [summaryDays, stats === null]);


    const total = stats ? stats.pending + stats.confirmed + stats.cancelled : 0;

    if (loading) return <LoadingSpinner />;

    return (
        <Layout>
            <div className="dashboard animate-in">
                <header className="dashboard-header">
                    <div>
                        <h1 className="page-title">Salon Command Center</h1>
                        <p className="page-subtitle">
                            {new Date().toLocaleDateString("en-IN", {
                                weekday: "long", year: "numeric", month: "long", day: "numeric",
                            })}
                            {refreshing && <span style={{ marginLeft: 12, fontSize: '0.8rem', color: 'var(--color-primary)' }}>• Updating live...</span>}
                        </p>
                    </div>
                    <div className="dashboard-actions-top">
                        <a href="/bookings" className="btn-primary">Manage Bookings</a>
                    </div>
                </header>

                {}
                <div className="dashboard__stats-grid">
                    <StatCard
                        label="Total Revenue"
                        value={`₹${stats?.totalRevenue?.toLocaleString("en-IN") ?? 0}`}
                        sub="Net earnings"
                        accent="#059669"
                        indicator={{ type: 'up', value: '12%' }}
                    />
                    <StatCard
                        label="Active Customers"
                        value={stats?.totalCustomers ?? 0}
                        sub="Registered user base"
                        accent="#2563eb"
                        indicator={{ type: 'neutral', value: 'Stable' }}
                    />
                    <StatCard
                        label="Appointments"
                        value={stats?.totalBookings ?? 0}
                        sub="Lifetime volume"
                        accent="#7c3aed"
                        indicator={{ type: 'up', value: '8%' }}
                    />
                    <StatCard
                        label="Pending Action"
                        value={stats?.pending ?? 0}
                        sub="Needs approval"
                        accent="#f59e0b"
                    />
                </div>

                <div className="dashboard__main-grid">
                    <div className="dashboard__main-left">
                        {}
                        <RevenueTrend data={chartData.revenueTrend} />

                        {}
                        <div className="dashboard__charts-container" style={{ marginTop: 24 }}>
                            <div className="dashboard__chart-card glass-card">
                                <h2 className="dash-section-title">🔥 Popular Services</h2>
                                <div style={{ width: '100%', height: 220 }}>
                                    <ResponsiveContainer>
                                        <BarChart data={chartData.topServices} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <XAxis dataKey="name" stroke="var(--color-text-light)" fontSize={10} tickFormatter={(val) => val.substring(0, 8)} />
                                            <YAxis stroke="var(--color-text-light)" fontSize={10} />
                                            <Tooltip cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                            <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="dashboard__chart-card glass-card">
                                <h2 className="dash-section-title">🏆 Top Performers</h2>
                                <div style={{ width: '100%', height: 220 }}>
                                    <ResponsiveContainer>
                                        <BarChart data={chartData.topStaff} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <XAxis dataKey="name" stroke="var(--color-text-light)" fontSize={10} />
                                            <YAxis stroke="var(--color-text-light)" fontSize={10} />
                                            <Tooltip cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                            <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    <aside className="dashboard__main-right">
                        {}
                        <ActivityFeed activities={activities} />

                        {}
                        <div style={{ marginTop: 24 }}>
                            <StatusDonut
                                pending={stats?.pending ?? 0}
                                confirmed={stats?.confirmed ?? 0}
                                cancelled={stats?.cancelled ?? 0}
                                total={total}
                            />
                        </div>
                    </aside>
                </div>

                {}
                <section className="dashboard__ai-analyst glass-card animate-in">
                    <div className="ai-analyst-header">
                        <h2 className="dash-section-title" style={{ marginBottom: 0 }}>
                            <span style={{ color: "var(--color-primary)", marginRight: 8 }}>✨</span>
                            Business Intelligence Report
                        </h2>
                        <select
                            className="ai-period-select"
                            value={summaryDays}
                            onChange={(e) => setSummaryDays(Number(e.target.value))}
                            disabled={summaryLoading}
                        >
                            <option value={7}>Last 7 Days</option>
                            <option value={14}>Last 14 Days</option>
                            <option value={30}>Last 30 Days</option>
                        </select>
                    </div>
                    <div className="ai-analyst-content">
                        {summaryLoading ? (
                            <div className="ai-loading-skeleton">
                                <div className="skeleton-line" style={{ width: '90%' }}></div>
                                <div className="skeleton-line" style={{ width: '70%' }}></div>
                                <div className="skeleton-line" style={{ width: '80%' }}></div>
                                <p className="dashboard__loading-text" style={{ marginTop: 16 }}>Gemini is synthesizing performance data...</p>
                            </div>
                        ) : (
                            <div className="ai-markdown" dangerouslySetInnerHTML={{ __html: aiSummary }}></div>
                        )}
                    </div>
                </section>

                {}
                <section className="dashboard__team-status glass-card animate-in">
                    <h2 className="dash-section-title">👥 Team Availability</h2>
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
