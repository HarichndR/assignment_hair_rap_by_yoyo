import React, { useState } from "react";
import Layout from "../../components/Layout.jsx";
import api, * as apiMethods from "../../services/api.js";
import "./ApiTester.css";

// Helper for generating dummy 24-character hex strings for mongo IDs
const DUMMY_ID = "000000000000000000000000";

const LIVE_ID_REFERENCE = {
    users: [
        { id: "69a1ceb3de0643e35e344af0", name: "Alice Smith" },
        { id: "69a1ceb3de0643e35e344af1", name: "Bob Jones" },
        { id: "69a1ceb3de0643e35e344af2", name: "Charlie Brown" }
    ],
    staff: [
        { id: "69a1623d7088884e1f6a3236", name: "Arjun Mehta (Treatment)" },
        { id: "69a1623d7088884e1f6a3235", name: "Priya Sharma (Stylist)" },
        { id: "69a1623d7088884e1f6a3234", name: "Ravi Kumar (Barber)" }
    ],
    services: [
        { id: "69a1623d7088884e1f6a3232", name: "Beard Trim" },
        { id: "69a1623d7088884e1f6a322e", name: "Global Hair Color" },
        { id: "69a1623d7088884e1f6a3231", name: "Head Massage" }
    ]
};

const API_ENDPOINTS = [
    {
        category: "Services",
        endpoints: [
            { name: "List Services", method: "GET", path: "/services", fn: apiMethods.getServices, query: { page: 1, limit: 10 } },
            { name: "Create Service", method: "POST", path: "/admin/services", fn: apiMethods.createService, body: { name: "Test Service", duration: 30, price: 50, category: "Hair" } },
            { name: "Update Service", method: "PUT", path: "/admin/services/:id", fn: apiMethods.updateService, params: { id: DUMMY_ID }, body: { price: 60 } },
            { name: "Delete Service", method: "DELETE", path: "/admin/services/:id", fn: apiMethods.deleteService, params: { id: DUMMY_ID } },
            { name: "Get Availability", method: "GET", path: "/services/:id/availability", fn: apiMethods.getServiceAvailability, params: { id: DUMMY_ID }, query: { date: new Date().toISOString().split('T')[0], staffId: "" } },
        ]
    },
    {
        category: "Staff",
        endpoints: [
            { name: "List Staff", method: "GET", path: "/admin/staff", fn: apiMethods.getStaff, query: { page: 1 } },
            { name: "Create Staff", method: "POST", path: "/admin/staff", fn: apiMethods.createStaff, body: { name: "John Doe", email: "john@example.com", role: "employee" } },
            { name: "Update Staff", method: "PUT", path: "/admin/staff/:id", fn: apiMethods.updateStaff, params: { id: DUMMY_ID }, body: { name: "John Smith" } },
            { name: "Delete Staff", method: "DELETE", path: "/admin/staff/:id", fn: apiMethods.deleteStaff, params: { id: DUMMY_ID } },
        ]
    },
    {
        category: "Users",
        endpoints: [
            { name: "Create User", method: "POST", path: "/users", fn: apiMethods.createUser, body: { name: "Jane Doe", email: "jane@example.com", phone: "+1234567890", password: "password123" } },
            { name: "Get Profile", method: "GET", path: "/users/:id", fn: apiMethods.getUserProfile, params: { id: DUMMY_ID } },
            { name: "Update Profile", method: "PATCH", path: "/users/:id", fn: apiMethods.updateUserProfile, params: { id: DUMMY_ID }, body: { name: "Jane updated" } }
        ]
    },
    {
        category: "Bookings",
        endpoints: [
            { name: "Get Admin Bookings", method: "GET", path: "/admin/bookings", fn: apiMethods.getAdminBookings, query: { page: 1 } },
            { name: "Update Booking Status", method: "PATCH", path: "/admin/bookings/:id/status", fn: apiMethods.updateBookingStatus, params: { id: DUMMY_ID }, body: { status: "confirmed" } },
            { name: "Create Slot", method: "POST", path: "/admin/bookings/slots", fn: apiMethods.createSlot, body: { staffId: DUMMY_ID, date: new Date().toISOString().split('T')[0], startTime: "10:00", endTime: "11:00" } },
            { name: "Create Booking (User)", method: "POST", path: "/bookings", fn: apiMethods.createBooking, body: { userId: DUMMY_ID, serviceId: DUMMY_ID, staffId: DUMMY_ID, date: new Date().toISOString().split('T')[0], startTime: "10:00" } },
            { name: "Get My Bookings (User)", method: "GET", path: "/bookings", fn: apiMethods.getMyBookings, query: { userId: DUMMY_ID } },
            { name: "Cancel Booking (User)", method: "PATCH", path: "/bookings/:id/cancel", fn: apiMethods.cancelBooking, params: { id: DUMMY_ID }, body: { userId: DUMMY_ID, cancellationReason: "Changed mind" } }
        ]
    },
    {
        category: "Settings & AI",
        endpoints: [
            { name: "Get Settings", method: "GET", path: "/admin/settings", fn: apiMethods.getSettings, query: {} },
            { name: "Update Settings", method: "PATCH", path: "/admin/settings", fn: apiMethods.updateSettings, body: { businessName: "BookEase Updated" } },
            { name: "AI Chat", method: "POST", path: "/admin/ai/chat", fn: apiMethods.aiChat, body: { query: "How many bookings today?" } },
            { name: "Global Search", method: "GET", path: "/admin/search", fn: apiMethods.adminSearch, query: { q: "John" } }
        ]
    }
];

