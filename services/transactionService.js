import api from "./api";

export const getTransactions = async (params) => {
    const response = await api.get("/transactions/all", { params });
    return response.data;
};

export const createTransaction = async (data) => {
    const response = await api.post("/transactions/create", data);
    return response.data;
};

export const updateTransaction = async (id, data) => {
    const response = await api.put(`/transactions/update/${id}`, data);
    return response.data;
};

export const deleteTransaction = async (id) => {
    const response = await api.delete(`/transactions/delete/${id}`);
    return response.data;
};

export const getTransactionSummary = async () => {
    const response = await api.get("/transactions/summary");
    return response.data;
};

export const getCategoryBreakdown = async () => {
    const response = await api.get("/transactions/category-breakdown");
    return response.data;
};
