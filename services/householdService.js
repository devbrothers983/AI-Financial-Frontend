import api from "./api";

export const getHousehold = async () => {
    const response = await api.get("/household");
    return response.data;
};

export const createHousehold = async (name) => {
    const response = await api.post("/household", { name });
    return response.data;
};

export const renameHousehold = async (name) => {
    const response = await api.put("/household", { name });
    return response.data;
};

export const deleteHousehold = async () => {
    const response = await api.delete("/household");
    return response.data;
};

export const updateMySharing = async (shareLevel) => {
    const response = await api.put("/household/me/sharing", { shareLevel });
    return response.data;
};

export const leaveHousehold = async () => {
    const response = await api.post("/household/leave");
    return response.data;
};

export const removeHouseholdMember = async (userId) => {
    const response = await api.delete(`/household/members/${userId}`);
    return response.data;
};

export const inviteToHousehold = async (email) => {
    const response = await api.post("/household/invites", { email });
    return response.data;
};

export const cancelHouseholdInvite = async (id) => {
    const response = await api.delete(`/household/invites/${id}`);
    return response.data;
};

export const acceptHouseholdInviteByToken = async (token) => {
    const response = await api.post("/household/invites/accept", { token });
    return response.data;
};

export const acceptHouseholdInvite = async (id) => {
    const response = await api.post(`/household/invites/${id}/accept`);
    return response.data;
};

export const declineHouseholdInvite = async (id) => {
    const response = await api.post(`/household/invites/${id}/decline`);
    return response.data;
};
