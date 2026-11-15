import api from "./api";

export const getSafeToSpend = async () => {
    const response = await api.get("/cashflow/safe-to-spend");
    return response.data;
};

export const getPayPlan = async () => {
    const response = await api.get("/cashflow/plan");
    return response.data;
};

export const updatePayPlan = async (data) => {
    const response = await api.put("/cashflow/plan", data);
    return response.data;
};

export const getBills = async () => {
    const response = await api.get("/cashflow/bills");
    return response.data;
};

export const createBill = async (data) => {
    const response = await api.post("/cashflow/bills", data);
    return response.data;
};

export const updateBill = async (id, data) => {
    const response = await api.put(`/cashflow/bills/${id}`, data);
    return response.data;
};

export const deleteBill = async (id) => {
    const response = await api.delete(`/cashflow/bills/${id}`);
    return response.data;
};

export const markBillPaid = async (id, addExpense) => {
    const response = await api.post(`/cashflow/bills/${id}/paid`, { addExpense });
    return response.data;
};

export const getBillCalendar = async (month, year) => {
    const response = await api.get("/cashflow/calendar", { params: { month, year } });
    return response.data;
};

// Fired after anything that changes the safe-to-spend figure, so every card
// showing it refreshes
export const CASHFLOW_UPDATED_EVENT = "cashflow-updated";
export const announceCashflowChange = () => {
    if (typeof window !== "undefined") window.dispatchEvent(new Event(CASHFLOW_UPDATED_EVENT));
};
