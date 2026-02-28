import React, { useState, useRef, useEffect } from "react";
import { aiChat, createBooking } from "../services/api.js";
import "./AiPopup.css";

const SUGGESTIONS = [
    "How many bookings today?",
    "Which service is most booked this week?",
    "Show cancelled bookings",
    "Which staff has the highest bookings?",
];

function AiPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: "assistant", text: "Hi! I'm your salon's AI assistant. How can I help you today?" },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const endRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            endRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const send = async (query) => {
        const q = query || input.trim();
        if (!q || loading) return;
        setInput("");
        setMessages((m) => [...m, { role: "user", text: q }]);
        setLoading(true);
        try {
            const res = await aiChat(q);
            const data = res.data?.data;
            if (!data) throw new Error("AI returned an invalid response.");
            const { answer, extracted } = data;
            setMessages((m) => [...m, { role: "assistant", text: answer || "I couldn't generate an answer.", extracted }]);
        } catch (err) {
            setMessages((m) => [...m, { role: "assistant", text: err.response?.data?.message || "Sorry, something went wrong." }]);
        } finally {
            setLoading(false);
        }
    };

    const confirmBookingAction = async (msgIndex, data) => {
        // userId: MONGO_ID, serviceId: MONGO_ID, staffId: MONGO_ID, date: YYYY-MM-DD, startTime: HH:mm
        // Handle 'NEW_CUSTOMER' or missing userId
        if (data.userId === 'NEW_CUSTOMER' || !data.userId) {
            alert("This seems to be a new customer. Please provide their details or pick an existing one.");
            return;
        }

        try {
            setMessages(prev => prev.map((m, i) => i === msgIndex ? { ...m, bookingLoading: true } : m));
            await createBooking({
                userId: data.userId,
                serviceId: data.serviceId,
                staffId: data.staffId,
                date: data.date,
                startTime: data.time
            });
            setMessages(prev => prev.map((m, i) => i === msgIndex ? {
                ...m,
                bookingLoading: false,
                bookingConfirmed: true,
                text: "Great! The booking has been successfully confirmed and added to your schedule."
            } : m));
        } catch (err) {
            alert("Booking failed: " + (err.response?.data?.message || "Check availability or conflicts."));
            setMessages(prev => prev.map((m, i) => i === msgIndex ? { ...m, bookingLoading: false } : m));
        }
    };

    const handleKey = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    return (
        <>
            <button
                className={`ai-fab ${isOpen ? "ai-fab--open" : ""}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle AI Assistant"
            >
                {isOpen ? "✕" : "🤖"}
            </button>

            {isOpen && (
                <div className="ai-popup">
                    <div className="ai-popup__header">
                        <div>
                            <h3 className="ai-popup__title">Assistant</h3>
                            <p className="ai-popup__subtitle">Powered by Gemini</p>
                        </div>
                    </div>

                    <div className="ai-popup__messages">
                        {messages.map((m, i) => (
                            <div key={i} className={`ai-msg ai-msg--${m.role}`}>
                                <div className="ai-msg__bubble">
                                    {m.text}

                                    {m.extracted && !m.bookingConfirmed && (
                                        <div className="ai-msg__booking-card">
                                            <div className="ai-booking-field">
                                                <span>Service:</span>
                                                <strong>{m.extracted.service || "—"}</strong>
                                            </div>
                                            <div className="ai-booking-field">
                                                <span>Staff:</span>
                                                <strong>{m.extracted.staff || "—"}</strong>
                                            </div>
                                            <div className="ai-booking-field">
                                                <span>Customer:</span>
                                                <strong>{m.extracted.customer || "—"}</strong>
                                            </div>
                                            <div className="ai-booking-field">
                                                <span>Time:</span>
                                                <strong>{m.extracted.date} at {m.extracted.time}</strong>
                                            </div>

                                            {m.extracted.serviceId && m.extracted.staffId && m.extracted.date && m.extracted.time && (
                                                <button
                                                    className="ai-confirm-btn"
                                                    onClick={() => confirmBookingAction(i, m.extracted)}
                                                    disabled={m.bookingLoading}
                                                >
                                                    {m.bookingLoading ? "Booking..." : "Confirm Booking"}
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {m.bookingConfirmed && (
                                        <div className="ai-success-msg">
                                            <span>✅ Confirmed</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="ai-msg ai-msg--assistant">
                                <div className="ai-msg__bubble ai-msg__bubble--typing">
                                    <span />
                                    <span />
                                    <span />
                                </div>
                            </div>
                        )}
                        <div ref={endRef} />
                    </div>

                    <div className="ai-popup__footer">
                        <div className="ai-popup__suggestions">
                            {SUGGESTIONS.map((s) => (
                                <button
                                    key={s}
                                    className="ai-suggestion"
                                    onClick={() => send(s)}
                                    disabled={loading}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                        <div className="ai-popup__input-row">
                            <input
                                className="ai-popup__input"
                                placeholder="Ask something…"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKey}
                                disabled={loading}
                            />
                            <button
                                className="ai-popup__send"
                                onClick={() => send()}
                                disabled={loading || !input.trim()}
                            >
                                →
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default AiPopup;
