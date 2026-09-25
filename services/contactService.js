import api from "./api";

export const sendContactMessage = async (data) => {
    const response = await api.post("/contact", data);
    return response.data;
};
