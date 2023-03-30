/* eslint-disable no-undef */
import path from "path";
import fs from "fs";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { app, clientRootDir } from "./httpServer";
import { io } from "./sockets";
import { roomStates } from "./roomStates";
import { Page } from "../../client/src/Page";
import { App } from "../../client/src/components/App";
import { TopNav } from "../../client/src/components/TopNav";
import { TOS } from "../../client/src/components/static-views/terms-of-service";
import { PrivacyPolicy } from "../../client/src/components/static-views/privacy-policy";

// Not sure is best approach but works for now...
const cssBundles = [];
const jsBundles = [];

JSON.parse(fs.readFileSync(path.join(clientRootDir, "dist/client-bundles.json")))
    .assetsByChunkName.bundle.map((fn) => `/static/${fn}`)
    .forEach((fn) => {
        if (fn.endsWith(".css")) cssBundles.push(fn);
        if (fn.endsWith(".js")) jsBundles.push(fn);
    });

export const pipeSSR = (request, response, children, bootstrapScripts = jsBundles) => {
    return new Promise((resolve, reject) => {
        const { pipe } = ReactDOMServer.renderToPipeableStream(
            <Page
                url={makeUrlObject(request)}
                cssBundles={cssBundles}
                initialCookies={request.cookies}
            >
                {children}
            </Page>,
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

export const makeUrlObject = (request) =>
    new URL(`${request.protocol}://${request.get("host")}${request.originalUrl}`);

app.get("/", (req, res) => {
    pipeSSR(req, res, <App />);
});

app.get("/room/:roomId/", (req, res) => {
    pipeSSR(req, res, <App />);
});

app.get("/health", (req, res) => {
    res.send("200 OK");
});

app.get("/stats", (req, res) => {
    let roomClientsCount = 0;
    roomStates.forEach((room) => {
        roomClientsCount += room.clientsCount;
    });
    res.json({
        roomCount: roomStates.size,
        roomClientsCount,
        socketClientsCount: io.engine.clientsCount,
    });
});

app.get("/room/:roomId/stats/", (req, res) => {
    const room = roomStates.get(req.params.roomId);
    res.json({
        clientsCount: (room && room.clientsCount) || 0,
        socketClientsCount: (room && io.sockets.adapter.rooms.get(room.roomName)?.size) || 0,
    });
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
