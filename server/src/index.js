const path = require("path");
const http = require("http");
const Express = require("express");
const SocketIO = require("socket.io");

// TODO Clean up everything, make common stuff DRY, split into dif files.
// TODO Scale up to multiple rooms (& multiple servers?)
// TODO Organize everything

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



function getVisibleClientsState(origClientsState, votesVisible){
    let visibleClientsState = origClientsState;
    if (!votesVisible) {
        visibleClientsState = { ...origClientsState };
        Object.entries(visibleClientsState).forEach(([name, csObj]) => {
            visibleClientsState[name] = {
                ...csObj,
                // '?' to indicate they've chosen something vs awaiting them
                vote: csObj.vote === null ? null : "?"
            };
        });
    }
    return visibleClientsState;
}


/**
 * Current state of the 'poker game'
 *
 * @type {Object<string,{vote: number|string|null, timeJoined: number}>}
 */
const clientsState = {};
let currentHost = null;
let isShowingVotes = false;

io.on('connection', (socket) => {


    console.log("New Connection", socket.id);

    socket.join("MAIN_ROOM");

    // TODO: Split out handlers to own files/modules as they grow.

    io.engine.on("connection_error", (err) => {
        console.error("Connection Error", err);
    });

    socket.on("join", ({ name })=>{
        if (clientsState.hasOwnProperty(name)) {
            // TODO return error msg, allow dif name.
            return false;
        }
        socket.data.name = name;
        clientsState[name] = {
            vote: null,
            timeJoined: socket.handshake.issued
        };

        if (Object.keys(clientsState).length === 1) {
            // First user joined, make them host and ensure state is reset.
            // TODO: clean/DRY/etc
            currentHost = name;
        }

        io.to("MAIN_ROOM").emit("stateUpdate", {
            clientsState: getVisibleClientsState(clientsState, isShowingVotes),
            currentHost,
            isShowingVotes
        });

        socket.emit("stateUpdate", { isJoined: true });
    });

    socket.on("vote", ({ vote }) => {
        if (isShowingVotes) {
            return; // TODO: throw error or smth
        }
        clientsState[socket.data.name].vote = vote;
        io.to("MAIN_ROOM").emit("stateUpdate", {
            clientsState: getVisibleClientsState(clientsState, isShowingVotes),
        });
    });

    socket.on("toggleShowingVotes", () => {
        if (socket.data.name !== currentHost) {
            return; // TODO: throw error or smth
        }
        isShowingVotes = !isShowingVotes;
        io.to("MAIN_ROOM").emit("stateUpdate", {
            clientsState: getVisibleClientsState(clientsState, isShowingVotes),
            isShowingVotes
        });
    });

    socket.on("resetVotes", () => {
        if (socket.data.name !== currentHost) {
            return; // TODO: throw error or smth
        }
        isShowingVotes = false;
        Object.values(clientsState).forEach((clientStateObj) => {
            clientStateObj.vote = null;
        });
        io.to("MAIN_ROOM").emit("stateUpdate", {
            clientsState,
            isShowingVotes,
            myVote: null
        });
    });

    socket.conn.on("close", (reason) => {
        console.log("Client Disconnected", reason);
        if (!socket.data.name) {
            return;
        }
        delete clientsState[socket.data.name];
        const currentClientNames = Object.keys(clientsState);
        if (currentClientNames.length === 0) {
            // Last client left, cleanup
            isShowingVotes = false;
            currentHost = null;
        } else {
            currentHost = currentClientNames[0];
            io.to("MAIN_ROOM").emit("stateUpdate", {
                clientsState: getVisibleClientsState(clientsState, isShowingVotes),
                currentHost
            });
        }
    });

});

httpServer.listen(80);