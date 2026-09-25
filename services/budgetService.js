import api from "./api";

export const getBudgets = async (params) => {
    const response = await api.get("/budgets", { params });
    return response.data;
};

export const getBudgetProgress = async (id) => {
    const response = await api.get(`/budgets/${id}/progress`);
    return response.data;
};

export const createBudget = async (data) => {
    const response = await api.post("/budgets", data);
    return response.data;
};

export const updateBudget = async (id, data) => {
    const response = await api.put(`/budgets/${id}`, data);
    return response.data;
};

export const deleteBudget = async (id) => {
    const response = await api.delete(`/budgets/${id}`);
    return response.data;
};

export const checkExpenseImpact = async (data) => {
    const response = await api.post("/budgets/check-impact", data);
    return response.data;
};
