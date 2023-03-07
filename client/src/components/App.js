import React from 'react';
import { Manager } from 'socket.io-client';
import { IntroductionForm } from './IntroductionForm';
import { HostControls } from './HostControls';
import { PeerVotes } from './PeerVotes';
import { VotingCards } from './VotingCards';


const createInitialState = () => ({
    isConnected: false,
    // The following are sent down by socket stateUpdate events
    isJoined: false,
    clientsState: [],
    currentHost: null,
    isShowingVotes: false,
    myName: null,
    myVote: null
});

export class App extends React.Component {

    constructor(props){
        super(props);
        this.onJoin = this.onJoin.bind(this);
        this.onVotingCardSelect = this.onVotingCardSelect.bind(this);
        this.onToggleShowingVotes = this.onToggleShowingVotes.bind(this);
        this.onResetVotes = this.onResetVotes.bind(this);

        this.state = createInitialState();
    }

    componentDidMount(){
        this.manager = new Manager(window.location.host, {
            transports: ["websocket", "polling"],
            closeOnBeforeunload: false
        });
        this.socket = this.manager.socket("/", {});
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
            this.setState((existingState) => ({
                ...existingState,
                ...stateUpdate
            }), () => {
                // console.log("Updated State", stateUpdate, '\n', this.state);
            })
        });
        this.socket.on("disconnect", () => {
            this.setState({ isConnected: false, isJoined: false });

        });
        window.addEventListener('beforeunload', () => {
            this.setState(createInitialState());
        });
    }

    onJoin(name, room = null){
        const payload = { name };
        if (room) {
            payload.room = room;
        }
        this.socket.emit("join", payload);
    }

    onVotingCardSelect(vote){
        const newVote = vote === this.state.myVote ? null : vote;
        this.socket.emit("vote", { vote: newVote });
    }

    onToggleShowingVotes(){
        this.socket.emit("toggleShowingVotes");
    }

    onResetVotes(){
        this.socket.emit("resetVotes");
    }

    render(){
        const {
            isConnected,
            mounted,
            isJoined,
            clientsState,
            currentHost,
            isShowingVotes,
            myVote,
            myName,
        } = this.state;
        const isCurrentHostMe = currentHost === myName;
        return (
            <>
                <div className="container-fluid top-nav">
                    <h3 id="page-title" className="m-0 py-2">
                        Planning Poker
                    </h3>
                </div>
                {!isJoined ? (
                    <div className="container-fluid py-2">
                        {!isConnected ? (
                            <h4>No Connection Present</h4>
                        ) : (
                            <IntroductionForm onJoin={this.onJoin} />
                        )}
                    </div>
                ) : (
                    <>
                        <PeerVotes
                            clientsState={clientsState}
                            isShowingVotes={isShowingVotes}
                        />
                        <VotingCards
                            onVotingCardSelect={this.onVotingCardSelect}
                            isShowingVotes={isShowingVotes}
                            myVote={myVote}
                        />
                        { isCurrentHostMe && (
                            <HostControls
                                isShowingVotes={isShowingVotes}
                                onToggleShowingVotes={this.onToggleShowingVotes}
                                onResetVotes={this.onResetVotes}
                            />
                        )}
                    </>
                )}
            </>
        );
    }

}