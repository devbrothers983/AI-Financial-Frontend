import api from "./api";

export const getProfile = async () => {
    const response = await api.get("/users/me");
    return response.data;
};

export const updateProfile = async (data) => {
    const response = await api.put("/users/me", data);
    return response.data;
};

export const changePassword = async (data) => {
    const response = await api.put("/users/me/password", data);
    return response.data;
};

export const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await api.post("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

export const deleteAvatar = async () => {
    const response = await api.delete("/users/me/avatar");
    return response.data;
};
