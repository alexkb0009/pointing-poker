import React, { useLayoutEffect, useRef } from "react";
import clsx from "clsx";
import { POKER_CARD_OPTIONS } from "../constants";
import { VoteValue } from "./VoteValue";

export const VotingCards = ({ isShowingVotes, onVotingCardSelect, myVote, config }) => {
    return (
        <div className={clsx("voting-cards-container", "poker-cards-container")}>
            {POKER_CARD_OPTIONS[config.cardDeck].values.map((option) => {
                const isSelected = myVote === option;
                return (
                    <VotingCard
                        key={option}
                        option={option}
                        onVotingCardSelect={onVotingCardSelect}
                        isShowingVotes={isShowingVotes}
                        isSelected={isSelected}
                        config={config}
                    />
                );
            })}
        </div>
    );
};

const VotingCard = React.memo(
    ({ option, onVotingCardSelect, isShowingVotes, isSelected, config }) => {
        const ref = useRef();
        useLayoutEffect(() => {
            if (isShowingVotes && isSelected) {
                ref.current.blur();
            }
        }, [isShowingVotes, isSelected]);

        const onClick = (e) => {
            e.stopPropagation();
            onVotingCardSelect(option);
            window.gtag("event", "select_item", {
                items: [
                    {
                        item_id: option.toString(),
                    },
                ],
                item_list_id: "voting-cards",
                item_list_name: "Voting Cards",
            });
        };

        return (
            <div className={clsx("voting-card-container")}>
                <button
                    className={clsx("poker-card", "voting-card", isSelected && "selected")}
                    onClick={onClick}
                    type="button"
                    aria-label={option}
                    ref={ref}
                    disabled={!config.isVotingAfterShowAllowed ? isShowingVotes : false}
                >
                    <VoteValue value={option} config={config} />
                </button>
            </div>
        );
    }
);
