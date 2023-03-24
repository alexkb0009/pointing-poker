import React, { useEffect, useState, useCallback, useMemo } from "react";
import { THEMES } from "./constants";
import { getRoomFromURLObject } from "./utils";
import { UIOptionsContext } from "./components/UIOptionsContext";
import { SEOTag } from "./components/SEOTag";

// Ensure GA is used for static/non-interactive SSRs as well.
const gaSnippet = `
setTimeout(function(){
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
        window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", "G-YJVYC858NK");
}, 0);
`;

const initialUIOptions = {
    theme: "poker",
    areCardsWrapping: false,
};

export function Page({
    children,
    url: propUrl,
    cssBundles = [],
    // Be careful to only access non-HTTPOnly cookies that available on
    // browser here, despite them being available in SSR.
    initialCookies = {},
}) {
    const [url, setUrl] = useState(propUrl || new URL(window.location.href));
    const [uiOptions, setUIOptions] = useState({
        ...initialUIOptions,
        // TODO: Validate that initialCookies.theme is in THEMES (in case certain themes get removed in future)
        theme: initialCookies?.theme || initialUIOptions.theme,
    });

    const { roomFromURL, pageTitle } = useMemo(() => {
        const roomFromURL = getRoomFromURLObject(url);
        let pageTitle = "Pointing Poker Page";
        if (roomFromURL) {
            pageTitle += ` - Room ${roomFromURL}`;
        }
        return {
            roomFromURL,
            pageTitle,
        };
        // url is a lightweight object to memoize on
        // save a couple CPU cycles from regex matching
    }, [url]);

    useEffect((e) => {
        // Listen to our own in-app navigations (pushStates) and update url state.
        const updatePageUrl = (e) => {
            setUrl(new URL(window.location.href));
        };
        window.addEventListener("popstate", updatePageUrl);
        window.addEventListener("pushstate", updatePageUrl);

        // Grab+apply non-SSR-applicable UI options
        const existingUIOptionsStr = window.localStorage.getItem("uiOptions");
        const existingUIOptions = (existingUIOptionsStr && JSON.parse(existingUIOptionsStr)) || {};
        const existingUIOptionsFiltered = Object.keys(existingUIOptions)
            .filter((k) => Object.hasOwn(initialUIOptions, k))
            .reduce((m, k) => {
                m[k] = existingUIOptions[k];
                return m;
            }, {});
        setUIOptions((initOpts) => ({ ...initOpts, ...existingUIOptionsFiltered }));
    }, []);

    const updateUIOptions = useCallback((nextOptions) => {
        setUIOptions((currOptions) => {
            const nextOptionsState = { ...currOptions, ...nextOptions };
            // eslint-disable-next-line no-unused-vars
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

    const alteredChildren = React.Children.map(children, (child) => {
        if (React.isValidElement(child) && typeof child.type !== "string") {
            return React.cloneElement(child, { url, roomFromURL });
        }
    });

    const csp = [
        "script-src 'self'",
        "script-src-elem 'unsafe-inline' 'self' https://unpkg.com https://www.googletagmanager.com",
    ];

    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="theme-color" content={THEMES[uiOptions.theme]?.metaThemeColor} />
                <meta httpEquiv="Content-Security-Policy" content={csp.join(";")}></meta>
                <title>{pageTitle}</title>
                <link rel="icon" type="image/x-icon" href="/assets/favicon.ico" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <SEOTag />
                <link
                    rel="preload"
                    as="style"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.3.0/css/all.min.css"
                />
                {cssBundles.map((fn, i) => (
                    <React.Fragment key={i}>
                        <link rel="prefetch" as="style" href={fn} />
                        <link rel="stylesheet" href={fn} />
                    </React.Fragment>
                ))}
            </head>
            <body data-theme={uiOptions.theme}>
                <div id="root">
                    <UIOptionsContext.Provider value={{ uiOptions, updateUIOptions }}>
                        {alteredChildren}
                    </UIOptionsContext.Provider>
                </div>
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.3.0/css/all.min.css"
                />
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
