import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Sidebar.css";

const navItems = [
    { to: "/", label: "Dashboard" },
    { to: "/services", label: "Services" },
    { to: "/staff", label: "Staff" },
    { to: "/bookings", label: "Bookings" },
    { to: "/schedule", label: "Schedule" },
    { to: "/settings", label: "Settings" },
    { to: "/api-tester", label: "API Tester" },
];

function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <aside className="sidebar">
            <div className="sidebar__brand">
                <span className="sidebar__logo">⚡</span>
                <span className="sidebar__name">BookEase</span>
            </div>

            <nav className="sidebar__nav" aria-label="Admin navigation">
                {navItems.map(({ to, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === "/"}
                        className={({ isActive }) =>
                            `sidebar__link${isActive ? " sidebar__link--active" : ""}`
                        }
                    >
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar__footer">
                <div className="sidebar__user">
                    <div className="sidebar__avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
                    <div className="sidebar__user-info">
                        <p className="sidebar__user-name">{user?.name}</p>
                        <p className="sidebar__user-role">Admin</p>
                    </div>
                </div>
                <button className="sidebar__logout" onClick={handleLogout} aria-label="Logout">
                    ↩
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
