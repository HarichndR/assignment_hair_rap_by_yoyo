import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import "./Login.css";

function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(form.email, form.password);
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-card__header">
                    <span className="login-card__logo">⚡</span>
                    <h1 className="login-card__title">BookEase</h1>
                    <p className="login-card__subtitle">Admin Portal</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit} noValidate>
                    <div className="login-form__group">
                        <label className="login-form__label" htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className="login-form__input"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="admin@bookingapp.com"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="login-form__group">
                        <label className="login-form__label" htmlFor="password">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className="login-form__input"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    {error && <p className="login-form__error" role="alert">{error}</p>}

                    <button
                        type="submit"
                        className="login-form__btn"
                        disabled={loading}
                        id="login-submit-btn"
                    >
                        {loading ? <LoadingSpinner /> : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
