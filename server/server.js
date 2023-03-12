const http = require("http");
const Express = require("express");
const SocketIO = require("socket.io");
const { setupRoutes } = require("../client/dist/server-bundle");

// TODO Clean up everything, make common stuff DRY, split into dif files.
// TODO Scale up to multiple rooms (& multiple servers?)
// TODO Organize everything
// TODO: Make each room a class instance? - Probably, but after hooking up to DBs & scaling as that'll inform setup
// How would roomStates scale with # of servers? Sticky sessions? Store roomStates into Redis or Mongo?
// Making it DB-less with sticky sessions might be a nice cost proposition...

/**
 * @module
 * Never used Express b4 but ui-tk uses it so figure will try it out.
 * Plus need a way to serve index.html over HTTP anyway in addition to the WS server.
 */

const app = Express();
const httpServer = http.createServer(app);
const io = new SocketIO.Server(httpServer);

setupRoutes(app);

/** Hide votes if needed */
function getVisibleClientsState({ clientsState, isShowingVotes }) {
    return clientsState.map(({ name, vote, exitTimeout, isSpectating }) => ({
        name,
        vote: isShowingVotes ? vote : vote === null ? "?" : "HAS_VOTE",
        isExiting: exitTimeout !== null,
        isSpectating,
    }));
}

/** Returns first entry of clientsState. */
function getCurrentHost(clientsState) {
    if (clientsState.length === 0) return null;
    const currentHostName = clientsState[0].name;
    return currentHostName;
}

const roomExitCleanup = (socket) => {
    const { room: roomName, name: clientName } = socket.data;
    const room = roomStates.get(roomName);
    if (!room) {
        return;
    }

    const clientStateIndex =
        clientName && room.clientsState.findIndex(({ name }) => name === clientName);

    if (clientStateIndex !== -1) {
        // Delete client data from room
        room.clientsState.splice(clientStateIndex, 1);
    }

    delete socket.data.room;

    if (room.clientsState.length === 0) {
        // No clients left in room, clean it up
        roomStates.delete(roomName);
    } else {
        io.to(roomName).emit("stateUpdate", {
            clientsState: getVisibleClientsState(room),
            currentHost: getCurrentHost(room.clientsState),
        });
    }
};

// setInterval(() => {
//     console.log("ROOMS", roomStates.keys());
// }, 5000);

/**
 * Current state of the 'poker game'.
 *
 * 'clientsState' is a Map so that key ordering by insertion is guaranteed
 * for determining currentHost.
 *
 * @type {Map<string,{ clientsState: { name: string, vote: number|string|null, isSpectating: boolean }[], isShowingVotes: boolean }>}
 */
const roomStates = new Map();

const getNewRoomState = () => ({
    clientsState: [],
    isShowingVotes: false,
    agendaQueue: [],
    agendaHistory: [],
    originalHost: null,
});

