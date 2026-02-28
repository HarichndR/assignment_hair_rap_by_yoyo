import React, { createContext, useContext, useState, useEffect } from "react";
import { getMe, adminLogin as apiAdminLogin, logout as apiLogout } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMe()
            .then((res) => setUser(res.data.data))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    const login = async (email, password) => {
        const res = await apiAdminLogin({ email, password });
        const { user: u, accessToken } = res.data.data;
        if (accessToken) localStorage.setItem("accessToken", accessToken);
        setUser(u);
    };

    const logout = async () => {
        await apiLogout().catch(() => { });
        localStorage.removeItem("accessToken");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
