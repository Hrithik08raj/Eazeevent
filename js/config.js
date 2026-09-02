// Central API Configuration for Eazeevent
// In local development, automatically points to local backend (http://127.0.0.1:8000).
// In production, points to the live deployed Render backend URL.
const API_BASE_URL = (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost")
    ? "http://127.0.0.1:8000"
    : "https://eazeevent-backend.onrender.com";
