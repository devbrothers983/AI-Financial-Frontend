import api from "./api";

export const register = async (data) => {
   const response = await api.post("/auth/register", data);
   return response.data;
}


export const login = async (data) => {
     const response = await api.post("/auth/login", data);
     return response.data;
}


export const googleLogin = async (credential) => {
     const response = await api.post("/auth/google", { credential });
     return response.data;
}


export const forgotPassword = async (email) => {
     const response = await api.post("/auth/forgot-password", { email });
     return response.data;
}


export const resetPassword = async (data) => {
     const response = await api.post("/auth/reset-password", data);
     return response.data;
}






