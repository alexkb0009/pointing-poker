import React, { useEffect, useState, useContext, useCallback } from "react";
import debounce from "lodash.debounce";
import toast, { useToasterStore } from "react-hot-toast";
import clsx from "clsx";
import { SocketManagerContext } from "./SocketManager";
import { roomNameValidRegex } from "./../constants";

export const IntroductionForm = ({ roomFromURL }) => {
    const { isConnected, onJoin } = useContext(SocketManagerContext);
    const { toasts } = useToasterStore();
    const [myProposedName, setMyProposedName] = useState("");
    const [isSpectating, setIsSpectating] = useState(false);
    const [wasValidated, setWasValidated] = useState(false);

    useEffect(() => {
        setMyProposedName(window.localStorage.getItem("myName") || "");
        setIsSpectating(JSON.parse(window.localStorage.getItem("isSpectating")) || false);
    }, []);

    const joinNameTakenErrorAlert = toasts.find(
        ({ id, visible }) => visible && id === "joinNameTaken"
    );

    const onSubmit = useCallback(
        debounce(
            (e) => {
                e.preventDefault();
                toast.dismiss("joinNameTaken");
                if (!isConnected) {
                    return false;
                }
                const formValues = Object.fromEntries(new FormData(e.target));
                const room = roomFromURL || formValues.room;
                onJoin(formValues.name, { room, isSpectating });
                window.localStorage.setItem("myName", formValues.name);
                window.localStorage.setItem("isSpectating", JSON.stringify(isSpectating));
                window.gtag("event", "select_content", {
                    content_type: "room",
                    item_id: room,
                });
            },
            1000,
            { leading: true, trailing: false }
        ),
        [isConnected]
    );

    const onInvalid = () => setWasValidated(true);

    return (
        <div className={clsx("container", "py-3")}>
            <div className={clsx("introduction-form", "row", "justify-content-center")}>
                <div className={clsx("col", "col-sm-6", "col-xl-4")}>
                    <form
                        onSubmit={onSubmit}
                        className={clsx(wasValidated ? "was-validated" : "needs-validation")}
                        onInvalid={onInvalid}
                        name="introductionForm"
                    >
                        <label
                            htmlFor="room-input"
                            className={clsx("form-label", roomFromURL && "mb-0")}
                        >
                            Room
                        </label>
                        {roomFromURL ? (
                            <h5 className="display-5">{roomFromURL}</h5>
                        ) : (
                            <input
                                id="room-input"
                                type="text"
                                name="room"
                                defaultValue={roomFromURL || ""}
                                className="form-control"
                                maxLength={12}
                                readOnly={!!roomFromURL}
                                pattern={roomNameValidRegex.source}
                                placeholder="New or existing unique code"
                                required
                                title="Only valid URL characters are allowed, with a max length of 12 characters."
                            />
                        )}
                        <p>If this is a new room, you can configure options as host.</p>

                        <label htmlFor="name-input" className="form-label">
                            Your Name
                        </label>
                        <input
                            id="name-input"
                            type="text"
                            name="name"
                            value={myProposedName}
                            onChange={(e) => setMyProposedName(e.target.value)}
                            className={clsx(
                                "form-control",
                                joinNameTakenErrorAlert && "is-invalid"
                            )}
                            maxLength={8}
                            required
                        />

                        <label className="form-check-label">
                            <input
                                type="checkbox"
                                name="isSpectating"
                                className="form-check-input me-2"
                                checked={isSpectating}
                                onChange={(e) => setIsSpectating(e.target.checked)}
                            />
                            Spectate
                        </label>

                        <button
                            type="submit"
                            className="mt-3 w-100 btn btn-primary"
                            disabled={!isConnected}
                            aria-label="Join Room"
                        >
                            {isConnected ? (
                                "Join"
                            ) : (
                                <i className="fa-solid fa-spin fa-circle-notch" />
                            )}
                        </button>

                        <p className="mt-2 small">
                            By clicking Join, you agree to our{" "}
                            <a href="/cookie-policy">Cookie Policy</a> and{" "}
                            <a href="/terms-of-service">Terms of Service</a>.
                        </p>

                        <p className="small">
                            Feedback or suggestions?
                            <br />
                            Email us at feedback&nbsp;
                            <i className="fa-solid fa-at small" />
                            &nbsp;pointingpoker.org
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};
