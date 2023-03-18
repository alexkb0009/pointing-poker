import { httpServer } from "./httpServer";
import { Server } from "socket.io";
import { roomStates } from "./roomStates";
import { RoomState } from "./RoomState";
import { roomNameValidRegex } from "../../client/src/constants";

export const io = new Server(httpServer, {
    connectionStateRecovery: {
        // the backup duration of the sessions and the packets
        maxDisconnectionDuration: 10 * 60 * 1000,
    },
});

function getSocketRoomName(socket) {
    return [...socket.rooms][1];
}
/** @returns {{ clientName: string, roomName: string, room: RoomState, isValid: boolean }} */
function validateSocket(socket, needsHost = false) {
    const ret = {
        clientName: null,
        roomName: null,
        room: null,
        isValid: true,
        validationErrorMsg: null,
        isHost: false,
    };
    ret.clientName = socket.data.name;
    if (!ret.clientName) {
        ret.validationErrorMsg = "Socket doesn't have name";
        ret.isValid = false;
        return ret;
    }
    ret.roomName = getSocketRoomName(socket);
    if (!ret.roomName) {
        ret.validationErrorMsg = "Socket not in a room";
        ret.isValid = false;
        return ret;
    }
    ret.room = roomStates.get(ret.roomName);
    if (!ret.room) {
        ret.validationErrorMsg = `Room ${ret.roomName} not found`;
        ret.isValid = false;
        return ret;
    }
    if (needsHost && ret.clientName !== ret.room.currentHost) {
        ret.isValid = false;
    } else {
        ret.isHost = true;
    }
    return ret;
}

const roomJoin = (socket, name, roomParam = null, isSpectating = false) => {
    if (!name) {
        // Let UI handle 'required' validation
        return false;
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

    let room = roomStates.get(roomName);
    if (!room) {
        room = new RoomState(roomName);
        roomStates.set(roomName, room);
    }

    const client = room.addClient(name, {
        isSpectating,
        timeJoined: socket.handshake.issued,
        socketId: socket.id,
    });

    if (!client) {
        socket.emit("error_alert", {
            title: "Name Taken",
            message: `Someone with name ${name} is in already in room ${roomName}. Please try a different name.`,
        });
        delete socket.data.name;
        return false;
    }

    socket.to(roomName).emit("stateUpdate", {
        ...room.toJSON(),
    });

    const clientSpecificState = {
        ...room.toJSON(),
        config: room.config,
        isJoined: true,
        myName: socket.data.name,
        myVote: client.vote || null,
    };

    socket.emit("stateUpdate", clientSpecificState);
    return true;
};

const roomExitCleanup = (roomName) => {
    if (!roomName) {
        return;
    }

    const room = roomStates.get(roomName);
    if (!room) {
        // May be redundant, but this may be executed from a setTimeout
        // during which state has changed.
        return;
    }
    if (room.clientsCount === 0) {
        // No clients left in room, clean it up
        roomStates.delete(roomName);
    } else {
        io.to(roomName).emit("stateUpdate", { ...room.toJSON() });
    }
};

io.on("connection", (socket) => {
    if (socket.recovered && socket.data.name && socket.rooms.size === 2) {
        roomJoin(socket, socket.data.name, getSocketRoomName(socket));
    }

    socket.on("join", ({ name, room: roomParam = null, isSpectating = false }) => {
        roomJoin(socket, name, roomParam, isSpectating);
    });

    socket.on("exit", () => {
        const { clientName, roomName, room } = validateSocket(socket);
        if (!clientName) {
            console.warn("Room exit attempted without socket data name.", socket.rooms);
            return false;
        }
        if (!roomName) {
            console.warn("Room exit attempted without socket room", clientName);
            return false;
        }
        if (!room) {
            console.warn("Room exit attempted on non-existent room", roomName, clientName);
            return false;
        }
        room.removeClient(clientName);
        socket.leave(roomName);
        socket.emit("stateUpdate", {
            isJoined: false,
            roomName: null,
            myName: null,
            myVote: null,
        });
    });

    socket.on("vote", ({ vote }) => {
        const { isValid, clientName, roomName, room } = validateSocket(socket);
        if (!isValid) return;
        room.setClientVote(clientName, vote);
        io.to(roomName).emit("stateUpdate", { ...room.toJSON() });
        socket.emit("stateUpdate", { myVote: vote });
    });

    socket.on("toggleShowingVotes", () => {
        const { isValid, roomName, room } = validateSocket(socket, true);
        if (!isValid) return;
        const changedToPassVotes = room.toggleShowingVotes();
        if (changedToPassVotes.length > 0) {
            changedToPassVotes.forEach((socketId) => {
                io.to(socketId).emit("stateUpdate", { myVote: "PASS" });
            });
        }
        io.to(roomName).emit("stateUpdate", { ...room.toJSON() });
    });

    socket.on("toggleSpectating", () => {
        const { isValid, clientName, roomName, room } = validateSocket(socket);
        if (!isValid) return;
        room.toggleClientSpectating(clientName);
        io.to(roomName).emit("stateUpdate", { ...room.toJSON() });
    });

    socket.on("nextAgendaItem", () => {
        const { isValid, roomName, room } = validateSocket(socket, true);
        if (!isValid) return;
        room.queueNextAgendaItem();
        io.to(roomName).emit("stateUpdate", { ...room.toJSON(), myVote: null });
    });

    socket.on("resetVotes", () => {
        const { isValid, roomName, room } = validateSocket(socket, true);
        if (!isValid) return;
        room.resetRoomVotes();
        io.to(roomName).emit("stateUpdate", { ...room.toJSON(), myVote: null });
    });

    socket.on("setAgendaQueue", ({ agendaQueue = [] }) => {
        const { isValid, roomName, room } = validateSocket(socket);
        if (!isValid) return;
        room.agendaQueue = agendaQueue;
        io.to(roomName).emit("stateUpdate", { agendaQueue: room.agendaQueue });
    });

    socket.on("setConfig", ({ config = {} }) => {
        const { isValid, roomName, room } = validateSocket(socket, true);
        if (!isValid) return;
        room.updateConfig(config);
        io.to(roomName).emit("stateUpdate", { config: room.config });
    });
});

io.of("/").adapter.on("leave-room", (roomName, socketId) => {
    const room = roomStates.get(roomName);
    if (!room) {
        // Done
        return;
    }

    const clientName = room.getClientNameBySocketId(socketId);

    if (!clientName) {
        // Left room already, e.g. via exit event
        roomExitCleanup(roomName);
    } else {
        // Left room due to disconnection
        room.setClientExitTimeout(clientName, () => roomExitCleanup(roomName, clientName));
        io.to(roomName).emit("stateUpdate", { ...room.toJSON() });
    }
});

io.engine.on("connection_error", (err) => {
    console.error("Connection Error", err);
});
