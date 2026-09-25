"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { hydrateAuth } from "@/slices/authSlice";

export default function AuthHydrator() {
    const dispatch = useDispatch();

    useEffect(() => {
        try {
            const token = localStorage.getItem("token");
            const user = JSON.parse(localStorage.getItem("user"));
            dispatch(hydrateAuth({ token, user }));
        } catch {
            dispatch(hydrateAuth({ token: null, user: null }));
        }
    }, [dispatch]);

    return null;
}
