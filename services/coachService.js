import api from "./api";

export const getCoachChat = async () => {
    const response = await api.get("/coach/chat");
    return response.data;
};

export const sendCoachMessage = async (message) => {
    const response = await api.post("/coach/chat", { message });
    return response.data;
};

export const clearCoachChat = async () => {
    const response = await api.delete("/coach/chat");
    return response.data;
};

export const checkAffordability = async (data) => {
    const response = await api.post("/coach/affordability", data);
    return response.data;
};
