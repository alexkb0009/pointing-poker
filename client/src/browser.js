/* eslint-disable no-undef */
import React from "react";
import { hydrateRoot } from "react-dom/client";
import { Page } from "./Page";
import { App } from "./components/App";

import "./styles.scss";

// Init/hydration
// Some Chrome Plugins will break SSR hydration, so let's prevent that in prod..
document
    .querySelectorAll("html script[src^=chrome-extension], html script[src^=moz-extension]")
    .forEach((elem) => {
        document.documentElement.removeChild(elem);
    });

const initialCookies = (document.cookie || "").split("; ").reduce(function (m, cookie) {
    const [key, value] = cookie.split("=");
    m[key] = value;
    return m;
}, {});

hydrateRoot(
    document,
    <Page initialCookies={initialCookies}>
        <App appVersion={APP_VERSION} commitHash={COMMIT_HASH} />
    </Page>
);
