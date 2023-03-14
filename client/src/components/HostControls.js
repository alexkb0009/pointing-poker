import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

export const HostControls = ({
    agendaQueue,
    isShowingVotes,
    onResetVotes,
    onNextAgendaItem,
    onToggleShowingVotes,
    onSetAgendaQueue,
}) => {
    const [isShowingAgendaQueue, setIsShowingAgendaQueue] = useState(false);
    const textareaRef = useRef();
    const agendaQueueLen = agendaQueue.length;

    useEffect(() => {
        // Update textarea when 'next agenda item' pressed.
        if (isShowingAgendaQueue) {
            textareaRef.current.value = agendaQueue.join("\n");
        }
    }, [agendaQueueLen]);

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
                            title={`${isShowingVotes ? "Hide" : "Show"} all current votes`}
                        >
                            {isShowingVotes ? (
                                <i className="fa-solid fa-eye-slash fa-fw" />
                            ) : (
                                <i className="fa-solid fa-eye fa-fw" />
                            )}
                        </button>
                    </div>

                    {isShowingVotes && (
                        <div className="btn-group me-2 my-1" role="group">
                            <button
                                type="button"
                                onClick={onResetVotes}
                                className={clsx("btn", "btn-outline-primary")}
                                title="Reset all votes without storing current vote in history"
                            >
                                <i className="fa-solid fa-rotate-left" />
                            </button>
                            <button
                                type="button"
                                onClick={onNextAgendaItem}
                                className={clsx("btn", "btn-primary")}
                                title="Storing current votes in history and continue to next one"
                            >
                                Next {agendaQueueLen > 1 ? "Agenda Item" : "Round"}
                                <i className="fa-solid fa-arrow-right ms-2" />
                            </button>
                        </div>
                    )}

                    <div className="flex-grow-1">&nbsp;</div>

                    <div className="btn-group my-1" role="group">
                        <button
                            type="button"
                            onClick={toggleIsShowingAgendaQueue}
                            className={clsx(
                                "btn",
                                isShowingAgendaQueue ? "btn-primary" : "btn-outline-primary"
                            )}
                        >
                            <i className="fa-solid fa-list-check fa-fw" />
                        </button>
                    </div>
                </div>

                {isShowingAgendaQueue && (
                    <div className="pb-3">
                        <textarea
                            className={clsx("form-control", "agenda-textarea")}
                            rows={8}
                            placeholder="Copy and paste (or type) agenda here. Try a spreadsheet. Each line is a separate item."
                            defaultValue={agendaQueue.join("\n")}
                            onChange={onTextareaChange}
                            spellCheck={false}
                            ref={textareaRef}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
