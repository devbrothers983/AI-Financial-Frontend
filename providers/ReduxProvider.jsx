"use client"

import { Provider } from "react-redux";
import { store } from "../store/store";
import AuthHydrator from "./AuthHydrator";

export default function ReduxProvider({
    children
}) {
    return (
        <Provider store={store}>
            <AuthHydrator />
            {children}
        </Provider>
    );
}