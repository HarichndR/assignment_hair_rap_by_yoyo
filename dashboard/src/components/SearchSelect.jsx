import React, { useState, useRef, useEffect } from "react";
import "./SearchSelect.css";

function SearchSelect({ options, value, onChange, placeholder = "Select...", id }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef(null);

    const filtered = options.filter(o =>
        o.label.toLowerCase().includes(search.toLowerCase())
    );

    const selectedLabel = options.find(o => o.value === value)?.label || "";

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
        setSearch("");
    };

    return (
        <div className="search-select" ref={containerRef} id={id}>
            <div
                className={`search-select__trigger ${isOpen ? "search-select__trigger--open" : ""}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={!selectedLabel ? "search-select__placeholder" : ""}>
                    {selectedLabel || placeholder}
                </span>
                <span className="search-select__arrow">↓</span>
            </div>

            {isOpen && (
                <div className="search-select__dropdown">
                    <input
                        className="search-select__search"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                    <div className="search-select__options">
                        <div
                            className={`search-select__option ${!value ? "search-select__option--selected" : ""}`}
                            onClick={() => handleSelect("")}
                        >
                            {placeholder}
                        </div>
                        {filtered.map((o) => (
                            <div
                                key={o.value}
                                className={`search-select__option ${o.value === value ? "search-select__option--selected" : ""}`}
                                onClick={() => handleSelect(o.value)}
                            >
                                {o.label}
                            </div>
                        ))}
                        {filtered.length === 0 && (
                            <div className="search-select__no-results">No matches found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default SearchSelect;
