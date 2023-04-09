/* eslint-disable no-undef */
import React from "react";
import { hydrateRoot } from "react-dom/client";
import { config } from "@fortawesome/fontawesome-svg-core";
import { Page } from "./Page";
import { App } from "./components/App";

import "@fortawesome/fontawesome-svg-core/styles.css";
import "./styles.scss";

// Disable fontawesome's own css injection (causes FOUC of icons)
config.autoAddCss = false;

// Init/hydration
// Some Chrome Plugins will break SSR hydration, so let's prevent that in prod..
document.querySelectorAll("html script:not([data-own])").forEach((elem) => {
    elem.remove();
});

const serverSentData = JSON.parse(
    document.querySelector('html script[data-name="routeData"]').innerHTML || "{}"
);

const initialCookies = (document.cookie || "").split("; ").reduce(function (m, cookie) {
    const [key, value] = cookie.split("=");
    m[key] = value;
    return m;
}, {});

hydrateRoot(
    document,
    <Page initialCookies={initialCookies} serverSentData={serverSentData}>
        <App appVersion={APP_VERSION} commitHash={COMMIT_HASH} />
    </Page>
);
