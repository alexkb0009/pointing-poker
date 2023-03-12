import React, { useEffect } from "react";

// Ensure GA is used for static/non-interactive SSRs as well.
const gaSnippet = `
window.dataLayer = window.dataLayer || [];
window.gtag = function () {
    window.dataLayer.push(arguments);
};
window.gtag("js", new Date());
window.gtag("config", "G-YJVYC858NK");
`;

export function Page({ children }) {
    return (
        <html>
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />

                <title>Planning Poker</title>
                <link rel="prefetch" href="/static/styles.css"></link>
                <link href="/static/styles.css" rel="stylesheet" />
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.3.0/css/all.min.css"
                />
            </head>
            <body style={{ visibility: "hidden" }}>
                <div id="root">{children}</div>
                <script
                    type="text/javascript"
                    defer
                    src="https://www.googletagmanager.com/gtag/js?id=G-YJVYC858NK"
                />
                <script dangerouslySetInnerHTML={{ __html: gaSnippet }}></script>
            </body>
        </html>
    );
}
