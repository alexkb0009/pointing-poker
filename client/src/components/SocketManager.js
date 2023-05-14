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
    // This is managed by UI only. Maybe should be separated out.. another day.
    socketAlerts: {},
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
        this.onSetHost = this.onSetHost.bind(this);
        this.dismissAlert = this.dismissAlert.bind(this);

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

                // If reconnection attempt, try re-join previous room
                if (myName && roomName) {
                    const myClientState = clientsState.find(({ name }) => name === myName);
                    this.onJoin(myName, {
                        room: roomName,
                        isSpectating: myClientState?.isSpectating || false,
                    });
                } else {
                    // Maybe try autojoin anyway..
                    const nameFromLocalStorage = window.localStorage.getItem("myName");
                    const isSpectatingFromLocalStorage = JSON.parse(
                        window.localStorage.getItem("isSpectating")
                    );
                    if (roomFromURL && nameFromLocalStorage) {
                        this.onJoin(nameFromLocalStorage, {
                            room: roomFromURL,
                            isSpectating: isSpectatingFromLocalStorage,
                        });
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
                if (!alert.id) throw new Error("No alert ID present");
                this.setState(function (existingState) {
                    const instanceCount = existingState.socketAlerts[alert.id]?.instanceCount || 0;
                    if (instanceCount > 0) {
                        console.warn("Repeat of alert", alert.id);
                    }
                    return {
                        socketAlerts: {
                            ...existingState.socketAlerts,
                            [alert.id]: { alert, instanceCount: instanceCount + 1 },
                        },
                    };
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
        this.socket.volatile.emit("vote", { vote });
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

    onSetHost(name) {
        this.socket.emit("setHost", { name });
    }

    /** @todo Toast component or something. For now only used as server-side error on IntroductionForm */
    dismissAlert(alertID) {
        this.setState((existingState) => {
            const socketAlerts = { ...existingState.socketAlerts };
            delete socketAlerts[alertID];
            return { socketAlerts };
        });
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
            onSetHost: this.onSetHost,
            dismissAlert: this.dismissAlert,
        };

        return (
            <SocketManagerContext.Provider value={contextValues}>
                {children}
            </SocketManagerContext.Provider>
        );
    }
}
