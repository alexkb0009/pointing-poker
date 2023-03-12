import React, { useState } from "react";
import clsx from "clsx";
import { VALUE_DISPLAY } from "./VoteValue";

export const CurrentAgenda = React.memo(({ agendaQueue = [], agendaHistory = [] }) => {
    const [currentItem, ...nextItems] = agendaQueue;
    const [isOpen, setIsOpen] = useState(false);

    const historyLen = agendaHistory.length;
    const remainingLen = agendaQueue.length || 1;
    const totalLen = historyLen + remainingLen;

    const onClick = (e) => setIsOpen((v) => !v);

    return (
        <div
            className={clsx(
                "current-agenda",
                "container-fluid",
                "bg-white",
                "py-2",
                isOpen && "is-open",
                !isOpen && "d-flex align-items-center flex-wrap"
            )}
            onClick={onClick}
        >
            <label className="flex-shrink-0">
                <span className="fw-bold">Current Item</span>
                {totalLen > 1 && (
                    <span className="fw-light ms-1">
                        ({historyLen + 1} of {totalLen})
                    </span>
                )}
                <i className={clsx("fa-solid", "text-muted", "mx-2", "fa-angle-right")} />
            </label>
            <p className={clsx("my-0", isOpen ? "text-break" : "text-truncate")}>
                {currentItem || noTextFallback}
            </p>
            {/*isOpen && <em className="mt-2 small text-muted">{remainingLen - 1} more items</em>*/}
            {isOpen && (
                <>
                    <label className="fw-bold small mt-2">History</label>
                    {historyLen === 0 ? (
                        <em className="d-block">None</em>
                    ) : (
                        agendaHistory
                            .map((item, index) => (
                                <AgendaItem key={index} index={index} item={item} />
                            ))
                            // Most recent at top
                            .reverse()
                    )}
                </>
            )}
        </div>
    );
});

function votesStats(votes) {
    const filteredVotes = votes.filter((v) => v && v !== "PASS" && v !== "COFFEE");
    const votesLen = filteredVotes.length;
    if (votesLen === 0) {
        return null;
    }
    if (filteredVotes.length === 1) {
        return {
            mode: votes[0],
            average: votes[0],
        };
    }
    const countByVal = new Map();
    votes.forEach((vote) => {
        if (!countByVal.has(vote)) {
            countByVal.set(vote, 0);
        }
        countByVal.set(vote, countByVal.get(vote) + 1);
    });
    const sortedByCount = [...countByVal.entries()].sort(([, aCount], [, bCount]) => {
        return bCount - aCount;
    });
    const mode =
        sortedByCount.length === 1 || sortedByCount[0][1] > sortedByCount[1][1]
            ? sortedByCount[0][0]
            : null;
    const numericalVotesOnly = filteredVotes.filter((v) => typeof v === "number");
    const numericalVotesLen = numericalVotesOnly.length;
    const sum = numericalVotesOnly.reduce((m, v) => m + v, 0);
    const average =
        numericalVotesLen === 0 || numericalVotesLen * 2 <= votesLen
            ? null
            : sum / numericalVotesLen;
    if (!mode && !average) {
        // Non-definitive assortment of coffee, Infinity, Pass, etc..
        return null;
    }
    return {
        mode,
        average,
    };
}

const AgendaItem = ({ index, item: { text, votes } }) => {
    const stats = votesStats(votes);
    const scoreType = !stats ? null : stats.mode ? "mode" : "average";
    const score = (scoreType && stats[scoreType]) || null;
    return (
        <div className="d-flex align-items-center">
            <span className="fw-bold small">{index + 1}.&ensp;</span>
            <span className="text-truncate">{text || noTextFallback}</span>
            <div className="flex-grow-1">&emsp;</div>

            <div className="votes-list">
                {/* <i className="fa-solid fa-square-poll-horizontal me-2" /> */}
                {votes.map((vote, idx) => (
                    <span className="vote" key={idx}>
                        {VALUE_DISPLAY[vote] || vote || VALUE_DISPLAY.PASS}
                    </span>
                ))}
            </div>
            {scoreType && (
                <div
                    className="score flex-shrink-0"
                    title={scoreType.charAt(0).toUpperCase() + scoreType.slice(1)}
                >
                    <i className="fa-solid fa-angle-right mx-2 text-muted" />
                    <span className="value">{VALUE_DISPLAY[score] || score}</span>
                </div>
            )}
        </div>
    );
};

const noTextFallback = <em>No description</em>;
