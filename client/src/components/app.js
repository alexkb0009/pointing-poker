import React from 'react';
import { io } from 'socket.io-client';
import { IntroductionForm } from './IntroductionForm';
import { HostControls } from './HostControls';
import { PeerVotes } from './PeerVotes';
import { VotingCards } from './VotingCards';


export class App extends React.Component {

    constructor(props){
        super(props);
        this.onJoin = this.onJoin.bind(this);
        this.onVotingCardSelect = this.onVotingCardSelect.bind(this);
        this.onToggleShowingVotes = this.onToggleShowingVotes.bind(this);
        this.onResetVotes = this.onResetVotes.bind(this);

        this.state = {
            isConnected: false,
            isJoined: false,
            clientsState: {},
            currentHost: null,
            isShowingVotes: false,
            myName: null,
            myVote: null
        };
    }

    componentDidMount(){
        this.socket = io();
        this.socket.on("connect", () => {
            this.setState({ isConnected: true });
        });
        this.socket.on("stateUpdate", (stateUpdate) => {
            this.setState((existingState) => ({
                ...existingState,
                ...stateUpdate
            }), () => {
                console.log("Updated State", this.state);
            })
        });
        this.socket.on("disconnect", () => {
            this.setState({ isConnected: false, isJoined: false });
        });
    }

    onJoin(name){
        this.socket.emit("join", { name });
        this.setState({ myName: name });
    }

    onVotingCardSelect(vote){
        this.socket.emit("vote", { vote });
        this.setState({ myVote: vote });
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