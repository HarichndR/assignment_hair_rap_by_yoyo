import React, { useState, useEffect, useRef } from "react";
import { adminSearch } from "../services/api.js";
import { useNavigate } from "react-router-dom";
import "./Search.css";

function Search() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (query.length < 2) {
            setResults(null);
            setShowResults(false);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await adminSearch(query);
                setResults(res.data.data);
                setShowResults(true);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (type, item) => {
        setShowResults(false);
        setQuery("");
        if (type === "staff") navigate("/staff");
        if (type === "service") navigate("/services");
        if (type === "booking") navigate("/bookings");
    };

    return (
        <div className="search-container" ref={searchRef}>
            <div className="search-bar">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search staff, services, bookings..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setShowResults(true)}
                />
                {loading && <div className="search-spinner"></div>}
            </div>

            {showResults && results && (
                <div className="search-dropdown">
                    {}
                    {results.staff.length > 0 && (
                        <div className="search-result-grp">
                            <h4 className="search-result-grp__title">Staff</h4>
                            {results.staff.map(s => (
                                <div key={s._id} className="search-item" onClick={() => handleSelect("staff", s)}>
                                    <div className="search-item__name">{s.name}</div>
                                    <div className="search-item__sub">{s.specialization}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {}
                    {results.services.length > 0 && (
                        <div className="search-result-grp">
                            <h4 className="search-result-grp__title">Services</h4>
                            {results.services.map(s => (
                                <div key={s._id} className="search-item" onClick={() => handleSelect("service", s)}>
                                    <div className="search-item__name">{s.name}</div>
                                    <div className="search-item__sub">{s.category} — ₹{s.price}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {}
                    {results.bookings.length > 0 && (
                        <div className="search-result-grp">
                            <h4 className="search-result-grp__title">Bookings</h4>
                            {results.bookings.map(b => (
                                <div key={b._id} className="search-item" onClick={() => handleSelect("booking", b)}>
                                    <div className="search-item__name">#{b._id.slice(-6)}</div>
                                    <div className="search-item__sub">{b.userId?.name} — {b.status}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {(!results.staff.length && !results.services.length && !results.bookings.length && !results.users.length) && (
                        <div className="search-no-results">No matches found for "{query}"</div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Search;
