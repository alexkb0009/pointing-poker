import React, { useEffect, useState, useCallback } from "react";
import { UIOptionsContext } from "./components/UIOptionsContext";

// Ensure GA is used for static/non-interactive SSRs as well.
const gaSnippet = `
window.dataLayer = window.dataLayer || [];
window.gtag = function () {
    window.dataLayer.push(arguments);
};
window.gtag("js", new Date());
window.gtag("config", "G-YJVYC858NK");
`;

function getWindowCookies() {
    if (typeof window === "undefined") return null;
    return document.cookie.split("; ").reduce(function (m, cookie) {
        const [key, value] = cookie.split("=");
        m[key] = value;
        return m;
    }, {});
}

// These should match on server and UI (except for HTTPOnly cookies)
// so we grab them here outside of useEffect/componentDidMount.
// Eventually can check if can grab them from Express here.. but for now passing e.g. theme
// in as a prop.. to possibly change later... we might want to have windowCookies be up-to-date also..
const initialWindowCookies = getWindowCookies();

const initialUIOptions = {
    theme: initialWindowCookies?.theme || "poker",
    areCardsWrapping: false,
};

export function Page({ children, url: propUrl, theme = null, cssBundles = [] }) {
    const [url, setUrl] = useState(propUrl || new URL(window.location.href));
    const [uiOptions, setUIOptions] = useState({
        ...initialUIOptions,
        theme: theme || initialUIOptions.theme,
    });

    useEffect((e) => {
        // Listen to our own in-app navigations (pushStates) and update url state.
        const updatePageUrl = (e) => {
            setUrl(new URL(window.location.href));
        };
        window.addEventListener("popstate", updatePageUrl);
        window.addEventListener("pushstate", updatePageUrl);
    }, []);

    const updateUIOptions = useCallback((nextOptions) => {
        setUIOptions((currOptions) => {
            return { ...currOptions, ...nextOptions };
        });
        // Store as cookie as we can access it server-side
        // And use it for initial SSR render.
        if (nextOptions.theme) {
            const d = new Date();
            const expTime = 30 * 24 * 60 * 60 * 1000; // 30 days;
            d.setTime(d.getTime() + expTime);
            document.cookie = `theme=${nextOptions.theme}; expires=${d.toUTCString()}; path=/`;
        }
    }, []);

    const alteredChildren = React.Children.map(children, (child) => {
        if (React.isValidElement(child) && typeof child.type !== "string") {
            return React.cloneElement(child, { url });
        }
    });

    return (
        <html>
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Pointing Poker Page</title>
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.3.0/css/all.min.css"
                />
                {cssBundles.map((fn, i) => (
                    <React.Fragment key={i}>
                        <link rel="prefetch" href={fn} />
                        <link rel="stylesheet" href={fn} />
                    </React.Fragment>
                ))}
            </head>
            <body style={{ visibility: "hidden" }} data-theme={uiOptions.theme}>
                <div id="root">
                    <UIOptionsContext.Provider value={{ uiOptions, updateUIOptions }}>
                        {alteredChildren}
                    </UIOptionsContext.Provider>
                </div>
                <script
                    data-own
                    type="text/javascript"
                    defer
                    src="https://www.googletagmanager.com/gtag/js?id=G-YJVYC858NK"
                />
                <script data-own dangerouslySetInnerHTML={{ __html: gaSnippet }}></script>
            </body>
        </html>
    );
}
