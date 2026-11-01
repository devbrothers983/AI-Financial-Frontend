import api from "./api";

export const getMyMessages = async () => {
    const response = await api.get("/messages");
    return response.data;
};

export const getMyUnreadCount = async () => {
    const response = await api.get("/messages/unread-count");
    return response.data;
};

export const getMyMessageById = async (id) => {
    const response = await api.get(`/messages/${id}`);
    return response.data;
};

export const replyToMyMessage = async (id, message) => {
    const response = await api.post(`/messages/${id}/reply`, { message });
    return response.data;
};

// Sidebar badges listen for this to refresh their counts right away
export const MESSAGES_UPDATED_EVENT = "messages:updated";

export const notifyMessagesUpdated = () => {
    if (typeof window !== "undefined") window.dispatchEvent(new Event(MESSAGES_UPDATED_EVENT));
};
