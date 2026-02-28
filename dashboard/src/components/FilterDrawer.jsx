import React, { useEffect } from "react";
import "./FilterDrawer.css";

function FilterDrawer({ isOpen, onClose, children, onClear, hasFilters, title = "Filters" }) {

    useEffect(() => {
        if (isOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "unset";
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="filter-drawer-overlay" onClick={onClose}>
            <div className="filter-drawer" onClick={(e) => e.stopPropagation()}>
                <div className="filter-drawer__header">
                    <h2 className="filter-drawer__title">{title}</h2>
                    <button className="filter-drawer__close" onClick={onClose}>✕</button>
                </div>

                <div className="filter-drawer__content">
                    {children}
                </div>

                <div className="filter-drawer__footer">
                    {hasFilters && (
                        <button className="btn btn--secondary btn--sm" onClick={onClear}>
                            Clear All
                        </button>
                    )}
                    <button className="btn btn--primary btn--sm" onClick={onClose}>
                        View Results
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FilterDrawer;
