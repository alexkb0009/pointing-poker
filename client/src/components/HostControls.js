import React, { useEffect, useRef, useState, useContext, useCallback } from "react";
import clsx from "clsx";
import debounce from "lodash.debounce";
import { SocketManagerContext } from "./SocketManager";
import { POKER_CARD_OPTIONS } from "./../constants";

export const HostControls = () => {
    const {
        isShowingVotes,
        onToggleShowingVotes,
        agendaQueue,
        onSetAgendaQueue,
        onNextAgendaItem,
        onResetVotes,
        config,
        onSetConfig,
        onSetHost,
        clientsState,
    } = useContext(SocketManagerContext);
    const [visiblePane, setVisiblePane] = useState(null);
    const isShowingAgendaQueue = visiblePane === "agenda";
    const isShowingConfig = visiblePane === "config";
    const textareaRef = useRef();
    const agendaQueueLen = agendaQueue.length;

    useEffect(() => {
        // Update textarea when 'next agenda item' pressed.
        if (isShowingAgendaQueue) {
            textareaRef.current.value = agendaQueue.join("\n");
        }
    }, [agendaQueueLen]);

    const toggleIsShowingAgendaQueue = () => {
        setVisiblePane((currentPane) => (currentPane === "agenda" ? null : "agenda"));
    };

    const toggleIsShowingRoomConfig = () => {
        setVisiblePane((currentPane) => (currentPane === "config" ? null : "config"));
    };

    const onTextareaChange = useCallback(
        debounce((e) => {
            const nextText = e.target.value;
            const nextQueue = nextText ? nextText.split("\n") : [];
            onSetAgendaQueue(nextQueue);
        }, 1000),
        []
    );

    const onReset = useCallback(
        debounce(onResetVotes, 1000, { leading: true, trailing: false }),
        []
    );

    const onNextItem = useCallback(
        debounce(onNextAgendaItem, 1000, { leading: true, trailing: false }),
        []
    );

    const onSelectHost = (e) => {
        onSetHost(e.target.value);
    };

    const onSelectCardDeck = (e) => {
        onSetConfig({ cardDeck: e.target.value });
    };

    const onToggleIsVotingAfterShowAllowed = (e) => {
        onSetConfig({ isVotingAfterShowAllowed: e.target.checked });
    };

    const onToggleAreCardsShownAutomatically = (e) => {
        onSetConfig({ areCardsShownAutomatically: e.target.checked });
    };

    return (
        <div className="host-controls-wrapper">
            <div className="host-controls">
                <div className="btn-toolbar py-2 container-fluid" role="toolbar">
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
                                <>
                                    <i className="fa-solid fa-eye-slash fa-fw" />
                                    <span className="d-none d-md-inline ms-2">Hide Votes</span>
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-eye fa-fw" />
                                    <span className="d-none d-md-inline ms-2">Show Votes</span>
                                </>
                            )}
                        </button>
                    </div>

                    {isShowingVotes && (
                        <div className="btn-group me-2 my-1" role="group">
                            <button
                                type="button"
                                onClick={onReset}
                                className={clsx("btn", "btn-outline-primary")}
                                title="Reset all votes without storing current vote in history"
                            >
                                <i className="fa-solid fa-rotate-left" />
                                <span className="d-none d-md-inline ms-2">Redo</span>
                            </button>
                            <button
                                type="button"
                                onClick={onNextItem}
                                className={clsx("btn", "btn-primary")}
                                title="Storing current votes in history and continue to next one"
                            >
                                Next
                                <span className="d-none d-md-inline"> Round</span>
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

                    <div className="btn-group my-1 ms-2" role="group">
                        <button
                            type="button"
                            onClick={toggleIsShowingRoomConfig}
                            className={clsx(
                                "btn",
                                isShowingConfig ? "btn-primary" : "btn-outline-primary"
                            )}
                        >
                            <i className="fa-solid fa-gear fa-fw" />
                        </button>
                    </div>
                </div>

                {isShowingAgendaQueue ? (
                    <div className="pb-3 container-fluid">
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
                ) : isShowingConfig ? (
                    <div className="pb-3 container-md">
                        <div className="row">
                            <div className="col-auto">
                                <div className="form-check">
                                    <label
                                        className="form-check-label"
                                        htmlFor="isVotingAfterShowAllowedCheckbox"
                                    >
                                        Allow voting while cards are visible?
                                    </label>
                                    <input
                                        type="checkbox"
                                        id="isVotingAfterShowAllowedCheckbox"
                                        className="form-check-input"
                                        onChange={onToggleIsVotingAfterShowAllowed}
                                        checked={config.isVotingAfterShowAllowed}
                                    />
                                </div>
                            </div>
                            <div className="col-auto">
                                <div className="form-check">
                                    <label
                                        className="form-check-label"
                                        htmlFor="showVotesAutomatically"
                                    >
                                        Automatically show cards when all votes are in?
                                    </label>
                                    <input
                                        type="checkbox"
                                        id="showVotesAutomatically"
                                        className="form-check-input"
                                        onChange={onToggleAreCardsShownAutomatically}
                                        checked={config.areCardsShownAutomatically}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="row mt-2">
                            <label
                                className="form-check-label col-form-label col-4 col-md-3 col-xl-2"
                                htmlFor="cardDeckInput"
                            >
                                Card Deck
                            </label>
                            <div className="col">
                                <select
                                    name="cardDeck"
                                    id="cardDeckInput"
                                    className="form-control"
                                    onChange={onSelectCardDeck}
                                    value={config.cardDeck}
                                >
                                    {Object.entries(POKER_CARD_OPTIONS).map(([key, { title }]) => (
                                        <option value={key} key={key}>
                                            {title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="row mt-2">
                            <label
                                className="form-check-label col-form-label col-4 col-md-3 col-xl-2"
                                htmlFor="hostSelect"
                            >
                                Pass &ldquo;Host Role&rdquo; to...
                            </label>
                            <div className="col">
                                <select
                                    name="cardDeck"
                                    id="hostSelect"
                                    className="form-control"
                                    onChange={onSelectHost}
                                    value={clientsState[0].name}
                                    disabled={clientsState.length < 2}
                                >
                                    {clientsState.map(({ name }) => (
                                        <option value={name} key={name}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};
