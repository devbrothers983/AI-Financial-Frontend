import api from "./api";

export const getSubscriptions = async () => {
    const response = await api.get("/subscriptions");
    return response.data;
};

export const createSubscription = async (data) => {
    const response = await api.post("/subscriptions", data);
    return response.data;
};

export const checkSubscriptionLink = async (manageUrl) => {
    const response = await api.post("/subscriptions/check-link", { manageUrl });
    return response.data;
};

export const updateSubscription = async (id, data) => {
    const response = await api.put(`/subscriptions/${id}`, data);
    return response.data;
};

export const cancelSubscription = async (id) => {
    const response = await api.post(`/subscriptions/${id}/cancel`);
    return response.data;
};

export const reactivateSubscription = async (id) => {
    const response = await api.post(`/subscriptions/${id}/reactivate`);
    return response.data;
};

export const deleteSubscription = async (id) => {
    const response = await api.delete(`/subscriptions/${id}`);
    return response.data;
};

export const dismissSubscription = async (merchantKey) => {
    const response = await api.post("/subscriptions/dismiss", { merchantKey });
    return response.data;
};

export const restoreSubscription = async (merchantKey) => {
    const response = await api.post("/subscriptions/restore", { merchantKey });
    return response.data;
};
