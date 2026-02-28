import React, { useEffect } from "react";
import "./Notification.css";

function Notification({ message, type = "success", onClose, duration = 3000 }) {
    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [message, duration, onClose]);

    if (!message) return null;

    return (
        <div className={`notification notification--${type}`}>
            <div className="notification__content">
                {type === "success" ? "✅" : "⚠️"} {message}
            </div>
            <button className="notification__close" onClick={onClose}>✕</button>
        </div>
    );
}

export default Notification;
