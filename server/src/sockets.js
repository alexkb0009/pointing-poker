import { httpServer } from "./httpServer";
import { Server } from "socket.io";
import { roomStates } from "./roomStates";
import { RoomState } from "./RoomState";
import { roomNameValidRegex } from "../../client/src/constants";

export const io = new Server(httpServer);

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
    ret.roomName = socket.data.room;
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

    const roomName = roomParam || "default-room";
    const isValidRoomName = roomName.length <= 12 && roomNameValidRegex.test(roomName);
    if (!isValidRoomName) {
        // Let UI handle with 'pattern' + 'maxLength' validation.
        socket.emit("alert", {
            type: "error",
            title: "Invalid Room Name",
            message:
                "Try a different room name. Only valid URL characters are allowed with a max length of 12 characters.",
        });
        return false;
    }

    // Exit all rooms to ensure socket is in 1 room only
    [...socket.rooms].slice(1).forEach((rn) => {
        socket.leave(rn);
    });

    let room = roomStates.get(roomName);
    if (!room) {
        room = new RoomState(roomName);
        roomStates.set(roomName, room);
    } else {
        room.cancelDeferredDeletion();
    }

    const client = room.addClient(name, {
        isSpectating,
        timeJoined: socket.handshake.issued,
        socketId: socket.id,
    });

    if (!client) {
        socket.emit("stateUpdate", {
            isJoined: false,
        });
        socket.emit("alert", {
            id: "joinNameTaken",
            type: "error",
            title: "Name Taken",
            message: `Name '${name}' is taken in room '${roomName}'.`,
        });
        delete socket.data.name;
        return false;
    }

    socket.join(roomName);
    socket.data.name = name;
    socket.data.room = roomName;

    socket.to(roomName).emit("stateUpdate", {
        ...room.toJSON(),
    });

    socket.emit("stateUpdate", {
        ...room.toJSON(),
        config: room.config,
        isJoined: true,
        myName: socket.data.name,
        myVote: client.vote || null,
    });

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
        // No clients left in room but agenda still present, so wait 30min to avoid losing state
        if (room.agendaQueue.length > 0) {
            room.setDeferredDeletionFrom(roomStates);
        } else {
            roomStates.delete(roomName);
        }
    } else {
        io.to(roomName).emit("stateUpdate", { ...room.toJSON() });
    }
};

io.on("connection", (socket) => {
    // console.log("CONNECT", socket.recovered, socket.data.name, socket.data.room);
    // if (socket.recovered && socket.data.name && socket.data.room) {
    //     roomJoin(socket, socket.data.name, socket.data.room);
    // }

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
        roomExitCleanup(roomName);
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
        room.setAgendaQueue(agendaQueue);
        io.to(roomName).emit("stateUpdate", { agendaQueue: room.agendaQueue });
    });

    socket.on("setConfig", ({ config = {} }) => {
        const { isValid, roomName, room } = validateSocket(socket, true);
        if (!isValid) return;
        room.updateConfig(config);
        io.to(roomName).emit("stateUpdate", { config: room.config });
    });

    socket.on("setHost", ({ name }) => {
        const { isValid, roomName, room } = validateSocket(socket, true);
        if (!isValid) return;
        room.setHost(name);
        io.to(roomName).emit("stateUpdate", { ...room.toJSON() });
    });

    socket.on("disconnect", (reason) => {
        const { clientName, roomName, room } = validateSocket(socket);
        // console.log("DISCONNECTING", isValid, clientName, roomName, !!room);
        if (!room) {
            // Done
            return;
        }

        if (!clientName) {
            // Left room already, e.g. via exit event
            roomExitCleanup(roomName);
        } else {
            // Left room due to disconnection
            room.setClientExitTimeout(clientName, () => roomExitCleanup(roomName, clientName));
            io.to(roomName).emit("stateUpdate", { ...room.toJSON() });
        }
    });

    // Uncomment to test disconnection/reconnection resume stuff on localhost
    // setTimeout(() => {
    //     socket.conn.close();
    // }, 10000);
});

io.engine.on("connection_error", (err) => {
    console.error("Connection Error", err);
});
