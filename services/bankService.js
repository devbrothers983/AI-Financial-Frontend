import api from "./api";

export const getBankConnections = async () => {
    const response = await api.get("/bank/connections");
    return response.data;
};

// pass a connectionId to sign in to an already connected bank again
export const createLinkToken = async (connectionId) => {
    const response = await api.post("/bank/link-token", connectionId ? { connectionId } : {});
    return response.data;
};

export const exchangePublicToken = async (publicToken, institution) => {
    const response = await api.post("/bank/exchange", { publicToken, institution });
    return response.data;
};

export const syncBankConnection = async (id) => {
    const response = await api.post(`/bank/connections/${id}/sync`);
    return response.data;
};

export const disconnectBank = async (id, deleteTransactions) => {
    const response = await api.delete(`/bank/connections/${id}`, { data: { deleteTransactions } });
    return response.data;
};
