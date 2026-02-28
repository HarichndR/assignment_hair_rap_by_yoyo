import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <LoadingSpinner fullPage />;
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

export default ProtectedRoute;
