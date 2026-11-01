import axios from "axios";
import { getViewAs } from "@/lib/viewAs";


const api = axios.create({

    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});


api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        // a "view as user" tab uses its read-only token instead of the admin's
        const token = getViewAs()?.token || localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});


// Saving data can trigger alerts on the server (budget, goal milestones), so
// ask the notification bell to refresh shortly after any successful change.
api.interceptors.response.use((response) => {
    const method = response.config?.method;
    const url = response.config?.url || "";
    if (typeof window !== "undefined" && method && method !== "get" && !url.startsWith("/notifications")) {
        setTimeout(() => window.dispatchEvent(new Event("notifications:updated")), 1500);
    }
    return response;
}, (error) => {
    // A signed-in request rejected as unauthenticated means the session ended
    // (expired, signed out everywhere, or the account was deleted): clear it
    // and send the user to sign in again.
    if (
        typeof window !== "undefined" &&
        error.response?.status === 401 &&
        error.config?.headers?.Authorization &&
        !(error.config.url || "").startsWith("/auth") &&
        !window.location.pathname.startsWith("/login")
    ) {
        if (getViewAs()) {
            // only the view-as session ended; the admin stays signed in
            sessionStorage.removeItem("viewAs");
            window.location.href = "/dashboard/users";
        } else {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login?session=expired";
        }
    }
    return Promise.reject(error);
});


export default api;
