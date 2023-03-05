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

app.get('/', (req, res) => {
    res.sendFile(path.join(clientRootDir, "index.html"));
});

app.get('/room/:roomId/', (req, res) => {
    res.sendFile(path.join(clientRootDir, "index.html"));
});


/** Transform Map to object, hide votes if needed */
function getVisibleClientsState(origClientsState, votesVisible){
    const visibleClientsState = {};
    origClientsState.forEach((csObj, key) => {
        if (votesVisible) {
            visibleClientsState[key] = csObj;
        } else {
            visibleClientsState[key] = {
                ...csObj,
                // '?' to indicate they've chosen something vs awaiting them
                vote: csObj.vote === null ? null : "?"
            };
        }
    });
    return visibleClientsState;
}

/** Returns first entry of clientsState */
function getCurrentHost(clientsState){
    return clientsState.entries().next().value[0];
}


/**
 * Current state of the 'poker game'.
 *
 * 'clientsState' is a Map so that key ordering by insertion is guaranteed
 * for determining currentHost.
 *
 * @type {Object<string,{ isShowingVotes: boolean, clientsState: Map<string,{vote: number|string|null}> }>}
 */
const roomStates = {};

const getNewRoomState = () => ({
    clientsState: new Map(),
    isShowingVotes: false
});

io.on('connection', (socket) => {


    console.log("New Connection", socket.id);

    // TODO: Split out handlers to own files/modules as they grow.

    io.engine.on("connection_error", (err) => {
        console.error("Connection Error", err);
    });

    socket.on("join", ({ name, room: roomParam = "MAIN_ROOM" }) => {

        socket.join(roomParam);

        console.log("Joining room", roomParam, socket.rooms);

        socket.data.room = roomParam;

        roomStates[roomParam] = roomStates[roomParam] || getNewRoomState();

        const room = roomStates[roomParam];

        if (room.clientsState.has(name)) {
            // TODO return error msg, allow dif name.
            return false;
        }
        socket.data.name = name;
        room.clientsState.set(name, {
            vote: null,
            timeJoined: socket.handshake.issued
        });

        console.log(roomParam, socket.data.room, room);

        io.to(roomParam).emit("stateUpdate", {
            clientsState: getVisibleClientsState(
                room.clientsState,
                room.isShowingVotes
            ),
            isShowingVotes: room.isShowingVotes,
            currentHost: getCurrentHost(room.clientsState)
        });

        socket.emit("stateUpdate", { isJoined: true });
    });

    socket.on("vote", ({ vote }) => {
        const room = roomStates[socket.data.room];
        if (room.isShowingVotes) {
            return; // TODO: throw error or smth
        }
        room.clientsState.get(socket.data.name).vote = vote;
        io.to(socket.data.room).emit("stateUpdate", {
            clientsState: getVisibleClientsState(
                room.clientsState,
                room.isShowingVotes
            ),
        });
    });

    socket.on("toggleShowingVotes", () => {
        const room = roomStates[socket.data.room];
        if (socket.data.name !== getCurrentHost(room.clientsState)) {
            return; // TODO: throw error or smth
        }
        room.isShowingVotes = !room.isShowingVotes;
        io.to(socket.data.room).emit("stateUpdate", {
            clientsState: getVisibleClientsState(
                room.clientsState,
                room.isShowingVotes
            ),
            isShowingVotes: room.isShowingVotes
        });
    });

    socket.on("resetVotes", () => {
        const room = roomStates[socket.data.room];
        if (socket.data.name !== room.currentHost) {
            return; // TODO: throw error or smth
        }
        room.isShowingVotes = false;
        room.clientsState.forEach((clientStateObj) => {
            clientStateObj.vote = null;
        });
        io.to(socket.data.room).emit("stateUpdate", {
            clientsState: getVisibleClientsState(
                room.clientsState,
                room.isShowingVotes
            ),
            isShowingVotes: room.isShowingVotes,
            myVote: null
        });
    });

    socket.conn.on("close", (reason) => {
        const room = roomStates[socket.data.room];
        console.log("Client Disconnected", reason);
        if (!socket.data.name) {
            return;
        }
        room.clientsState.delete(socket.data.name);
        if (room.clientsState.size === 0) {
            // Last client left, cleanup
            delete roomStates[socket.data.room];
        } else {
            io.to(socket.data.room).emit("stateUpdate", {
                clientsState: getVisibleClientsState(
                    room.clientsState,
                    room.isShowingVotes
                ),
                currentHost: getCurrentHost(room.clientsState)
            });
        }
    });

});

httpServer.listen(80);