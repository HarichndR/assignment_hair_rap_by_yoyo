import React, { useEffect, useState, useMemo } from "react";
import Layout from "../../components/Layout.jsx";
import { getAdminBookings, getStaff } from "../../services/api.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import "./Availability.css";

const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function Schedule() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [bookings, setBookings] = useState([]);
    const [allStaff, setAllStaff] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        Promise.all([
            getAdminBookings({
                fromDate: firstDay.toISOString().split("T")[0],
                toDate: lastDay.toISOString().split("T")[0],
                limit: 1000,
                sortBy: "date",
                sortOrder: "asc"
            }),
            getStaff({ limit: 100 })
        ])
            .then(([bookRes, staffRes]) => {
                setBookings(bookRes.data.data || []);
                setAllStaff(staffRes.data.data || []);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [currentDate]);

    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];

        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            days.push({ day: prevMonthLastDay - i, month: month - 1, year, isCurrentMonth: false });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ day: i, month, year, isCurrentMonth: true });
        }
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ day: i, month: month + 1, year, isCurrentMonth: false });
        }
        return days;
    }, [currentDate]);

    const navigateMonth = (direction) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    };

    const isSameDate = (d1, d2) => {
        return d1.getDate() === d2.day && d1.getMonth() === d2.month && d1.getFullYear() === d2.year;
    };

    const isPastDate = (day) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(day.year, day.month, day.day);
        return target < today;
    };

    const isToday = (day) => {
        const today = new Date();
        return isSameDate(today, day);
    };

    const selectedDateBookings = useMemo(() => {
        return bookings.filter(b => {
            const bDate = new Date(b.date);
            return bDate.toDateString() === selectedDate.toDateString();
        });
    }, [bookings, selectedDate]);

    const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

    const renderSlots = () => {
        const hours = Array.from({ length: 11 }, (_, i) => i + 9); // 9 AM to 7 PM

        return (
            <div className="slots-grid">
                {hours.map(h => {
                    const slotStartMins = h * 60;
                    const slotEndMins = (h + 1) * 60;
                    const timeStr = `${String(h).padStart(2, '0')}:00`;

                    const timeToMins = (t) => {
                        const [hrs, mins] = t.split(':').map(Number);
                        return hrs * 60 + (mins || 0);
                    };

                    // Bookings that START in this specific hour (for the display list)
                    const dayBookings = selectedDateBookings.filter(b => b.startTime.startsWith(timeStr.split(':')[0]));

                    // Identify which staff are busy during ANY PART of this 60-minute window
                    const busyStaffIds = new Set();
                    selectedDateBookings.forEach(b => {
                        const start = timeToMins(b.startTime);
                        const end = timeToMins(b.endTime);
                        if (start < slotEndMins && end > slotStartMins) {
                            busyStaffIds.add(b.staffId?._id || b.staffId);
                        }
                    });

                    const busyStaff = allStaff.filter(s => busyStaffIds.has(s._id));
                    const freeStaff = allStaff.filter(s => !busyStaffIds.has(s._id) && s.isAvailable);

                    return (
                        <div key={h} className={`time-slot ${dayBookings.length > 0 ? 'time-slot--occupied' : 'time-slot--empty'}`}>
                            <div className="time-slot__header">
                                <span className="time-slot__time-label">
                                    {h > 12 ? `${h - 12}:00 PM` : h === 12 ? "12:00 PM" : `${h}:00 AM`}
                                </span>
                                <div className="slot-indicators">
                                    <span className="indicator busy">{busyStaff.length} Busy</span>
                                    <span className="indicator free">{freeStaff.length} Free</span>
                                </div>
                            </div>

                            {/* Detailed Bookings (if any) */}
                            {dayBookings.length > 0 && (
                                <div className="time-slot__bookings-list">
                                    {dayBookings.map(booking => (
                                        <div key={booking._id} className="booking-card-mini">
                                            <div className="booking-card-mini__main">
                                                <div className="customer-avatar-sm">
                                                    {booking.userId?.image?.url ? (
                                                        <img src={booking.userId.image.url} alt={booking.userId.name} />
                                                    ) : (
                                                        <span>{getInitials(booking.userId?.name || 'Walk in')}</span>
                                                    )}
                                                </div>
                                                <div className="booking-info-mini">
                                                    <div className="booking-info-mini__top">
                                                        <span className="customer-name">{booking.userId?.name || 'Walk-in'}</span>
                                                        <span className={`status-pill status-pill--${booking.status}`}>
                                                            {booking.status}
                                                        </span>
                                                    </div>
                                                    <div className="service-name-mini">{booking.serviceId?.name}</div>
                                                    <div className="staff-assignee-mini">
                                                        <span className="staff-icon">👤</span> {booking.staffId?.name}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="booking-card-mini__footer">
                                                <span className="price-tag">₹{booking.serviceId?.price}</span>
                                                <button className="btn-text-sm">Manage</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Staff Status List (Rich Real-World Detail) */}
                            <div className="staff-status-list">
                                <h4 className="staff-status-list__title">Staff Roster</h4>
                                {allStaff.length === 0 ? <p className="no-staff">No staff available</p> : (
                                    <div className="staff-roster-grid">
                                        {allStaff.map(staff => {
                                            const isBusy = busyStaffIds.has(staff._id);
                                            return (
                                                <div key={staff._id} className={`roster-item ${isBusy ? 'roster-item--busy' : 'roster-item--free'}`}>
                                                    <div className="roster-item__info">
                                                        <span className="roster-name">{staff.name}</span>
                                                        <span className="roster-skill">{staff.specialization}</span>
                                                    </div>
                                                    <div className={`roster-status-dot ${isBusy ? 'busy' : 'free'}`}></div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };



    return (
        <Layout>
            <div className="schedule-page">
                <header className="page-header" style={{ marginBottom: 24 }}>
                    <div>
                        <h1 className="page-title">Schedules</h1>
                        <p className="page-subtitle">Professional dual-pane oversight</p>
                    </div>
                </header>

                <div className="schedule-layout">
                    <aside className="schedule-sidebar">
                        <div className="calendar-card">
                            <div className="calendar-card__header">
                                <div className="calendar-card__title">
                                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </div>
                                <div className="calendar-card__nav">
                                    <button className="nav-arrow" onClick={() => navigateMonth(-1)}>←</button>
                                    <button className="nav-arrow" onClick={() => navigateMonth(1)}>→</button>
                                </div>
                            </div>

                            <div className="calendar-card__grid">
                                {DAYS_SHORT.map(d => <div key={d} className="day-label">{d}</div>)}
                                {calendarDays.map((day, idx) => {
                                    const past = isPastDate(day);
                                    const today = isToday(day);
                                    const hasBookings = bookings.some(b => {
                                        const bd = new Date(b.date);
                                        return bd.getDate() === day.day && bd.getMonth() === day.month && bd.getFullYear() === day.year;
                                    });

                                    return (
                                        <div
                                            key={idx}
                                            className={`day-cell 
                                                ${!day.isCurrentMonth ? "day-cell--other" : ""} 
                                                ${isSameDate(selectedDate, day) ? "day-cell--active" : ""}
                                                ${past ? "day-cell--past" : ""}
                                                ${today ? "day-cell--today" : ""}
                                            `}
                                            onClick={() => {
                                                if (day.isCurrentMonth) {
                                                    setSelectedDate(new Date(day.year, day.month, day.day));
                                                }
                                            }}
                                        >
                                            {day.day}
                                            {hasBookings && <div className="day-cell__dot"></div>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </aside>

                    <main className="schedule-main">
                        <section className="slots-container">
                            <div className="slots-header">
                                <h2 className="slots-header__date">
                                    {selectedDate.toLocaleDateString("en-IN", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </h2>
                            </div>
                            {loading ? <LoadingSpinner /> : renderSlots()}
                        </section>
                    </main>
                </div>
            </div>
        </Layout>
    );
}

export default Schedule;
