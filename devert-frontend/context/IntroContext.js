"use client";

import { createContext, useContext, useState } from "react";

const IntroContext = createContext();
const LS_KEY = "devert_intro_v1";

export function IntroProvider({ children }) {
    const [hasShownIntro, setHasShownIntroState] = useState(() => {
        if (typeof window === "undefined") return false;
        return localStorage.getItem(LS_KEY) === "1";
    });

    const setHasShownIntro = (val) => {
        if (val && typeof window !== "undefined") localStorage.setItem(LS_KEY, "1");
        setHasShownIntroState(val);
    };

    return (
        <IntroContext.Provider value={{ hasShownIntro, setHasShownIntro }}>
            {children}
        </IntroContext.Provider>
    );
}

export function useIntro() {
    return useContext(IntroContext);
}
