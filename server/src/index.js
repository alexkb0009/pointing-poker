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


/** Hide votes if needed */
function getVisibleClientsState(origClientsState, votesVisible){
    return origClientsState.map(({ name, vote, exitTimeout }) => ({
        name,
        vote: votesVisible ? vote
            : vote === null ? "?"
                : "HAS_VOTE",
        isExiting: exitTimeout !== null
    }));
}

/** Returns first entry of clientsState. */
function getCurrentHost(clientsState){
    if (clientsState.length === 0) return null;
    const currentHostName = clientsState[0].name;
    return currentHostName;
}


/**
 * Current state of the 'poker game'.
 *
 * 'clientsState' is a Map so that key ordering by insertion is guaranteed
 * for determining currentHost.
 *
 * @type {Object<string,{ clientsState: { name: string, vote: number|string|null }[], isShowingVotes: boolean }>}
 */
const roomStates = {};

const getNewRoomState = () => ({
    clientsState: [],
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

        if (!name) return false; // TODO return error msg, allow dif name.
        socket.data.name = name;

        const existingClient = room.clientsState.find(({ name: csName }) => name === csName);
        if (existingClient) {
            if (existingClient.exitTimeout) {
                // Resume session as this name/client
                clearTimeout(existingClient.exitTimeout);
                existingClient.exitTimeout = null;
            } else {
                // TODO return error msg, allow dif name.
                return false;
            }
        } else {
            const clientStateObj = {
                name,
                vote: null,
                timeJoined: socket.handshake.issued,
                socket,
                exitTimeout: null
            };
            room.clientsState.push(clientStateObj);
        }

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
            myVote: existingClient?.vote || null
        });
    });

    socket.on("vote", ({ vote }) => {
        const room = roomStates[socket.data.room];

        room.clientsState
            .find(({ name }) => name === socket.data.name)
            .vote = vote;

        const areAllVotesIn = room.clientsState
            .every(({ vote: csVote }) => csVote !== null);

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
        const clientStateObj = socket.data.name && room.clientsState.find(({ name }) => name === socket.data.name);

        if (!clientStateObj) {
            return;
        }
        
        clientStateObj.exitTimeout = setTimeout(() => {

            // Delete client data from room
            const delIndex = room.clientsState.findIndex(({ name }) => name === socket.data.name);
            room.clientsState.splice(delIndex, 1);

            if (room.clientsState.length === 0) {
                // No clients left in room, clean it up
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

        }, 15000);

        io.to(socket.data.room).emit("stateUpdate", {
            clientsState: getVisibleClientsState(
                room.clientsState,
                room.isShowingVotes
            )
        });

        
    });

});

io.engine.on("connection_error", (err) => {
    console.error("Connection Error", err);
});

httpServer.listen(process.env.PORT || 80);