function ApiTester() {
    const [selectedApi, setSelectedApi] = useState(API_ENDPOINTS[0].endpoints[0]);
    const [liveData, setLiveData] = useState({ services: [], staff: [], users: [] });

    // Form States
    const [params, setParams] = useState({});
    const [query, setQuery] = useState({});
    const [body, setBody] = useState("");

    // Response States
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [timeMs, setTimeMs] = useState(0);

    // Fetch Live IDs for better testing experience
    React.useEffect(() => {
        const fetchIds = async () => {
            try {
                const [s, st, u] = await Promise.all([
                    apiMethods.getServices({ limit: 5 }),
                    apiMethods.getStaff({ limit: 5 }),
                    apiMethods.getAdminBookings({ limit: 1 }) // Using admin bookings for user IDs if needed or just listing users
                ]);

                // Also fetch users directly if available
                const usersRes = await api.get("/admin/users?limit=5");

                setLiveData({
                    services: s.data?.data || [],
                    staff: st.data?.data || [],
                    users: usersRes.data?.data?.users || []
                });
            } catch (err) {
                console.warn("Failed to fetch live IDs for API Tester", err);
            }
        };
        fetchIds();
    }, []);

    // Initialize forms when selecting API
    const handleSelectApi = (apiDef) => {
        setSelectedApi(apiDef);

        // Find category for more accurate ID type selection
        const categoryDef = API_ENDPOINTS.find(c => c.endpoints.some(e => e.name === apiDef.name));
        const category = categoryDef?.category;

        // Inject live IDs if available instead of DUMMY_ID
        const initialParams = { ...apiDef.params };
        if (initialParams.id === DUMMY_ID) {
            if (category === "Services" && liveData.services.length > 0) initialParams.id = liveData.services[0]._id;
            else if (category === "Staff" && liveData.staff.length > 0) initialParams.id = liveData.staff[0]._id;
            else if (category === "Users" && liveData.users.length > 0) initialParams.id = liveData.users[0]._id;
            else if (category === "Bookings" && liveData.users.length > 0) initialParams.id = liveData.users[0]._id;
        }

        setParams(initialParams || {});
        setQuery(apiDef.query || {});

        // Inject live IDs into body if it's a creation/update
        let initialBody = apiDef.body ? JSON.stringify(apiDef.body, null, 2) : "";
        if (initialBody.includes(DUMMY_ID)) {
            const firstServiceId = liveData.services[0]?._id || DUMMY_ID;
            const firstStaffId = liveData.staff[0]?._id || DUMMY_ID;
            const firstUserId = liveData.users[0]?._id || DUMMY_ID;

            initialBody = initialBody
                .replace(new RegExp(`"serviceId":\\s*"${DUMMY_ID}"`, 'g'), `"serviceId": "${firstServiceId}"`)
                .replace(new RegExp(`"staffId":\\s*"${DUMMY_ID}"`, 'g'), `"staffId": "${firstStaffId}"`)
                .replace(new RegExp(`"userId":\\s*"${DUMMY_ID}"`, 'g'), `"userId": "${firstUserId}"`)
                .replace(new RegExp(`"service":\\s*"${DUMMY_ID}"`, 'g'), `"service": "${firstServiceId}"`)
                .replace(new RegExp(`"staff":\\s*"${DUMMY_ID}"`, 'g'), `"staff": "${firstStaffId}"`);
        }

        setBody(initialBody);
        setResponse(null);
        setTimeMs(0);
    };

    const handleParamChange = (key, val) => setParams(p => ({ ...p, [key]: val }));
    const handleQueryChange = (key, val) => setQuery(q => ({ ...q, [key]: val }));

    const handleSend = async () => {
        setLoading(true);
        setResponse(null);
        const startTime = Date.now();

        try {
            let parsedBody = undefined;
            if (body && selectedApi.method !== "GET" && selectedApi.method !== "DELETE") {
                try {
                    parsedBody = JSON.parse(body);
                } catch (e) {
                    setResponse({ error: true, status: "Parse Error", data: "Invalid JSON in body." });
                    setLoading(false);
                    return;
                }
            }

            let result;
            // Map the function inputs properly based on the signature
            const needsId = ["Update Service", "Update Staff", "Update Profile", "Update Booking Status", "Cancel Booking", "Delete Service", "Delete Staff", "Get Profile", "Get Availability"];

            if (needsId.includes(selectedApi.name)) {
                if (selectedApi.name === "Get Availability") {
                    result = await selectedApi.fn(params.id, query.date);
                } else if (selectedApi.method === "DELETE" || selectedApi.name === "Get Profile") {
                    result = await selectedApi.fn(params.id);
                } else {
                    result = await selectedApi.fn(params.id, parsedBody);
                }
            } else if (selectedApi.name === "AI Chat") {
                result = await selectedApi.fn(parsedBody?.query || "");
            } else if (selectedApi.name === "Global Search") {
                result = await selectedApi.fn(query.q);
            } else if (selectedApi.method === "GET") {
                result = await selectedApi.fn(query);
            } else {
                result = await selectedApi.fn(parsedBody);
            }

            setTimeMs(Date.now() - startTime);
            setResponse({
                status: result.status,
                statusText: result.statusText,
                data: result.data,
                error: false
            });
        } catch (err) {
            setTimeMs(Date.now() - startTime);
            setResponse({
                status: err.response?.status || "Error",
                statusText: err.response?.statusText || err.message,
                data: err.response?.data || { message: err.message },
                error: true
            });
        } finally {
            setLoading(false);
        }
    };

    const getMethodColor = (method) => {
        switch (method) {
            case "GET": return "#10b981"; // green
            case "POST": return "#3b82f6"; // blue
            case "PUT":
            case "PATCH": return "#f59e0b"; // orange
            case "DELETE": return "#ef4444"; // red
            default: return "#6b7280";
        }
    };

    return (
        <Layout>
            <div className="api-tester">
                <div className="api-tester__sidebar">
                    <h2 className="api-tester__title">API Tester</h2>
                    <div className="api-tester__note">Real database IDs are pre-filled below. Use them for testing.</div>

                    <div className="api-tester__reference">
                        <h4>Live ID Reference</h4>
                        <div className="reference-group">
                            <p><strong>Users (Auth/Profile)</strong></p>
                            {LIVE_ID_REFERENCE.users.map(u => <div key={u.id} className="ref-item"><code>{u.id}</code><span>{u.name}</span></div>)}
                        </div>
                        <div className="reference-group">
                            <p><strong>Staff (Roster/Slots)</strong></p>
                            {LIVE_ID_REFERENCE.staff.map(s => <div key={s.id} className="ref-item"><code>{s.id}</code><span>{s.name}</span></div>)}
                        </div>
                        <div className="reference-group">
                            <p><strong>Services (Availability)</strong></p>
                            {LIVE_ID_REFERENCE.services.map(sv => <div key={sv.id} className="ref-item"><code>{sv.id}</code><span>{sv.name}</span></div>)}
                        </div>
                    </div>

                    <div className="api-tester__nav">
                        {API_ENDPOINTS.map((category) => (
                            <div key={category.category} className="api-tester__category">
                                <h3>{category.category}</h3>
                                {category.endpoints.map(api => (
                                    <button
                                        key={api.name}
                                        className={`api-tester__nav-btn ${selectedApi.name === api.name ? 'active' : ''}`}
                                        onClick={() => handleSelectApi(api)}
                                    >
                                        <span className="api-tester__method-badge" style={{ color: getMethodColor(api.method) }}>
                                            {api.method}
                                        </span>
                                        {api.name}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="api-tester__main">
                    <div className="api-tester__header">
                        <span className="api-tester__method-large" style={{ backgroundColor: getMethodColor(selectedApi.method) }}>
                            {selectedApi.method}
                        </span>
                        <input type="text" className="api-tester__url-input" readOnly value={`/api/v1${selectedApi.path}`} />
                        <button className="btn btn--primary api-tester__send-btn" onClick={handleSend} disabled={loading}>
                            {loading ? "Sending..." : "Send Request"}
                        </button>
                    </div>

                    <div className="api-tester__panels">
                        <div className="api-tester__request">
                            {/* Path Params */}
                            {Object.keys(params).length > 0 && (
                                <div className="api-tester__section">
                                    <h4>Path Variables</h4>
                                    {Object.keys(params).map(key => (
                                        <div className="api-tester__input-group" key={key}>
                                            <label>{key}</label>
                                            <input
                                                type="text"
                                                value={params[key]}
                                                onChange={(e) => handleParamChange(key, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Query Params */}
                            {Object.keys(query).length > 0 && (
                                <div className="api-tester__section">
                                    <h4>Query Parameters</h4>
                                    {Object.keys(query).map(key => (
                                        <div className="api-tester__input-group" key={key}>
                                            <label>{key}</label>
                                            <input
                                                type="text"
                                                value={query[key] || ""}
                                                onChange={(e) => handleQueryChange(key, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Request Body */}
                            {(selectedApi.method === "POST" || selectedApi.method === "PUT" || selectedApi.method === "PATCH") && (
                                <div className="api-tester__section api-tester__section--body">
                                    <h4>Request Body (JSON)</h4>
                                    <textarea
                                        className="api-tester__json-editor"
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        spellCheck="false"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="api-tester__response">
                            <div className="api-tester__response-header">
                                <h4>Response</h4>
                                {response && (
                                    <div className="api-tester__response-meta">
                                        <span className={`api-tester__status ${response.error ? 'error' : 'success'}`}>
                                            Status: {response.status} {response.statusText}
                                        </span>
                                        <span className="api-tester__time">Time: {timeMs} ms</span>
                                    </div>
                                )}
                            </div>

                            <div className={`api-tester__response-body ${!response ? 'empty' : ''}`}>
                                {!response && !loading && (
                                    <div className="api-tester__placeholder">
                                        Hit "Send Request" to get a response
                                    </div>
                                )}
                                {loading && (
                                    <div className="api-tester__placeholder">Waiting for response...</div>
                                )}
                                {response && (
                                    <pre className="api-tester__json-view">
                                        {JSON.stringify(response.data, null, 2)}
                                    </pre>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default ApiTester;
