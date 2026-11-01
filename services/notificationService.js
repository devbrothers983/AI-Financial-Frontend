import api from "./api";

export const getNotifications = async (params) => {
    const response = await api.get("/notifications", { params });
    return response.data;
};

export const getUnreadNotificationCount = async () => {
    const response = await api.get("/notifications/unread-count");
    return response.data;
};

export const markNotificationRead = async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
};

export const markAllNotificationsRead = async () => {
    const response = await api.put("/notifications/read-all");
    return response.data;
};

export const deleteNotification = async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
};

// Lets the bell refresh right away after something creates or reads notifications
export const NOTIFICATIONS_UPDATED_EVENT = "notifications:updated";

export const notifyNotificationsUpdated = () => {
    if (typeof window !== "undefined") window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
};
