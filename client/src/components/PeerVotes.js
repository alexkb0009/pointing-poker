import clsx from 'clsx';
import React from 'react';

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
    const isNumberOrUnknown = vote === "?" || typeof vote === "number";
    return (
        <div className={clsx(
            "poker-card",
            "peer-vote-card"
        )}>
            <span className={clsx(
                "vote",
                isNumberOrUnknown && "number-vote",
            )}>
                { vote || ' ' }
            </span>
            <span className="name">{ name }</span>
        </div>
    );
};