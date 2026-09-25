import api from "./api";

export const checkAffordability = async (data) => {
    const response = await api.post("/coach/affordability", data);
    return response.data;
};
