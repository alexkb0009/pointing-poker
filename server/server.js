/* eslint-disable no-undef */

/**
 * Run this file with node to bootup http & socket.io servers.
 *
 * @module
 * @todo Continue to organize, clean things, make common stuff DRY, etc.
 * @todo Maybe scale up to multiple servers
 */

require("./dist/server-bundle").httpServer.listen(process.env.PORT || 80);
