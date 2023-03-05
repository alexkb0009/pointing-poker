import React from 'react';
import clsx from 'clsx';
import { POKER_CARD_OPTIONS } from '../constants';

export const VotingCards = ({
    disabled = false,
    onVotingCardSelect,
    myVote
}) => {
    return (
        <div
            className="voting-cards-container"
        >
            { POKER_CARD_OPTIONS.map((option) => {
                const isSelected = myVote === option;
                return (
                    <VotingCard
                        option={option}
                        onVotingCardSelect={onVotingCardSelect}
                        disabled={disabled}
                        isSelected={isSelected}
                    />
                );
            }) }
        </div>
    );
};

const VotingCard = React.memo(({
    option,
    onVotingCardSelect,
    disabled = false,
    isSelected
}) => {
    const isNumber = typeof option === "number";

    const onClick = (e) => {
        e.stopPropagation();
        onVotingCardSelect(option);
    };

    // TODO: Map other opts to icons.
    return (
        <button
            className={clsx(
                "voting-card",
                isSelected && "selected",
                isNumber && "number-card"
            )}
            onClick={onClick}
            type="button"
            aria-label="Point Voting Card"
            disabled={disabled}
        >
            { option }
        </button>
    );
});