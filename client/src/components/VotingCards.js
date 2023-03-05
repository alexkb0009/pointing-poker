import React from 'react';
import clsx from 'clsx';
import { POKER_CARD_OPTIONS } from '../constants';
import { VoteValue } from './VoteValue';

export const VotingCards = ({
    disabled = false,
    onVotingCardSelect,
    myVote
}) => {
    return (
        <div
            className={clsx(
                "voting-cards-container",
                "poker-cards-container"
            )}
        >
            { POKER_CARD_OPTIONS.map((option) => {
                const isSelected = myVote === option;
                return (
                    <VotingCard
                        key={option}
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
    const onClick = (e) => {
        e.stopPropagation();
        onVotingCardSelect(option);
    };

    // TODO: Map other opts to icons.
    return (
        <button
            className={clsx(
                "poker-card",
                "voting-card",
                isSelected && "selected",
            )}
            onClick={onClick}
            type="button"
            aria-label={option}
            disabled={disabled}
        >
            <VoteValue value={option}/>
        </button>
    );
});