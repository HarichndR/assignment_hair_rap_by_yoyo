import React from "react";
import "./LoadingSpinner.css";

function LoadingSpinner({ fullPage = false }) {
    if (fullPage) {
        return (
            <div className="spinner-overlay">
                <div className="spinner" role="status" aria-label="Loading" />
            </div>
        );
    }
    return <div className="spinner spinner--sm" role="status" aria-label="Loading" />;
}

export default LoadingSpinner;
