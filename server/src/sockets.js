import { httpServer } from "./httpServer";
import { Server } from "socket.io";
import { roomNameValidRegex } from "../../client/src/constants";

export const io = new Server(httpServer);

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

/**
 * Current state of the 'poker game'.
 *
 * 'clientsState' is a Map so that key ordering by insertion is guaranteed
 * for determining currentHost.
 *
 * @type {Map.<string,{ clientsState: { name: string, vote: number|string|null, isSpectating: boolean, agendaQueue: string[], agendaHistory: { text: string, votes: Array.<string|number|null> }[], originalHost: string }[], isShowingVotes: boolean }>}
 */
const roomStates = new Map();

const getNewRoomState = () => ({
    clientsState: [],
    isShowingVotes: false,
    agendaQueue: [],
    agendaHistory: [],
    originalHost: null,
});

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

const resetRoomVotes = (roomName, roomObject, extraStateToSend) => {
    const room = roomObject || roomStates.get(roomName);

    room.isShowingVotes = false;
    room.clientsState.forEach((clientStateObj) => {
        clientStateObj.vote = null;
    });

    io.to(roomName).emit("stateUpdate", {
        clientsState: getVisibleClientsState(room),
        isShowingVotes: room.isShowingVotes,
        myVote: null,
        ...extraStateToSend,
    });
};

io.on("connection", (socket) => {
    // console.log("NEW CONNECTION, CURRENT STATE", roomStates);

    // TODO: Split out into '/src/sockets' file or folder?

    socket.on("join", ({ name, room: roomParam = null, isSpectating = false }) => {
        if (!name) {
            // Let UI handle 'required' validation
            return false; // TODO return error msg, allow dif name.
        }
        socket.data.name = name;
        const roomName = roomParam || "default-room";
        const isValidRoomName = roomName.length <= 12 && roomNameValidRegex.test(roomName);

        if (!isValidRoomName) {
            socket.emit("error_alert", {
                title: "Invalid Room Name",
                message:
                    "Try a different room name. Only valid URL characters are allowed with a max length of 12 characters.",
            });
            return false; // TODO return error msg, allow dif name.
        }

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
                socket.emit("error_alert", {
                    title: "Name Taken",
                    message: `Someone with name ${name} is in already in room ${roomName}. Please try a different name.`,
                });
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
        if (!socket.data.name) {
            console.warn("Room exit attempted without socket data name.", socket.rooms);
            return false;
        }
        if (!socket.data.room) {
            console.warn("Room exit attempted without socket data room", socket.rooms);
            return false;
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
            console.warn("toggleShowingVotes attempted by a non-host.");
            return;
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

    socket.on("nextAgendaItem", () => {
        const room = roomStates.get(socket.data.room);
        if (socket.data.name !== getCurrentHost(room.clientsState)) {
            console.warn("nextAgendaItem attempted by a non-host.");
            return;
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

        resetRoomVotes(socket.data.room, room, {
            agendaQueue: room.agendaQueue,
            agendaHistory: room.agendaHistory,
        });
    });

    socket.on("resetVotes", () => {
        const room = roomStates.get(socket.data.room);
        if (socket.data.name !== getCurrentHost(room.clientsState)) {
            console.warn("resetVotes attempted by a non-host.");
            return;
        }

        resetRoomVotes(socket.data.room, room);
    });

    socket.on("setAgendaQueue", ({ agendaQueue }) => {
        const room = roomStates.get(socket.data.room);
        if (socket.data.name !== getCurrentHost(room.clientsState)) {
            console.warn("setAgendaQueue attempted by a non-host.");
            return;
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
