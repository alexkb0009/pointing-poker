import http from "http";
import Express from "express";

/**
 * Never used Express b4 but ui-tk uses it so figure will try it out.
 * Plus need a way to serve index.html over HTTP anyway in addition to the WS server.
 *
 * @module
 */

export const app = new Express();
export const httpServer = http.createServer(app);
