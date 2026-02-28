import React from "react";
import Sidebar from "./Sidebar.jsx";
import Search from "./Search.jsx";
import AiPopup from "./AiPopup.jsx";
import "./Layout.css";

function Layout({ children }) {
    return (
        <div className="layout">
            <Sidebar />
            <main className="layout__main">
                <Search />
                {children}
            </main>
            <AiPopup />
        </div>
    );
}

export default Layout;
