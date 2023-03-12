import path from "path";
import React from "react";
import ReactDOMServer from "react-dom/server";
import Express from "express";
import { Page } from "../../client/src/Page";
import { App } from "../../client/src/components/App";
import { TopNav } from "../../client/src/components/TopNav";
import { TOS } from "../../client/src/components/static-views/terms-of-service";
import { PrivacyPolicy } from "../../client/src/components/static-views/privacy-policy";

const pipeSSR = (request, response, children, bootstrapScripts = ["/static/bundle.js"]) => {
    return new Promise((resolve, reject) => {
        const { pipe } = ReactDOMServer.renderToPipeableStream(
            <Page url={makeUrlObject(request)}>{children}</Page>,
            {
                bootstrapScripts,
                onShellReady: () => {
                    response.statusCode = 200;
                    response.setHeader("Content-type", "text/html");
                    pipe(response);
                    resolve(response);
                },
                onError: (err) => {
                    reject(err);
                },
            }
        );
    });
};

const makeUrlObject = (request) =>
    new URL(`${request.protocol}://${request.get("host")}${request.originalUrl}`);

export const setupRoutes = (app) => {
    const clientRootDir = path.join(__dirname, "../../client");

    app.use("/static", Express.static(path.join(clientRootDir, "dist"), { index: false }));

    app.get("/", (req, res) => {
        pipeSSR(req, res, <App />);
    });

    app.get("/room/:roomId/", (req, res) => {
        pipeSSR(req, res, <App />);
    });

    app.get("/health", (req, res) => {
        res.send("200 OK");
    });

    app.get("/terms-of-service", (req, res) => {
        pipeSSR(
            req,
            res,
            <>
                <TopNav href="/" />
                <TOS />
            </>,
            []
        );
    });

    app.get("/cookie-policy", (req, res) => {
        pipeSSR(
            req,
            res,
            <>
                <TopNav href="/" />
                <PrivacyPolicy />
            </>,
            []
        );
    });
};
