import React from "react";
import { hydrateRoot } from "react-dom/client";
import { Page } from "./Page";
import { App } from "./components/App";

import "./styles.scss";

// Init/hydration

hydrateRoot(
    document,
    <Page>
        <App
            appVersion={APP_VERSION}
            commitHash={COMMIT_HASH}
            url={new URL(window.location.href)}
        />
    </Page>
);
