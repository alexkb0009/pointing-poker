import React from 'react';

export const HostControls = ({
    isShowingVotes,
    onResetVotes,
    onToggleShowingVotes
}) => {
    return (
        <div className="host-controls">
            <button type="button" onClick={onToggleShowingVotes}>
                { isShowingVotes ? "Hide" : "Show"} Votes
            </button>
            <button type="button" onClick={onResetVotes}>
                Reset All Votes
            </button>
        </div>
    );
};