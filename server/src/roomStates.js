/**
 * Current state of the 'poker game'.
 *
 * @todo
 * Figure out what type of SocketIO adapter to use (MongoDB, Redis, ...)
 * for scaling and then piggyback on that to store room states.
 *
 * @type {Map.<string,RoomState>}
 */
export const roomStates = new Map();
