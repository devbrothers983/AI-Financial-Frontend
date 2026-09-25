import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    hydrated: false,
};


const authSlice = createSlice({
    name: "auth",
    initialState,

    reducers: {
        hydrateAuth: (state, action) => {
            state.user = action.payload?.user || null;
            state.token = action.payload?.token || null;
            state.isAuthenticated = Boolean(action.payload?.token);
            state.hydrated = true;
        },

        loginSuccess: (state, action) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            state.hydrated = true;

            if (typeof window !== "undefined") {
                localStorage.setItem("token", action.payload.token);
                localStorage.setItem("user", JSON.stringify(action.payload.user));
            }
        },

        updateUser: (state, action) => {
            state.user = { ...state.user, ...action.payload };

            if (typeof window !== "undefined") {
                localStorage.setItem("user", JSON.stringify(state.user));
            }
        },

        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.hydrated = true;

            if (typeof window !== "undefined") {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
            }
        },
    },

});


export const { hydrateAuth, loginSuccess, updateUser, logout } = authSlice.actions;

export default authSlice.reducer;
