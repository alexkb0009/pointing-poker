import React from 'react';
import { VotingCards } from './VotingCards';


export class App extends React.Component {

    constructor(props){
        super(props);
        this.onVotingCardSelect = this.onVotingCardSelect.bind(this);
        this.state = {

        };
    }

    onVotingCardSelect(){
        console.log("TODO: send stuff over socket");
    }

    render(){
        return (
            <VotingCards
                onVotingCardSelect={this.onVotingCardSelect}
            />
        );
    }

}