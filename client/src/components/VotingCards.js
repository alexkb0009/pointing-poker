import React, { useLayoutEffect, useRef, useContext } from "react";
import clsx from "clsx";
import { SocketManagerContext } from "./SocketManager";
import { POKER_CARD_OPTIONS } from "../constants";
import { UIOptionsContext } from "./UIOptionsContext";
import { VoteValue } from "./VoteValue";

export const VotingCards = () => {
    const {
        isShowingVotes = false,
        onVotingCardSelect,
        myVote,
        config,
    } = useContext(SocketManagerContext);
    const { uiOptions } = useContext(UIOptionsContext);
    return (
        <div className="voting-cards-wrapper-container poker-cards-wrapper-container">
            <div
                className={clsx(
                    "voting-cards-container",
                    "poker-cards-container",
                    uiOptions.areCardsWrapping && "flex-wrap"
                )}
            >
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
            const newVote = isSelected && config.isUnvoteAllowed ? null : option;
            onVotingCardSelect(newVote);
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
