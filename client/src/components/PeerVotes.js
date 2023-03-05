import React from 'react';

export const PeerVotes = React.memo(({
    isShowingVotes = false,
    clientsState
}) => {
    return (
        <div className="peer-votes-section">
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
        <div className="peer-vote-card">
            <span className="vote">{ vote }</span>
            <span className="name">{ name }</span>
        </div>
    );
};