import React from "react";
import debounce from "lodash.debounce";
import { TopNav } from "./TopNav";
import { IntroductionForm, getRoomFromURLObject } from "./IntroductionForm";
import { HostControls } from "./HostControls";
import { UserControls } from "./UserControls";
import { PeerVotes } from "./PeerVotes";
import { VotingCards } from "./VotingCards";
import { CurrentAgenda } from "./CurrentAgenda";

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
});

let io = null;

export class App extends React.Component {
    constructor(props) {
        super(props);
        const noDblClicks = { leading: true, trailing: false };
        this.onJoin = debounce(this.onJoin.bind(this), 1000, noDblClicks);
        this.onExit = debounce(this.onExit.bind(this), 1000, noDblClicks);
        this.onVotingCardSelect = this.onVotingCardSelect.bind(this);
        this.onToggleSpectating = debounce(this.onToggleSpectating.bind(this), 500, noDblClicks);
        this.onToggleShowingVotes = this.onToggleShowingVotes.bind(this);
        this.onResetVotes = debounce(this.onResetVotes.bind(this), 1000, noDblClicks);
        this.onSetAgendaQueue = debounce(this.onSetAgendaQueue.bind(this), 1000);

        this.state = createInitialState();
    }

    componentDidMount() {
        const { appVersion, commitHash, url } = this.props;
        console.info("Version Info", appVersion, commitHash);

        const initialize = async () => {
            const { io: loadedIO } = await import(
                /* webpackPrefetch: true */
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
                const { myName, room, clientsState } = this.state;
                const myClientState = clientsState.find(({ name }) => name === myName);
                const { isSpectating = false } = myClientState || {};
                // If reconnection attempt, try re-join previous room
                if (myName && room) {
                    this.onJoin(myName, { room, isSpectating });
                }
                this.setState({ isConnected: true });
            });
            this.socket.on("stateUpdate", (stateUpdate) => {
                if (stateUpdate.room) {
                    // Keep URL in sync with roof
                    if (getRoomFromURLObject(url) !== stateUpdate.room) {
                        window.history.pushState(
                            null,
                            document.title,
                            `/room/${stateUpdate.room}/`
                        );
                        /**
                         * Gets caught by Page component's listener and updates `url` prop.
                         *
                         * @see https://stackoverflow.com/questions/3522090/event-when-window-location-href-changes#answer-33668370
                         * Approach fits because we're in control of the pushStates/navigation; could be encapsulated/reusable
                         * by wrapping in a 'navigate' function. Might change this approach later in favor of MutationObserver
                         * (other answer) or maybe a custom 'pushstate' event (lol) after more research.
                         */
                        window.dispatchEvent(new Event("popstate"));
                    }
                }
                this.setState(
                    (existingState) => ({
                        ...existingState,
                        ...stateUpdate,
                    })
                    // () => console.log("Updated State", stateUpdate, "\n", this.state)
                );
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

    onJoin(name, { room = null, isSpectating = false } = {}) {
        const payload = { name, isSpectating };
        if (room) {
            payload.room = room;
        }
        this.socket.emit("join", payload);
    }

    onExit() {
        this.socket.emit("exit");
    }

    onVotingCardSelect(vote) {
        const newVote = vote === this.state.myVote ? null : vote;
        this.socket.emit("vote", { vote: newVote });
    }

    onToggleSpectating() {
        this.socket.emit("toggleSpectating");
    }

    onToggleShowingVotes() {
        this.socket.emit("toggleShowingVotes");
    }

    onResetVotes() {
        this.socket.emit("resetVotes");
    }

    onSetAgendaQueue(agendaQueue) {
        this.socket.emit("setAgendaQueue", { agendaQueue });
    }

    render() {
        const { url } = this.props;
        const {
            isConnected,
            isJoined,
            clientsState,
            currentHost,
            isShowingVotes,
            myVote,
            myName,
            agendaQueue,
            agendaHistory,
        } = this.state;
        const roomFromURL = getRoomFromURLObject(url);
        const isCurrentHostMe = currentHost === myName;

        return (
            <>
                <TopNav
                    brandContent={
                        isJoined && (
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    this.onExit();
                                }}
                            >
                                <i className="fa-solid fa-angles-left me-2" />
                                Exit
                            </a>
                        )
                    }
                    href={!isJoined && roomFromURL ? "/" : null}
                >
                    {isJoined && (
                        <UserControls
                            clientsState={clientsState}
                            onChange={this.onToggleSpectating}
                            myName={myName}
                        />
                    )}
                </TopNav>

                <div id="content-area">
                    {!isConnected && <div className="connecting-container">Connecting</div>}

                    {!isJoined ? (
                        <IntroductionForm onJoin={this.onJoin} roomFromURL={roomFromURL} />
                    ) : (
                        <>
                            <CurrentAgenda
                                agendaQueue={agendaQueue}
                                agendaHistory={agendaHistory}
                            />

                            <PeerVotes
                                clientsState={clientsState}
                                isShowingVotes={isShowingVotes}
                            />
                            <VotingCards
                                onVotingCardSelect={this.onVotingCardSelect}
                                isShowingVotes={isShowingVotes}
                                myVote={myVote}
                            />
                            {isCurrentHostMe && (
                                <HostControls
                                    isShowingVotes={isShowingVotes}
                                    agendaQueue={agendaQueue}
                                    onToggleShowingVotes={this.onToggleShowingVotes}
                                    onResetVotes={this.onResetVotes}
                                    onSetAgendaQueue={this.onSetAgendaQueue}
                                />
                            )}
                        </>
                    )}
                </div>
            </>
        );
    }
}
