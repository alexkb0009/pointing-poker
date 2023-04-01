/**
 * @todo
 * Possibly make 'client' into a class as well, but no real purpose at this point.
 */

export class RoomState {
    #config;
    #clientsState;
    #originalHost;
    #isShowingVotes;
    #agendaHistory;
    #agendaQueue;
    #roomDeletionTimeout;

    constructor(roomName, config) {
        this.roomName = roomName;
        this.#config = {
            cardDeck: "default",
            isVotingAfterShowAllowed: true,
            areCardsShownAutomatically: true,
            ...config,
        };
        this.#clientsState = [];
        this.#originalHost = null;
        this.#isShowingVotes = false;
        this.#agendaHistory = [];
        this.#agendaQueue = [];
    }

    get currentHost() {
        if (this.#clientsState.length === 0) return null;
        return this.#clientsState[0].name;
    }

    get clientsCount() {
        return this.#clientsState.length;
    }

    get visibleClientsState() {
        return this.#clientsState.map((client) => this.visibleClient(client));
    }

    get config() {
        return { ...this.#config };
    }

    visibleClient(client) {
        const { name, vote, exitTimeout, isSpectating } = client;
        return {
            name,
            vote: this.#isShowingVotes ? vote : vote === null ? "?" : "HAS_VOTE",
            isExiting: exitTimeout !== null,
            isSpectating,
        };
    }

    #getClient(clientName) {
        return this.#clientsState.find(({ name }) => name === clientName) || null;
    }

    getClient(clientName) {
        const client = this.#getClient(clientName);
        if (!client) {
            console.warn("Client no longer in room", clientName);
        }
        return this.visibleClient(client);
    }

    getClientNameBySocketId(socketId) {
        const client = this.#clientsState.find(({ socketId: sid }) => sid === socketId) || null;
        if (!client) {
            console.warn("Client no longer in room", socketId);
        }
        return client?.name;
    }

    #updateIsShowingVotes() {
        const currentlyShowingVotes = this.#isShowingVotes;
        if (currentlyShowingVotes || !this.config.areCardsShownAutomatically) {
            return false;
        }

        const areAllVotesIn = this.#clientsState
            .filter(({ isSpectating }) => !isSpectating)
            .every(({ vote }) => vote !== null);

        if (!areAllVotesIn) {
            return false;
        }

        this.#isShowingVotes = true;
        return true;
    }

    toJSON() {
        return {
            clientsState: this.visibleClientsState,
            currentHost: this.currentHost,
            isShowingVotes: this.#isShowingVotes,
            agendaHistory: this.#agendaHistory,
            agendaQueue: this.#agendaQueue,
            roomName: this.roomName,
        };
    }

    /** Host-only */
    updateConfig(configUpdate) {
        this.#config = { ...this.#config, ...configUpdate };
        if ("areCardsShownAutomatically" in configUpdate) {
            this.#updateIsShowingVotes();
        }
    }

    addClient(clientName, { isSpectating = false, timeJoined = null, socketId }) {
        if (this.#clientsState.length === 0) {
            this.#originalHost = clientName;
        }
        const existingClient = this.#clientsState.find(({ name }) => name === clientName);
        if (existingClient) {
            if (existingClient.exitTimeout) {
                // Resume session as this name/client
                clearTimeout(existingClient.exitTimeout);
                existingClient.exitTimeout = null;

                // Update some fields
                existingClient.isSpectating = isSpectating;
                existingClient.socketId = socketId;

                // Editable (vote not masked, etc).
                return existingClient;
            } else {
                return null;
            }
        } else {
            const newClient = {
                name: clientName,
                vote: null,
                timeJoined,
                exitTimeout: null,
                isSpectating,
                socketId,
            };
            if (clientName === this.#originalHost) {
                // Re-gain host
                this.#clientsState.unshift(newClient);
            } else {
                this.#clientsState.push(newClient);
            }
            return newClient;
        }
    }

    removeClient(clientName) {
        const clientStateIndex =
            clientName && this.#clientsState.findIndex(({ name }) => name === clientName);
        if (clientStateIndex === -1) {
            return false;
        }
        this.#clientsState.splice(clientStateIndex, 1);
        this.#updateIsShowingVotes();
        return true;
    }

    /** Host-only */
    resetRoomVotes() {
        this.#isShowingVotes = false;
        this.#clientsState.forEach((clientStateObj) => {
            clientStateObj.vote = null;
        });
    }

    setClientVote(clientName, vote) {
        const client = this.#getClient(clientName);
        if (!client) {
            return false;
        }
        client.vote = vote;
        this.#updateIsShowingVotes();
        return true;
    }

    /** Host-only */
    setHost(clientName) {
        const clientIndex = this.#clientsState.findIndex(({ name }) => name === clientName);
        if (clientIndex === -1) {
            return false;
        }
        const nextClientsState = [...this.#clientsState];
        const [client] = nextClientsState.splice(clientIndex, 1);
        nextClientsState.unshift(client);
        this.#clientsState = nextClientsState;
        return true;
    }

    /** Host-only */
    toggleShowingVotes() {
        this.#isShowingVotes = !this.#isShowingVotes;
        const changedToPassVotes = [];
        if (this.#isShowingVotes) {
            this.#clientsState
                .filter(({ isSpectating }) => !isSpectating)
                .forEach((clientStateObj) => {
                    // Default non-votes to "PASS"
                    if (!clientStateObj.vote) {
                        clientStateObj.vote = "PASS";
                        changedToPassVotes.push(clientStateObj.socketId);
                    }
                });
        }
        return changedToPassVotes;
    }

    toggleClientSpectating(clientName) {
        const client = this.#getClient(clientName);
        if (!client) {
            return;
        }
        client.isSpectating = !client.isSpectating;
        this.#updateIsShowingVotes();
    }

    get agendaQueue() {
        return this.#agendaQueue;
    }

    setAgendaQueue(agendaQueue = []) {
        if (Array.isArray(agendaQueue)) {
            this.#agendaQueue = agendaQueue;
        }
    }

    queueNextAgendaItem() {
        const agendaItemText = this.#agendaQueue.shift();
        const historyItem = {
            text: !agendaItemText
                ? null
                : agendaItemText.length <= 120
                ? agendaItemText
                : agendaItemText.slice(0, 117).trim() + "...",
            votes: this.#clientsState
                .filter(({ isSpectating }) => !isSpectating)
                .map(({ vote }) => vote),
        };
        this.#agendaHistory.push(historyItem);
        this.resetRoomVotes();
    }

    setClientExitTimeout(clientName, callback) {
        const client = this.#getClient(clientName);
        if (!client) {
            console.warn(`setClientExitTimeout: Client ${clientName} not in room ${this.roomName}`);
            return;
        }
        client.exitTimeout = setTimeout(() => {
            this.removeClient(clientName);
            callback && callback();
        }, 15000); // 15 Seconds
    }

    /** Implementation will change once scale horizontally, data be backed by DB.. */
    setDeferredDeletionFrom(roomStates) {
        this.#roomDeletionTimeout = setTimeout(() => {
            roomStates.delete(this.roomName);
        }, 30 * 60 * 1000); // 30 Minutes
    }

    cancelDeferredDeletion() {
        if (this.#roomDeletionTimeout) {
            clearTimeout(this.#roomDeletionTimeout);
        }
    }
}
