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

hydrateRoot(
    document,
    <Page>
        <App appVersion={APP_VERSION} commitHash={COMMIT_HASH} />
    </Page>
);
