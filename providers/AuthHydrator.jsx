"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { hydrateAuth } from "@/slices/authSlice";
import { getViewAs } from "@/lib/viewAs";

export default function AuthHydrator() {
    const dispatch = useDispatch();

    useEffect(() => {
        try {
            // an admin's read-only "view as user" tab shows that user instead
            const viewAs = getViewAs();
            if (viewAs) {
                dispatch(hydrateAuth({ token: viewAs.token, user: viewAs.user }));
                return;
            }

            const token = localStorage.getItem("token");
            const user = JSON.parse(localStorage.getItem("user"));
            dispatch(hydrateAuth({ token, user }));
        } catch {
            dispatch(hydrateAuth({ token: null, user: null }));
        }
    }, [dispatch]);

    return null;
}
