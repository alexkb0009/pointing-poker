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

app.get('/health', (req, res) => {
    res.send("200 OK");
});


/** Transform Map to array, hide votes if needed */
function getVisibleClientsState(origClientsState, votesVisible){
    return Array.from(origClientsState)
        .map(([name, { vote }]) => ({
            name,
            vote: votesVisible ? vote
                : vote === null ? "?"
                    : "HAS_VOTE"
        }));
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

    // console.log("NEW CONNECTION, CURRENT STATE", roomStates);

    // TODO: Split out handlers to own files/modules as they grow.

    socket.on("join", ({ name, room: roomParam = null }) => {
        const roomName = roomParam || "default-room";
        socket.join(roomName);
        socket.data.room = roomName;

        roomStates[socket.data.room] = roomStates[socket.data.room] || getNewRoomState();
        const room = roomStates[socket.data.room];

        if (!name || room.clientsState.has(name)) {
            // TODO return error msg, allow dif name.
            return false;
        }
        socket.data.name = name;
        room.clientsState.set(name, {
            vote: null,
            timeJoined: socket.handshake.issued,
            socket
        });

        io.to(socket.data.room).emit("stateUpdate", {
            clientsState: getVisibleClientsState(
                room.clientsState,
                room.isShowingVotes
            ),
            isShowingVotes: room.isShowingVotes,
            currentHost: getCurrentHost(room.clientsState)
        });

        socket.emit("stateUpdate", {
            isJoined: true,
            room: socket.data.room,
            myName: socket.data.name,
            myVote: null
        });
    });

    socket.on("vote", ({ vote }) => {
        const room = roomStates[socket.data.room];

        room.clientsState.get(socket.data.name).vote = vote;

        const areAllVotesIn = Array.from(room.clientsState)
            .every(([name, { vote: csVote }]) => csVote !== null);

        if (areAllVotesIn) {
            room.isShowingVotes = true;
        }

        io.to(socket.data.room).emit("stateUpdate", {
            clientsState: getVisibleClientsState(
                room.clientsState,
                room.isShowingVotes
            ),
            isShowingVotes: room.isShowingVotes
        });
        socket.emit("stateUpdate", { myVote: vote });
    });

    socket.on("toggleShowingVotes", () => {
        const room = roomStates[socket.data.room];
        if (socket.data.name !== getCurrentHost(room.clientsState)) {
            return; // TODO: throw error or smth
        }
        room.isShowingVotes = !room.isShowingVotes;
        if (room.isShowingVotes) {
            room.clientsState.forEach((clientStateObj) => {
                // Default non-votes to "PASS"
                if (!clientStateObj.vote) {
                    clientStateObj.vote = "PASS";
                    clientStateObj.socket.emit("stateUpdate", { myVote: "PASS" });
                }
            });
        }
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
        if (socket.data.name !== getCurrentHost(room.clientsState)) {
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

    socket.on("disconnect", (reason) => {
        // console.log("Disconnected", socket.data.name, reason);
        if (!socket.data.room) {
            return;
        }

        const room = roomStates[socket.data.room];

        if (socket.data.name) {
            room.clientsState.delete(socket.data.name);
        }

        if (room.clientsState.size === 0) {
            // No more clients in room, clean it up
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

io.engine.on("connection_error", (err) => {
    console.error("Connection Error", err);
});

httpServer.listen(process.env.PORT || 80);