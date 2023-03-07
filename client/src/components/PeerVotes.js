import React from 'react';
import clsx from 'clsx';
import { VoteValue } from './VoteValue';

export const PeerVotes = ({
    isShowingVotes = false,
    clientsState
}) => {
    return (
        <div
            className={clsx(
                "poker-cards-container",
                "peer-votes-section",
                "py-3",
                isShowingVotes && "votes-shown"
            )}
        >
            { clientsState.map((clientState) =>
                <PeerVoteCard key={clientState.name} clientState={clientState} />
            )}
        </div>
    );
};

const PeerVoteCard = React.memo(({ clientState: { name, vote } }) => {
    const hasPendingVote = vote === "HAS_VOTE";
    return (
        <div className={clsx(
            "poker-card",
            "peer-vote-card",
            hasPendingVote && "has-pending-vote"
        )}>
            <VoteValue value={vote} className="vote"/>
            <span className={clsx("name", "text-truncate")}>{ name }</span>
        </div>
    );
});
