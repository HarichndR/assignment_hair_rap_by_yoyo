import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const navItems = [
    { to: "/", label: "Dashboard" },
    { to: "/services", label: "Services" },
    { to: "/staff", label: "Staff" },
    { to: "/bookings", label: "Bookings" },
    { to: "/schedule", label: "Schedule" },
    { to: "/settings", label: "Settings" },
];

function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar__brand">
                <span className="sidebar__logo">⚡</span>
                <span className="sidebar__name">HairRapByYoyo</span>
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
                    <div className="sidebar__avatar">A</div>
                    <div className="sidebar__user-info">
                        <p className="sidebar__user-name">Administrator</p>
                        <p className="sidebar__user-role">Open Access</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;
