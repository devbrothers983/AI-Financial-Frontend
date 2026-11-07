import api from "./api";

export const getCategories = async () => {
    const response = await api.get("/categories");
    return response.data;
};

export const createCategory = async (data) => {
    const response = await api.post("/categories", data);
    return response.data;
};

export const renameCategory = async (id, name) => {
    const response = await api.put(`/categories/${id}`, { name });
    return response.data;
};

export const deleteCategory = async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
};

export const sortUncategorized = async () => {
    const response = await api.post("/categories/sort-uncategorized");
    return response.data;
};

export const saveCategoryRule = async (data) => {
    const response = await api.post("/categories/rules", data);
    return response.data;
};

export const deleteCategoryRule = async (id) => {
    const response = await api.delete(`/categories/rules/${id}`);
    return response.data;
};
