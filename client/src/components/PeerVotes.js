import React from 'react';
import clsx from 'clsx';
import { VoteValue } from './VoteValue';

export const PeerVotes = React.memo(({
    isShowingVotes = false,
    clientsState
}) => {
    return (
        <div
            className={clsx(
                "poker-cards-container",
                "peer-votes-section",
                isShowingVotes && "votes-shown"
            )}
        >
            {
                Object.entries(clientsState)
                    .map(([name, clientObject]) =>
                        <PeerVoteCard name={name} vote={clientObject.vote} />
                    )
            }
        </div>
    );
});

const PeerVoteCard = ({ name, vote }) => {
    return (
        <div className={clsx(
            "poker-card",
            "peer-vote-card"
        )}>
            <VoteValue value={vote} className="vote"/>
            <span className="name">{ name }</span>
        </div>
    );
};