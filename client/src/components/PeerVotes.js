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
    if (firstVoteFound === null || firstVoteFound === "PASS") {
        return false;
    }
    for (let i = 1; i < clientsLen; i++) {
        if (clientsState[i].vote !== firstVoteFound) return false;
    }
    return true;
}

export const PeerVotes = ({ isShowingVotes = false, clientsState }) => {
    const presentClients = clientsState.filter(({ isSpectating }) => !isSpectating);
    const allClientsShowingSameVote = isShowingVotes && checkAllVotesTheSame(presentClients);
    return (
        <div className="poker-cards-wrapper-container peer-votes-wrapper-section">
            <div
                className={clsx(
                    "poker-cards-container",
                    "peer-votes-section",
                    isShowingVotes && "votes-shown"
                )}
            >
                {allClientsShowingSameVote && <Confetti />}
                {presentClients.map((clientState) => (
                    <PeerVoteCard key={clientState.name} clientState={clientState} />
                ))}
            </div>
        </div>
    );
};

const PeerVoteCard = React.memo(({ clientState: { name, vote, isExiting } }) => {
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
});
