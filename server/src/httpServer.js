/* eslint-disable no-undef */
import http from "http";
import path from "path";
import Express from "express";
import cookieParser from "cookie-parser";

/**
 * Never used Express b4 but ui-tk uses it so figure will try it out.
 * Plus need a way to serve index.html over HTTP anyway in addition to the WS server.
 *
 * @module
 */

export const app = new Express();
export const httpServer = http.createServer(app);
export const clientRootDir = path.join(__dirname, "../../client");

app.use(cookieParser());
app.use("/static", Express.static(path.join(clientRootDir, "dist"), { index: false }));
app.use("/assets", Express.static(path.join(clientRootDir, "assets"), { index: false }));
