import React from "react";
import { io } from "socket.io-client";
import debounce from "lodash.debounce";
import { IntroductionForm } from "./IntroductionForm";
import { HostControls } from "./HostControls";
import { UserControls } from "./UserControls";
import { PeerVotes } from "./PeerVotes";
import { VotingCards } from "./VotingCards";

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
});

export class App extends React.Component {
    constructor(props) {
        super(props);
        const debounceOpts = { leading: true, trailing: false };
        this.onJoin = debounce(this.onJoin.bind(this), 1000, debounceOpts);
        this.onVotingCardSelect = this.onVotingCardSelect.bind(this);
        this.onToggleSpectating = debounce(this.onToggleSpectating.bind(this), 500, debounceOpts);
        this.onToggleShowingVotes = this.onToggleShowingVotes.bind(this);
        this.onResetVotes = debounce(this.onResetVotes.bind(this), 1000, debounceOpts);
        this.onSetAgendaQueue = debounce(this.onSetAgendaQueue.bind(this), 1000, debounceOpts);

        this.state = createInitialState();
    }

    componentDidMount() {
        const { appVersion, commitHash } = this.props;
        console.info("Version Info", appVersion, commitHash);
        this.socket = io({
            transports: ["websocket", "polling"],
            closeOnBeforeunload: false,
            // autoConnect: false
        });
        this.socket.on("connect_error", () => {
            this.socket.io.opts.transports = ["polling", "websocket"];
        });
        this.socket.on("connect", () => {
            const { myName, room } = this.state;
            // If reconnection attempt, try re-join previous room
            if (myName && room) {
                this.onJoin(myName, room);
            }
            this.setState({ isConnected: true });
        });
        this.socket.on("stateUpdate", (stateUpdate) => {
            if (stateUpdate.room) {
                window.history.replaceState(null, document.title, `/room/${stateUpdate.room}/`);
            }
            this.setState(
                (existingState) => ({
                    ...existingState,
                    ...stateUpdate,
                }),
                () => {
                    // console.log("Updated State", stateUpdate, '\n', this.state);
                }
            );
        });
        this.socket.on("disconnect", () => {
            this.setState({ isConnected: false });
        });
        window.addEventListener("beforeunload", () => {
            this.setState(createInitialState());
        });
    }

    onJoin(name, room = null) {
        const payload = { name };
        if (room) {
            payload.room = room;
        }
        this.socket.emit("join", payload);
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
        const {
            isConnected,
            isJoined,
            clientsState,
            currentHost,
            isShowingVotes,
            myVote,
            myName,
            agendaQueue,
        } = this.state;
        const isCurrentHostMe = currentHost === myName;
        const agendaQueueLen = agendaQueue.length;
        return (
            <>
                <div className="top-nav d-flex">
                    <h3 id="page-title" className="container-fluid m-0 py-2">
                        Planning Poker
                    </h3>
                    {isJoined && (
                        <UserControls
                            clientsState={clientsState}
                            onChange={this.onToggleSpectating}
                            myName={myName}
                        />
                    )}
                </div>

                <div id="content-area">
                    {!isConnected && <div className="connecting-container">Connecting</div>}

                    {!isJoined ? (
                        <div className="container-fluid py-2">
                            <IntroductionForm onJoin={this.onJoin} />
                        </div>
                    ) : (
                        <>
                            {agendaQueueLen > 0 && (
                                <div className="container-fluid bg-white py-2">
                                    <label className="fw-bold">Current Item</label>
                                    <p className="my-0 text-truncate">{agendaQueue[0]}</p>
                                </div>
                            )}

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
