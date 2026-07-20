"use client";

import { createContext, useContext, useState, useEffect } from "react";

const IntroContext = createContext();
const LS_KEY = "devert_intro_v1";

export function IntroProvider({ children }) {
    // Always start false so the very first client paint matches the
    // statically-exported HTML (also always false) - avoids a hydration
    // mismatch. The real localStorage value is read post-mount below.
    const [hasShownIntro, setHasShownIntroState] = useState(false);

    useEffect(() => {
        if (localStorage.getItem(LS_KEY) === "1") setHasShownIntroState(true);
    }, []);

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
