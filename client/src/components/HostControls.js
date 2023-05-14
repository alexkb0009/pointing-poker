import React, { useEffect, useRef, useState, useContext, useCallback } from "react";
import clsx from "clsx";
import debounce from "lodash.debounce";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowRight,
    faEye,
    faEyeSlash,
    faGear,
    faListCheck,
    faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
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

    const toggleIsShowingAgendaQueue = () => {
        setVisiblePane((currentPane) => (currentPane === "agenda" ? null : "agenda"));
    };

    const toggleIsShowingRoomConfig = () => {
        setVisiblePane((currentPane) => (currentPane === "config" ? null : "config"));
    };

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

    const onToggleIsUnvoteAllowed = (e) => {
        onSetConfig({ isUnvoteAllowed: e.target.checked });
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
                                    <FontAwesomeIcon icon={faEyeSlash} fixedWidth />
                                    <span className="d-none d-md-inline ms-2">Hide Votes</span>
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faEye} fixedWidth />
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
                                <FontAwesomeIcon icon={faRotateLeft} fixedWidth />
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
                                <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
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
                            <FontAwesomeIcon icon={faListCheck} fixedWidth />
                            <span className="d-none d-md-inline ms-2">Agenda</span>
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
                            <FontAwesomeIcon icon={faGear} fixedWidth />
                            <span className="d-none d-md-inline ms-2">Options</span>
                        </button>
                    </div>
                </div>

                {isShowingAgendaQueue ? (
                    <AgendaPanel agendaQueue={agendaQueue} onSetAgendaQueue={onSetAgendaQueue} />
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
                                    <label className="form-check-label" htmlFor="isUnvoteAllowed">
                                        Allow vote card to be unselected?
                                    </label>
                                    <input
                                        type="checkbox"
                                        id="isUnvoteAllowed"
                                        className="form-check-input"
                                        onChange={onToggleIsUnvoteAllowed}
                                        checked={config.isUnvoteAllowed}
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

const AgendaPanel = ({ agendaQueue, onSetAgendaQueue }) => {
    const agendaTextareaRef = useRef();
    // const agendaInputRef = useRef();
    // const agendaQueueLen = agendaQueue.length;

    useEffect(() => {
        // agendaInputRef.current.value = agendaQueue[0] || "";
        agendaTextareaRef.current.value = agendaQueue.join("\n");
    }, [agendaQueue]);

    const onAgendaTextareaChange = useCallback(
        debounce((e) => {
            const nextText = e.target.value;
            const nextQueue = nextText ? nextText.split("\n") : [];
            onSetAgendaQueue(nextQueue);
        }, 1000),
        []
    );

    // const onAgendaInputChange = useCallback(
    //     debounce((e) => {
    //         const nextText = e.target.value;
    //         const nextQueue = agendaQueueLen === 0 ? [null] : [...agendaQueue];
    //         nextQueue[0] = nextText;
    //         onSetAgendaQueue(nextQueue);
    //     }, 1000),
    //     [agendaQueue]
    // );

    // const onAgendaTextareaChange = useCallback(
    //     debounce((e) => {
    //         const nextText = e.target.value;
    //         const nextSubQueue = nextText ? nextText.split("\n") : [];
    //         const nextQueue = [agendaQueue[0] || null, ...nextSubQueue];
    //         onSetAgendaQueue(nextQueue);
    //     }, 1000),
    //     [agendaQueue]
    // );

    return (
        <div className={clsx("pb-3", "container-fluid", "agenda-textarea-container")}>
            {/* <input
                type="text"
                className={clsx("form-control", "agenda-current-input")}
                defaultValue={agendaQueue[0] || ""}
                onChange={onAgendaInputChange}
                spellCheck={false}
                ref={agendaInputRef}
                placeholder="Current agenda item.."
                onKeyUp={(e) => {
                    if (e.key.toLowerCase() === "enter") {
                        agendaTextareaRef.current?.focus();
                    }
                }}
            /> */}
            <div className="small mb-1 text-muted">First line is current item</div>

            <textarea
                className={clsx("form-control", "agenda-textarea")}
                rows={8}
                placeholder="Subsequent agenda items... Try copy-pasting in a spreadsheet or Jira titles. Each line is a separate item."
                defaultValue={agendaQueue.slice(1).join("\n")}
                onChange={onAgendaTextareaChange}
                spellCheck={false}
                ref={agendaTextareaRef}
            />
        </div>
    );
};
