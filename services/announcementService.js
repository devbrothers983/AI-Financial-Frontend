import api from "./api";

// signed-in users
export const getActiveAnnouncements = async () => {
    const response = await api.get("/announcements/active");
    return response.data;
};

export const dismissAnnouncement = async (id) => {
    const response = await api.post(`/announcements/${id}/dismiss`);
    return response.data;
};

// admins
export const getAnnouncements = async () => {
    const response = await api.get("/admin/announcements");
    return response.data;
};

export const createAnnouncement = async (data) => {
    const response = await api.post("/admin/announcements", data);
    return response.data;
};

export const updateAnnouncement = async (id, data) => {
    const response = await api.put(`/admin/announcements/${id}`, data);
    return response.data;
};

export const deleteAnnouncement = async (id) => {
    const response = await api.delete(`/admin/announcements/${id}`);
    return response.data;
};
