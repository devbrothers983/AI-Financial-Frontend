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

// ---- Money Autopilot ----

export const getAutopilot = async () => {
    const response = await api.get("/coach/autopilot");
    return response.data;
};

export const updateAutopilotSettings = async (data) => {
    const response = await api.put("/coach/autopilot/settings", data);
    return response.data;
};

export const refreshWeeklyPlan = async () => {
    const response = await api.post("/coach/autopilot/plan");
    return response.data;
};

export const approveSuggestion = async (id) => {
    const response = await api.post(`/coach/suggestions/${id}/apply`);
    return response.data;
};

export const dismissSuggestion = async (id) => {
    const response = await api.post(`/coach/suggestions/${id}/dismiss`);
    return response.data;
};

// Fired after a suggestion is approved or dismissed, so every list showing it updates
export const AUTOPILOT_UPDATED_EVENT = "autopilot-updated";
export const announceAutopilotChange = () => {
    if (typeof window !== "undefined") window.dispatchEvent(new Event(AUTOPILOT_UPDATED_EVENT));
};
