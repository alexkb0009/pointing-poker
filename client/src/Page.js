import React, { useEffect, useState, useContext, useMemo, Suspense } from "react";
import { THEMES } from "./constants";
import { getRoomFromURLObject } from "./utils";
import { RouteDataContext } from "./RouteDataContext";
import { UIOptionsContext, UIOptionsContextProvider } from "./components/UIOptionsContext";
import { SEOTag } from "./components/SEOTag";
import { RoutedViewProvider } from "./RoutedViewProvider";

// Ensure GA is used for static/non-interactive SSRs as well.
// TODO: Move key to env config var or similar, especially once need to add sensitive keys
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

export function Page({
    // This is sent in by server, then scraped and re-injected here by browser.js, then updated upon own (SPA) navigations
    serverSentData,
    // The following props only available on server-side, be careful when using them to avoid hydration errors
    // See relevant docs
    url: serverSideURL,
    cssBundles = [],
    // Be careful to only access non-HTTPOnly cookies that available on
    // browser here, despite them being available in SSR.
    initialCookies = {},
}) {
    const [url, setUrl] = useState(serverSideURL || new URL(window.location.href));
    const [routeData, setRouteData] = useState(serverSentData);
    const [isLoadingRouteData, setIsLoadingRouteData] = useState(false);
    const roomFromURL = getRoomFromURLObject(url);

    useEffect(() => {
        // Listen to our own in-app navigations (pushStates) and update url state.
        // Consider moving into RouterViewProvider
        const updateRouteData = (e) => {
            const headers = new Headers();
            headers.append("Accept", "application/json");
            const request = new Request(window.location.href, {
                method: "GET",
                headers: headers,
                mode: "same-origin",
                cache: "no-store",
            });

            Promise.race([
                window.fetch(request).then((res) => {
                    res.json().then((jsonBody) => {
                        setRouteData(jsonBody);
                        setUrl(new URL(window.location.href));
                        setIsLoadingRouteData(false);
                        return true;
                    });
                }),
                new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve(false);
                    }, 500);
                }),
            ]).then((isRouteDataComplete) => {
                // aka if timeout finishes first:
                if (!isRouteDataComplete) {
                    setIsLoadingRouteData(true);
                }
            });
        };
        window.addEventListener("popstate", updateRouteData);
        window.addEventListener("pushstate", updateRouteData);
        window.document.addEventListener("click", (e) => {
            if (e.defaultPrevented) {
                return false;
            }
            const targetElem = e.target;
            if (e.target.tagName.toUpperCase() === "A") {
                const linkHref = targetElem.getAttribute("href");
                const linkUrl = new URL(linkHref, window.location);
                if (linkUrl.origin === window.location.origin) {
                    e.preventDefault();
                    e.stopPropagation();

                    if (window.location.href === linkUrl.href) {
                        return false;
                    }

                    window.history.pushState(null, document.title, linkUrl.href);
                    window.dispatchEvent(new PopStateEvent("pushstate"));
                }
            }
        });
    }, []);

    return (
        <html lang="en">
            <RouteDataContext.Provider value={routeData}>
                <UIOptionsContextProvider initialCookies={initialCookies}>
                    <RoutedViewProvider url={url} roomFromURL={roomFromURL}>
                        <Head cssBundles={cssBundles} routeData={routeData} />
                        <Body isLoadingRouteData={isLoadingRouteData} />
                    </RoutedViewProvider>
                </UIOptionsContextProvider>
            </RouteDataContext.Provider>
        </html>
    );
}

const Head = ({ view, cssBundles, routeData }) => {
    const { uiOptions } = useContext(UIOptionsContext);

    const csp = [
        "script-src 'self'",
        "script-src-elem 'unsafe-inline' 'self' https://unpkg.com https://www.googletagmanager.com",
    ];

    return (
        <head>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta name="theme-color" content={THEMES[uiOptions.theme]?.metaThemeColor} />
            <meta httpEquiv="Content-Security-Policy" content={csp.join(";")}></meta>
            <title>{view.title}</title>
            <link rel="icon" type="image/x-icon" href="/assets/favicon.ico" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <SEOTag />
            <link
                rel="preload"
                as="style"
                href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.3.0/css/all.min.css"
            />
            <script
                data-own
                data-name="routeData"
                type="application/json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(routeData, null, 4) }}
            />
            {cssBundles.map((fn, i) => (
                <React.Fragment key={i}>
                    <link rel="prefetch" as="style" href={fn} />
                    <link rel="stylesheet" href={fn} />
                </React.Fragment>
            ))}
        </head>
    );
};

const Body = ({ view, isLoadingRouteData }) => {
    const { uiOptions } = useContext(UIOptionsContext);
    // const renderedView = useMemo(view.render, [view]);
    return (
        <body data-theme={uiOptions.theme}>
            <div id="root">
                <Suspense>{view.render()}</Suspense>
            </div>
            {isLoadingRouteData && <div className="connecting-container">Loading</div>}
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
            <script
                type="text/javascript"
                data-own
                dangerouslySetInnerHTML={{ __html: gaSnippet }}
            />
        </body>
    );
};
