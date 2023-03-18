/* eslint-disable no-undef */
/**
 * Run this file with node to bootup http & socket.io servers.
 *
 * @module
 * @todo Continue to organize, clean things, make common stuff DRY, etc.
 * @todo Maybe scale up to multiple servers
 * @todo
 * Make each room a class instance? - Probably, but after hooking up to DBs & scaling as that'll inform setup
 * How would roomStates scale with # of servers? Sticky sessions? Store roomStates into Redis?
 * Making it DB-less with sticky sessions might be a nice cost proposition...
 */

require("../client/dist/server-bundle").httpServer.listen(process.env.PORT || 80);
