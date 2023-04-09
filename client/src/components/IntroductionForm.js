import React, { useEffect, useState, useContext } from "react";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAt } from "@fortawesome/free-solid-svg-icons/faAt";
import { faCircleNotch } from "@fortawesome/free-solid-svg-icons/faCircleNotch";
import { SocketManagerContext } from "./SocketManager";
import { roomNameValidRegex } from "./../constants";
import { RouteDataContext } from "../RouteDataContext";

export const IntroductionForm = ({ roomFromURL }) => {
    const routeData = useContext(RouteDataContext);
    const roomStats = routeData?.roomStats || null;
    const { isConnected, onJoin, socketAlerts, dismissAlert } = useContext(SocketManagerContext);
    const [myProposedName, setMyProposedName] = useState("");
    const [isSpectating, setIsSpectating] = useState(false);
    const [wasValidated, setWasValidated] = useState(false);

    useEffect(() => {
        setMyProposedName(window.localStorage.getItem("myName") || "");
        setIsSpectating(JSON.parse(window.localStorage.getItem("isSpectating")) || false);
    }, []);

    const joinNameTakenErrorAlert = socketAlerts["joinNameTaken"];

    const onNameChange = (e) => {
        dismissAlert("joinNameTaken");
        setMyProposedName(e.target.value);
    };

    const onSubmit = (e) => {
        e.stopPropagation();
        e.preventDefault();
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
    };

    const onInvalid = () => setWasValidated(true);

    const isExistingRoom = roomStats?.clientsCount > 0;

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
                            {!roomStats ? "" : !isExistingRoom ? "New " : "Existing "}
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
                                className="form-control mb-3"
                                maxLength={12}
                                readOnly={!!roomFromURL}
                                pattern={roomNameValidRegex.source}
                                placeholder="New or existing unique code"
                                required
                                title="Only valid URL characters are allowed, with a max length of 12 characters."
                            />
                        )}
                        {!isExistingRoom && (
                            <p>If this is a new room, you can configure options as host.</p>
                        )}

                        <label htmlFor="name-input" className="form-label">
                            Your Name
                        </label>
                        <div className="input-group has-validation mb-2">
                            <input
                                id="name-input"
                                type="text"
                                name="name"
                                value={myProposedName}
                                onChange={onNameChange}
                                className={clsx(
                                    "form-control",
                                    "d-block",
                                    !!joinNameTakenErrorAlert && "is-invalid"
                                )}
                                maxLength={8}
                                required
                            />
                            {joinNameTakenErrorAlert && (
                                <div className="invalid-feedback">
                                    {joinNameTakenErrorAlert.alert.message}
                                </div>
                            )}
                        </div>

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
                            className="mt-3 w-100 btn btn-primary d-block"
                            disabled={!isConnected}
                            aria-label="Join Room"
                        >
                            {isConnected ? "Join" : <FontAwesomeIcon icon={faCircleNotch} spin />}
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
                            <FontAwesomeIcon icon={faAt} className="small" />
                            &nbsp;pointingpoker.org
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};
