const path = require("path");
const http = require("http");
const Express = require("express");
const SocketIO = require("socket.io");

/**
 * @module
 * Never used Express b4 but ui-tk uses it so figure will try it out.
 * Plus need a way to serve index.html over HTTP anyway in addition to the WS server.
 */

const app = Express();
const httpServer = http.createServer(app);
const io = new SocketIO.Server(httpServer);

const clientRootDir = path.join(__dirname, "../../client");

app.use('/static', Express.static(path.join(clientRootDir, "dist"), { index: false }));

app.get('/', (req, res)=>{
    res.sendFile(path.join(clientRootDir, "index.html"));
});



/**
 * Current state of the 'poker game'
 *
 * @type {Object<string,{pointsVote: number|string|null, timeJoined: number}>}
 */
const clientsState = {};
let currentHost = null;

io.on('connection', (socket) => {


    console.log("New Connection", socket.id);
    socket.join("MAIN_ROOM");

    // TODO: Split out handlers to own files/modules as they grow.

    io.engine.on("connection_error", (err) => {
        console.error("Connection Error", err);
    });

    socket.emit("initialization", {
        clientCount: io.engine.clientCount
    });

    socket.on("join", ({ name })=>{
        if (clientPool.hasOwnProperty(name)) {
            // TODO return error msg, allow dif name.
            return false;
        }
        socket.data.name = name;
        clientPool[name] = {
            pointsVote: null,
            timeJoined: socket.handshake.issued
        };
        if (Object.keys(clientsState).length === 0) {
            currentHost = name;
        }
    });

    socket.conn.on("close", (reason) => {
        console.log("Client Disconnected", reason);
        if (!socket.data.name) {
            return;
        }
        delete clientsState[socket.data.name];
        const currentClientNames = Object.keys(clientsState);
        if (currentClientNames.length === 0) {
            return;
        }
        currentHost = currentClientNames[0];
    });

});

httpServer.listen(80);