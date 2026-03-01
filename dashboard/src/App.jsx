import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoadingSpinner from "./components/LoadingSpinner.jsx";


const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard.jsx"));
const Services = lazy(() => import("./pages/Services/Services.jsx"));
const Staff = lazy(() => import("./pages/Staff/Staff.jsx"));
const Bookings = lazy(() => import("./pages/Bookings/Bookings.jsx"));
const Schedule = lazy(() => import("./pages/Schedule/Schedule.jsx"));
const Settings = lazy(() => import("./pages/Settings/Settings.jsx"));


function App() {
    return (
        <BrowserRouter>
            <Suspense fallback={<LoadingSpinner fullPage />}>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/staff" element={<Staff />} />
                    <Route path="/bookings" element={<Bookings />} />
                    <Route path="/schedule" element={<Schedule />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

export default App;
