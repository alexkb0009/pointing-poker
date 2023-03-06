import React from 'react';
import { io } from 'socket.io-client';
import { IntroductionForm } from './IntroductionForm';
import { HostControls } from './HostControls';
import { PeerVotes } from './PeerVotes';
import { VotingCards } from './VotingCards';


const createInitialState = () => ({
    isConnected: false,
    isJoined: false,
    clientsState: {},
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
        this.socket = io();
        this.socket.on("connect", () => {
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
                console.log("Updated State", stateUpdate, '\n', this.state);
            })
        });
        this.socket.on("disconnect", () => {
            this.setState({ isConnected: false, isJoined: false });
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
        this.socket.emit("vote", { vote });
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
            isJoined,
            clientsState,
            currentHost,
            isShowingVotes,
            myVote,
            myName,
        } = this.state;
        const votingDisabled = !this.socket || isShowingVotes;
        const isCurrentHostMe = currentHost === myName;
        return (
            <>
                <h1 id="page-title">Planning Poker</h1>
                {!isJoined ? (
                    !isConnected ? (
                        <h4>No Connection Present</h4>
                    ) : (
                        <IntroductionForm onJoin={this.onJoin} />
                    )
                ) : (
                    <>
                        { isCurrentHostMe && (
                            <HostControls
                                isShowingVotes={isShowingVotes}
                                onToggleShowingVotes={this.onToggleShowingVotes}
                                onResetVotes={this.onResetVotes}
                            />
                        )}
                        <PeerVotes
                            clientsState={clientsState}
                            isShowingVotes={isShowingVotes}
                        />
                        <VotingCards
                            onVotingCardSelect={this.onVotingCardSelect}
                            disabled={votingDisabled}
                            myVote={myVote}
                        />
                    </>
                )}
            </>
        );
    }

}