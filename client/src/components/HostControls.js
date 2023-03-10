import React, { useCallback, useMemo, useState } from "react";
import isEqual from "lodash.isequal";
import clsx from "clsx";

export const HostControls = ({
    agendaQueue,
    isShowingVotes,
    onResetVotes,
    onToggleShowingVotes,
    onSetAgendaQueue,
}) => {
    const [isShowingAgendaQueue, setIsShowingAgendaQueue] = useState(false);
    const agendaQueueLen = agendaQueue.length;

    const toggleIsShowingAgendaQueue = () => {
        setIsShowingAgendaQueue((prev) => !prev);
    };

    const onTextareaChange = (e) => {
        const nextText = e.target.value;
        const nextQueue = nextText ? nextText.split("\n") : [];
        onSetAgendaQueue(nextQueue);
    };

    return (
        <div className="host-controls-wrapper">
            <div className="host-controls container-fluid">
                <div className="btn-toolbar py-2" role="toolbar">
                    <div className="btn-group me-2 my-1" role="group">
                        <button
                            type="button"
                            onClick={onToggleShowingVotes}
                            className={clsx(
                                "btn",
                                isShowingVotes ? "btn-outline-primary" : "btn-primary"
                            )}
                        >
                            {isShowingVotes ? "Hide" : "Show"} Votes
                        </button>
                    </div>

                    <div className="btn-group me-2 my-1" role="group">
                        <button
                            type="button"
                            onClick={onResetVotes}
                            className={clsx(
                                "btn",
                                isShowingVotes ? "btn-primary" : "btn-outline-primary"
                            )}
                        >
                            {agendaQueueLen > 1 ? "Next Agenda Item" : "Reset All Votes"}
                        </button>
                    </div>

                    <div className="btn-group me-2 my-1" role="group">
                        <button
                            type="button"
                            onClick={toggleIsShowingAgendaQueue}
                            className={clsx("btn", "btn-outline-primary")}
                        >
                            {isShowingAgendaQueue ? "Hide" : "Show"} Agenda Queue
                        </button>
                    </div>
                </div>

                {isShowingAgendaQueue && (
                    <div className="pb-3">
                        <textarea
                            className={clsx("form-control")}
                            rows={7}
                            placeholder="Copy and paste (or type) agenda here. Each line is a separate item."
                            defaultValue={agendaQueue.join("\n")}
                            onChange={onTextareaChange}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
