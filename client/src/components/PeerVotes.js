import React from "react";
import clsx from "clsx";
import { VoteValue } from "./VoteValue";
import { Confetti } from "./Confetti";

function checkAllVotesTheSame(clientsState) {
    const clientsLen = clientsState.length;
    if (clientsLen < 2) {
        return false;
    }
    const firstVoteFound = clientsState[0].vote;
    for (let i = 1; i < clientsLen; i++) {
        if (clientsState[i].vote !== firstVoteFound) return false;
    }
    return true;
}

export const PeerVotes = ({ isShowingVotes = false, clientsState }) => {
    const allClientsShowingSameVote =
        isShowingVotes && checkAllVotesTheSame(clientsState);
    return (
        <div
            className={clsx(
                "poker-cards-container",
                "peer-votes-section",
                "py-3",
                isShowingVotes && "votes-shown"
            )}
        >
            <Confetti enabled={allClientsShowingSameVote} />
            {clientsState.map((clientState) => (
                <PeerVoteCard
                    key={clientState.name}
                    clientState={clientState}
                />
            ))}
        </div>
    );
};

const PeerVoteCard = React.memo(
    ({ clientState: { name, vote, isExiting } }) => {
        const hasPendingVote = vote === "HAS_VOTE";
        return (
            <div
                className={clsx(
                    "poker-card",
                    "peer-vote-card",
                    hasPendingVote && "has-pending-vote",
                    isExiting && "is-exiting"
                )}
            >
                <VoteValue value={vote} className="vote" />
                <span className={clsx("name", "text-truncate")}>{name}</span>
            </div>
        );
    }
);
