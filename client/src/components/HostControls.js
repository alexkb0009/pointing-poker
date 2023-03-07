import React from 'react';
import clsx from 'clsx';

export const HostControls = ({
    isShowingVotes,
    onResetVotes,
    onToggleShowingVotes
}) => {
    return (
        <div className="host-controls container-fluid py-3">

            <div className="btn-toolbar" role="toolbar" aria-label="Toolbar with button groups">
                <div className="btn-group me-2" role="group" aria-label="First group">
                    <button
                        type="button"
                        onClick={onToggleShowingVotes}
                        className={clsx(
                            'btn',
                            isShowingVotes ? 'btn-outline-primary' : 'btn-primary'
                        )}
                    >
                        { isShowingVotes ? "Hide" : "Show"} Votes
                    </button>
                </div>

                <div className="btn-group me-2" role="group" aria-label="First group">
                    <button
                        type="button"
                        onClick={onResetVotes}
                        className={clsx(
                            'btn',
                            isShowingVotes ? 'btn-primary' : 'btn-outline-primary'
                        )}
                    >
                        Reset All Votes
                    </button>
                </div>
            </div>
        </div>
    );
};