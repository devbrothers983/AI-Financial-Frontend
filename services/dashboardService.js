import api from "./api";

export const getDashboardOverview = async () => {
    const response = await api.get("/dashboard/overview");
    return response.data;
};

export const getMonthlyTrends = async () => {
    const response = await api.get("/dashboard/monthly-trends");
    return response.data;
};

export const getSavingsRate = async () => {
    const response = await api.get("/dashboard/savings-rate");
    return response.data;
};
