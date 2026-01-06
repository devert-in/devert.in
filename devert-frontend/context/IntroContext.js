"use client";

import { createContext, useContext, useState } from "react";

const IntroContext = createContext();

export function IntroProvider({ children }) {
    const [hasShownIntro, setHasShownIntro] = useState(false);

    return (
        <IntroContext.Provider value={{ hasShownIntro, setHasShownIntro }}>
            {children}
        </IntroContext.Provider>
    );
}

export function useIntro() {
    return useContext(IntroContext);
}
