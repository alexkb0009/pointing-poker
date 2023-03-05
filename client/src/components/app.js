import React from 'react';
import { io } from 'socket.io-client';
import { IntroductionForm } from './IntroductionForm';
import { PeerVotes } from './PeerVotes';
import { VotingCards } from './VotingCards';


export class App extends React.Component {

    constructor(props){
        super(props);
        this.onJoin = this.onJoin.bind(this);
        this.onVotingCardSelect = this.onVotingCardSelect.bind(this);

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
            this.setState({ isConnected: false });
        });
    }

    onJoin(name){
        this.socket.emit("join", { name });
        this.setState({ myName: name });
    }

    onVotingCardSelect(vote){
        this.socket.emit("clientVote", { vote });
    }

    render(){
        const { isShowingVotes, isJoined, currentHost } = this.state;
        const votingDisabled = !this.socket || isShowingVotes;
        return (
            <>
                {!isJoined ? (
                    <IntroductionForm onJoin={this.onJoin} />
                ) : (
                    <>
                        <h4>Current host: { currentHost }</h4>
                        <PeerVotes
                            clientsState={clientsState}
                            isShowingVotes={isShowingVotes}
                        />
                    </>
                )}
                <VotingCards
                    onVotingCardSelect={this.onVotingCardSelect}
                    disabled={votingDisabled}
                />
            </>
        );
    }

}