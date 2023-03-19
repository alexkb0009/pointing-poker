import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { roomNameValidRegex } from "./../constants";

export const IntroductionForm = ({ onJoin, roomFromURL, isConnected }) => {
    const [myName, setMyName] = useState("");
    const [isSpectating, setIsSpectating] = useState(false);
    const [wasValidated, setWasValidated] = useState(false);

    useEffect(() => {
        setMyName(window.localStorage.getItem("myName") || "");
        setIsSpectating(JSON.parse(window.localStorage.getItem("isSpectating")) || false);
    }, []);

    const onSubmit = (e) => {
        e.preventDefault();
        if (!isConnected) {
            return false;
        }
        const room = roomFromURL || Object.fromEntries(new FormData(e.target)).room;
        onJoin(myName, { room, isSpectating });
        window.localStorage.setItem("myName", myName);
        window.localStorage.setItem("isSpectating", JSON.stringify(isSpectating));
        window.gtag("event", "select_content", {
            content_type: "room",
            item_id: room,
        });
    };

    const onInvalid = () => setWasValidated(true);

    return (
        <div className={clsx("container", "py-3")}>
            <div className={clsx("introduction-form", "row", "justify-content-center")}>
                <div className={clsx("col", "col-sm-6", "col-xl-4")}>
                    <form
                        onSubmit={onSubmit}
                        className={clsx(wasValidated ? "was-validated" : "needs-validation")}
                        onInvalid={onInvalid}
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
                            value={myName}
                            onChange={(e) => setMyName(e.target.value)}
                            className="form-control"
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
