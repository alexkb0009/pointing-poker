import React from "react";

export const SocketManagerContext = React.createContext();

const createInitialState = () => ({
    isConnected: false,
    // The following are sent down by socket stateUpdate events
    isJoined: false,
    clientsState: [],
    currentHost: null,
    isShowingVotes: false,
    myName: null,
    myVote: null,
    agendaQueue: [],
    agendaHistory: [],
    roomName: null,
    config: {},
    // This is managed by UI only
    socketAlerts: [],
});

let io = null;

export class SocketManager extends React.Component {
    constructor(props) {
        super(props);
        this.onJoin = this.onJoin.bind(this);
        this.onExit = this.onExit.bind(this);
        this.onVotingCardSelect = this.onVotingCardSelect.bind(this);
        this.onToggleSpectating = this.onToggleSpectating.bind(this);
        this.onToggleShowingVotes = this.onToggleShowingVotes.bind(this);
        this.onResetVotes = this.onResetVotes.bind(this);
        this.onNextAgendaItem = this.onNextAgendaItem.bind(this);
        this.onSetAgendaQueue = this.onSetAgendaQueue.bind(this);
        this.onSetConfig = this.onSetConfig.bind(this);

        this.state = createInitialState();
    }

    componentDidMount() {
        const initialize = async () => {
            const { io: loadedIO } = await import(
                /* webpackPreload: true */
                /* webpackChunkName: "socket-io-client" */
                "socket.io-client"
            );
            io = loadedIO;
            this.socket = io({
                transports: ["websocket", "polling"],
                closeOnBeforeunload: false,
            });
            this.socket.on("connect_error", (err) => {
                // this.socket.io.opts.transports = ["polling", "websocket"];
                console.error("Connection Error", err);
            });
            this.socket.on("connect", () => {
                const { myName, roomName, clientsState } = this.state;
                const { roomFromURL } = this.props;
                const myClientState = clientsState.find(({ name }) => name === myName);
                const { isSpectating = false } = myClientState || {};

                // If reconnection attempt, try re-join previous room
                if (myName && roomName) {
                    this.onJoin(myName, { room: roomName, isSpectating });
                } else {
                    // Maybe try autojoin anyway..
                    const nameFromLocalStorage = window.localStorage.getItem("myName");
                    if (roomFromURL && nameFromLocalStorage) {
                        this.onJoin(nameFromLocalStorage, { room: roomFromURL, isSpectating });
                    }
                }

                this.setState({ isConnected: true });
            });

            this.socket.on("stateUpdate", (stateUpdate) => {
                let newRoom = false;
                this.setState(
                    (existingState) => {
                        newRoom =
                            stateUpdate.roomName && stateUpdate.roomName !== existingState.roomName;
                        return {
                            ...existingState,
                            ...stateUpdate,
                        };
                    },
                    () => {
                        if (newRoom) {
                            // Keep URL in sync with room
                            if (this.props.roomFromURL !== this.state.roomName) {
                                window.history.pushState(
                                    null,
                                    document.title,
                                    `/room/${this.state.roomName}/`
                                );
                                /**
                                 * Gets caught by Page component's listener and updates `url` prop.
                                 *
                                 * @see https://stackoverflow.com/questions/3522090/event-when-window-location-href-changes#answer-33668370
                                 * Approach fits because we're in control of the pushStates/navigation; could be encapsulated/reusable
                                 * by wrapping in a 'navigate' function. Might change this approach later in favor of MutationObserver
                                 * (other answer) or maybe a custom 'pushstate' event (lol) after more research.
                                 */
                                window.dispatchEvent(new PopStateEvent("pushstate"));
                            }
                            window.gtag("event", "join_group", {
                                group_id: this.state.roomName,
                            });
                        }
                    }
                );
            });

            this.socket.on("alert", (alert) => {
                this.setState(function (existingState) {
                    return { socketAlerts: [...existingState.socketAlerts, alert] };
                });
            });

            this.socket.on("disconnect", () => {
                this.setState({ isConnected: false });
            });

            window.addEventListener("beforeunload", () => {
                this.setState(createInitialState());
            });
        };
        initialize();
    }

    componentDidUpdate(pastProps) {
        const { url, roomFromURL } = this.props;
        const { roomName } = this.state;
        if (pastProps.url !== url && roomName) {
            const isLeavingRoomURL = roomFromURL !== roomName;
            if (isLeavingRoomURL) {
                this.onExit();
            }
        }
    }

    onJoin(name, { room = null, isSpectating = false } = {}) {
        // toast.dismiss("joinNameError");
        const payload = { name, isSpectating };
        if (room) {
            payload.room = room;
        }
        this.socket.volatile.emit("join", payload);
    }

    onExit() {
        this.socket.emit("exit");
    }

    onVotingCardSelect(vote) {
        const newVote = vote === this.state.myVote ? null : vote;
        this.socket.volatile.emit("vote", { vote: newVote });
    }

    onToggleSpectating() {
        this.socket.volatile.emit("toggleSpectating");
    }

    onToggleShowingVotes() {
        this.socket.volatile.emit("toggleShowingVotes");
    }

    onResetVotes() {
        this.socket.volatile.emit("resetVotes");
    }

    onNextAgendaItem() {
        this.socket.volatile.emit("nextAgendaItem");
    }

    onSetAgendaQueue(agendaQueue) {
        this.socket.emit("setAgendaQueue", { agendaQueue });
    }

    onSetConfig(config) {
        this.socket.emit("setConfig", { config });
    }

    render() {
        const { children } = this.props;

        const contextValues = {
            ...this.state,
            onJoin: this.onJoin,
            onExit: this.onExit,
            onVotingCardSelect: this.onVotingCardSelect,
            onToggleSpectating: this.onToggleSpectating,
            onToggleShowingVotes: this.onToggleShowingVotes,
            onResetVotes: this.onResetVotes,
            onNextAgendaItem: this.onNextAgendaItem,
            onSetAgendaQueue: this.onSetAgendaQueue,
            onSetConfig: this.onSetConfig,
        };

        return (
            <SocketManagerContext.Provider value={contextValues}>
                {children}
            </SocketManagerContext.Provider>
        );
    }
}
