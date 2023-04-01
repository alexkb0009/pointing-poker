import React, { useMemo } from "react";
import { TopNav } from "./components/TopNav";
import { roomUrlValidRegex } from "./constants";

const App = React.lazy(() =>
    import(
        /* webpackChunkName: "app" */
        "./components/App"
    ).then((module) => ({ default: module.App }))
);

const TermsOfService = React.lazy(() =>
    import(
        /* webpackChunkName: "terms-of-service" */
        "./components/static-views/terms-of-service"
    ).then((module) => ({ default: module.TOS }))
);

const CookiePolicy = React.lazy(() =>
    import(
        /* webpackChunkName: "cookie-policy" */
        "./components/static-views/cookie-policy"
    ).then((module) => ({ default: module.CookiePolicy }))
);

/** More performant than React-Router because of teh render() */
export const RoutedViewProvider = ({ children, url, roomFromURL }) => {
    const view = useMemo(() => {
        const baseTitle = "Pointing Poker Page";
        const viewsByPath = [
            {
                paths: [/^\/?$/, roomUrlValidRegex],
                render: () => <App url={url} roomFromURL={roomFromURL} />,
                title: baseTitle + (roomFromURL ? ` - Room ${roomFromURL}` : ""),
            },
            {
                paths: [/^\/terms-of-service\/?/],
                render: () => (
                    <>
                        <TopNav />
                        <TermsOfService />
                    </>
                ),
                title: baseTitle + " - Terms of Service",
            },
            {
                paths: [/^\/cookie-policy\/?/],
                render: () => (
                    <>
                        <TopNav />
                        <CookiePolicy />
                    </>
                ),
                title: baseTitle + " - Cookie Policy",
            },
        ];
        let view = viewsByPath.find(
            ({ paths }) => !!paths.find((pathRegex) => pathRegex.test(url.pathname))
        );
        if (!view) {
            view = {
                render: () => (
                    <div className="container">
                        <h3>404 - Page Not Found</h3>
                    </div>
                ),
                title: baseTitle + " - Page Not Found",
            };
        }
        return view;
    }, [url]);

    // Expects components as children, not JSX elements.
    return React.Children.map(children, (child) => React.cloneElement(child, { view }));
};
