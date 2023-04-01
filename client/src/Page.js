import React, { useEffect, useState, useContext } from "react";
import { THEMES } from "./constants";
import { getRoomFromURLObject } from "./utils";
import { UIOptionsContext, UIOptionsContextProvider } from "./components/UIOptionsContext";
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

export function Page({
    children,
    // The following props only available on server-side, be careful when using them to avoid hydration errors
    // See relevant docs
    url: serverSideURL,
    cssBundles = [],
    // Be careful to only access non-HTTPOnly cookies that available on
    // browser here, despite them being available in SSR.
    initialCookies = {},
}) {
    const [url, setUrl] = useState(serverSideURL || new URL(window.location.href));
    const roomFromURL = getRoomFromURLObject(url);

    useEffect((e) => {
        // Listen to our own in-app navigations (pushStates) and update url state.
        const updatePageUrl = (e) => {
            setUrl(new URL(window.location.href));
        };
        window.addEventListener("popstate", updatePageUrl);
        window.addEventListener("pushstate", updatePageUrl);
    }, []);

    return (
        <html lang="en">
            <UIOptionsContextProvider initialCookies={initialCookies}>
                <Head roomFromURL={roomFromURL} cssBundles={cssBundles} />
                <Body url={url} roomFromURL={roomFromURL}>
                    {children}
                </Body>
            </UIOptionsContextProvider>
        </html>
    );
}

const Head = ({ url, roomFromURL, cssBundles }) => {
    const { uiOptions } = useContext(UIOptionsContext);

    let pageTitle = "Pointing Poker Page";
    if (roomFromURL) {
        pageTitle += ` - Room ${roomFromURL}`;
    }

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
    );
};

const Body = ({ children, url, roomFromURL }) => {
    const { uiOptions } = useContext(UIOptionsContext);
    const alteredChildren = React.Children.map(children, (child) => {
        if (React.isValidElement(child) && typeof child.type !== "string") {
            return React.cloneElement(child, { url, roomFromURL });
        }
    });
    return (
        <body data-theme={uiOptions.theme}>
            <div id="root">{alteredChildren}</div>
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
    );
};
