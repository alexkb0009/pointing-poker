import React from 'react';
import clsx from 'clsx';
import { POKER_CARD_OPTIONS } from '../constants';

export const VotingCards = ({
    disabled = false,
    onVotingCardSelect
}) => {
    return (
        <div
            className="voting-cards-container"
        >
            { POKER_CARD_OPTIONS.map((option) => {
                return (
                    <VotingCard
                        option={option}
                        onVotingCardSelect={onVotingCardSelect}
                        disabled={disabled}
                    />
                );
            }) }
        </div>
    );
};

const VotingCard = React.memo(({
    option,
    onVotingCardSelect,
    disabled = false
}) => {
    const isNumber = typeof option === "number";
    // TODO: Map other opts to icons.
    return (
        <button
            className={clsx(
                "voting-card",
                isNumber && "number-card"
            )}
            onClick={onVotingCardSelect}
            role="button"
            tabIndex="0"
            aria-label="Point Voting Card"
            disabled={disabled}
        >
            { option }
        </button>
    );
});