import React, { createContext, useState, useEffect, useCallback } from "react";
import isEqual from "lodash.isequal";

export const UIOptionsContext = createContext();

const initialUIOptions = {
    theme: "poker",
    areCardsWrapping: false,
};

export const UIOptionsContextProvider = ({ initialCookies, children }) => {
    const [uiOptions, setUIOptions] = useState({
        ...initialUIOptions,
        theme: initialCookies?.theme || initialUIOptions.theme,
    });

    useEffect((e) => {
        // Grab+apply non-SSR-applicable UI options
        const existingUIOptionsStr = window.localStorage.getItem("uiOptions");
        const existingUIOptions = (existingUIOptionsStr && JSON.parse(existingUIOptionsStr)) || {};
        const existingUIOptionsFiltered = Object.keys(existingUIOptions)
            .filter((k) => Object.hasOwn(initialUIOptions, k))
            .reduce((m, k) => {
                m[k] = existingUIOptions[k];
                return m;
            }, {});

        setUIOptions((initOpts) => {
            const nextOptions = { ...initOpts, ...existingUIOptionsFiltered };
            if (isEqual(initOpts, nextOptions)) {
                return initOpts;
            }
            return nextOptions;
        });
    }, []);

    const updateUIOptions = useCallback((nextOptions) => {
        setUIOptions((currOptions) => {
            const nextOptionsState = { ...currOptions, ...nextOptions };
            const { theme, ...nextOptionsLocalStorage } = nextOptionsState;
            window.localStorage.setItem("uiOptions", JSON.stringify(nextOptionsLocalStorage));
            return nextOptionsState;
        });
        // Store theme as cookie as we can access it server-side
        // and use it for SSR render also.
        if (nextOptions.theme) {
            const d = new Date();
            const expTime = 30 * 24 * 60 * 60 * 1000; // 30 days;
            d.setTime(d.getTime() + expTime);
            document.cookie = `theme=${nextOptions.theme}; expires=${d.toUTCString()}; path=/`;
        }
    }, []);

    return (
        <UIOptionsContext.Provider value={{ uiOptions, updateUIOptions }}>
            {children}
        </UIOptionsContext.Provider>
    );
};