io.on("connection", (socket) => {
    // console.log("NEW CONNECTION, CURRENT STATE", roomStates);

    // TODO: Split out into '/src/sockets' file or folder?

    socket.on("join", ({ name, room: roomParam = null, isSpectating = false }) => {
        if (!name) {
            return false; // TODO return error msg, allow dif name.
        }
        socket.data.name = name;
        const roomName = roomParam || "default-room";

        // Ensure socket is in 1 room only
        [...socket.rooms].slice(1).forEach((rn) => {
            socket.leave(rn);
        });
        socket.join(roomName);
        socket.data.room = roomName;

        const isNewRoom = !roomStates.has(socket.data.room);
        const room = !isNewRoom ? roomStates.get(socket.data.room) : getNewRoomState();

        if (isNewRoom) {
            roomStates.set(socket.data.room, room);
            room.originalHost = name;
        }

        const existingClient = room.clientsState.find(({ name: csName }) => name === csName);
        if (existingClient) {
            if (existingClient.exitTimeout) {
                // Resume session as this name/client
                clearTimeout(existingClient.exitTimeout);
                existingClient.exitTimeout = null;
                // Update some fields
                existingClient.isSpectating = isSpectating;
            } else {
                // TODO return error msg, allow dif name.
                delete socket.data.name;
                return false;
            }
        } else {
            const clientStateObj = {
                name,
                vote: null,
                timeJoined: socket.handshake.issued,
                socket,
                exitTimeout: null,
                isSpectating,
            };
            if (room.originalHost === name) {
                room.clientsState.unshift(clientStateObj);
            } else {
                room.clientsState.push(clientStateObj);
            }
        }

        io.to(socket.data.room).emit("stateUpdate", {
            clientsState: getVisibleClientsState(room),
            isShowingVotes: room.isShowingVotes,
            currentHost: getCurrentHost(room.clientsState),
        });

        const userState = {
            isJoined: true,
            room: socket.data.room,
            myName: socket.data.name,
            myVote: existingClient?.vote || null,
            agendaQueue: room.agendaQueue,
            agendaHistory: room.agendaHistory,
        };

        socket.emit("stateUpdate", userState);
    });

    socket.on("exit", () => {
        if (!socket.data.name || !socket.data.room) {
            return false; // TODO: Error throw stuff
        }
        socket.leave(socket.data.room);
        roomExitCleanup(socket);
        socket.emit("stateUpdate", {
            isJoined: false,
            room: null,
            myName: null,
            myVote: null,
        });
    });

    socket.on("vote", ({ vote }) => {
        const room = roomStates.get(socket.data.room);

        if (room.isShowingVotes) {
            return false; // Don't allow changing vote for now.
        }

        room.clientsState.find(({ name }) => name === socket.data.name).vote = vote;

        const areAllVotesIn = room.clientsState
            .filter(({ isSpectating }) => !isSpectating)
            .every(({ vote: csVote }) => csVote !== null);

        if (areAllVotesIn) {
            room.isShowingVotes = true;
        }

        io.to(socket.data.room).emit("stateUpdate", {
            clientsState: getVisibleClientsState(room),
            isShowingVotes: room.isShowingVotes,
        });
        socket.emit("stateUpdate", { myVote: vote });
    });

    socket.on("toggleShowingVotes", () => {
        const room = roomStates.get(socket.data.room);
        if (socket.data.name !== getCurrentHost(room.clientsState)) {
            return; // TODO: throw error or smth
        }
        room.isShowingVotes = !room.isShowingVotes;
        if (room.isShowingVotes) {
            room.clientsState
                .filter(({ isSpectating }) => !isSpectating)
                .forEach((clientStateObj) => {
                    // Default non-votes to "PASS"
                    if (!clientStateObj.vote) {
                        clientStateObj.vote = "PASS";
                        clientStateObj.socket.emit("stateUpdate", {
                            myVote: "PASS",
                        });
                    }
                });
        }
        io.to(socket.data.room).emit("stateUpdate", {
            clientsState: getVisibleClientsState(room),
            isShowingVotes: room.isShowingVotes,
        });
    });

    socket.on("toggleSpectating", () => {
        const room = roomStates.get(socket.data.room);
        const clientStateObj = room.clientsState.find(({ name }) => name === socket.data.name);
        clientStateObj.isSpectating = !clientStateObj.isSpectating;

        const areAllVotesIn = room.clientsState
            .filter(({ isSpectating }) => !isSpectating)
            .every(({ vote: csVote }) => csVote !== null);

        if (areAllVotesIn) {
            room.isShowingVotes = true;
        }

        io.to(socket.data.room).emit("stateUpdate", {
            clientsState: getVisibleClientsState(room),
            isShowingVotes: room.isShowingVotes,
        });
    });

    socket.on("resetVotes", () => {
        const room = roomStates.get(socket.data.room);
        if (socket.data.name !== getCurrentHost(room.clientsState)) {
            return; // TODO: throw error or smth
        }

        const lastAgendaItem = room.agendaQueue.shift();
        const historyItem = {
            text: !lastAgendaItem
                ? null
                : lastAgendaItem.length < 120
                ? lastAgendaItem
                : lastAgendaItem.slice(0, 120).trim() + "...",
            votes: room.clientsState.map(({ vote }) => vote),
        };
        room.agendaHistory.push(historyItem);
        room.isShowingVotes = false;
        room.clientsState.forEach((clientStateObj) => {
            clientStateObj.vote = null;
        });

        io.to(socket.data.room).emit("stateUpdate", {
            clientsState: getVisibleClientsState(room),
            isShowingVotes: room.isShowingVotes,
            myVote: null,
            agendaQueue: room.agendaQueue,
            agendaHistory: room.agendaHistory,
        });
    });

    socket.on("setAgendaQueue", ({ agendaQueue }) => {
        const room = roomStates.get(socket.data.room);
        if (socket.data.name !== getCurrentHost(room.clientsState)) {
            return; // TODO: throw error or smth
        }
        room.agendaQueue = agendaQueue;

        io.to(socket.data.room).emit("stateUpdate", {
            agendaQueue: room.agendaQueue,
        });
    });

    socket.on("disconnect", (reason) => {
        const { room: roomName, name: clientName } = socket.data;
        // console.log("Disconnected", socket.data.name, socket.data.room, socket.rooms, reason);
        if (!roomName || !roomStates.has(roomName)) {
            // Done
            return;
        }

        const room = roomStates.get(roomName);
        const clientStateObj =
            clientName && room.clientsState.find(({ name }) => name === clientName);

        if (!clientStateObj) {
            roomExitCleanup(socket);
        } else {
            clientStateObj.exitTimeout = setTimeout(roomExitCleanup, 15000, socket);
        }

        io.to(roomName).emit("stateUpdate", {
            clientsState: getVisibleClientsState(room),
        });
    });
});

io.engine.on("connection_error", (err) => {
    console.error("Connection Error", err);
});

httpServer.listen(process.env.PORT || 80);
