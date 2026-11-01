import axios from "axios";


const api = axios.create({

    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});


api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
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
});


export default api;