import api from "./api";

export const getAdminOverview = async () => {
    const response = await api.get("/admin/overview");
    return response.data;
};

export const getAdminGrowth = async (params) => {
    const response = await api.get("/admin/growth", { params });
    return response.data;
};

export const getAdminReports = async () => {
    const response = await api.get("/admin/reports");
    return response.data;
};

export const getUserActivity = async () => {
    const response = await api.get("/admin/activity");
    return response.data;
};

export const getActivityLogs = async (params) => {
    const response = await api.get("/admin/logs", { params });
    return response.data;
};

export const getAllUsers = async (params) => {
    const response = await api.get("/admin/users", { params });
    return response.data;
};

export const getUserById = async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
};

export const getUserTransactions = async (id, params) => {
    const response = await api.get(`/admin/users/${id}/transactions`, { params });
    return response.data;
};

export const getUserActivityTimeline = async (id, params) => {
    const response = await api.get(`/admin/users/${id}/activity`, { params });
    return response.data;
};

export const updateUserRole = async (id, role) => {
    const response = await api.put(`/admin/users/${id}/role`, { role });
    return response.data;
};

export const updateUserStatus = async (id, isActive) => {
    const response = await api.put(`/admin/users/${id}/status`, { isActive });
    return response.data;
};

export const bulkUserAction = async (ids, action) => {
    const response = await api.post("/admin/users/bulk", { ids, action });
    return response.data;
};

export const deleteUser = async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
};

export const getAllMessages = async (params) => {
    const response = await api.get("/admin/messages", { params });
    return response.data;
};

export const getUnreadMessageCount = async () => {
    const response = await api.get("/admin/messages/unread-count");
    return response.data;
};

export const updateMessageReadStatus = async (id, isRead) => {
    const response = await api.put(`/admin/messages/${id}/read`, { isRead });
    return response.data;
};

export const replyToMessage = async (id, message) => {
    const response = await api.post(`/admin/messages/${id}/reply`, { message });
    return response.data;
};

export const deleteMessage = async (id) => {
    const response = await api.delete(`/admin/messages/${id}`);
    return response.data;
};
