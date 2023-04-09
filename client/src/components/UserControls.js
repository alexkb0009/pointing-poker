import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBinoculars } from "@fortawesome/free-solid-svg-icons/faBinoculars";

export const UserControls = ({ onToggleSpectating, clientsState, myName }) => {
    const myClientState = clientsState.find(({ name }) => name === myName);
    const { isSpectating = false } = myClientState || {};

    const onChange = () => {
        window.localStorage.setItem("isSpectating", JSON.stringify(!isSpectating));
        onToggleSpectating();
    };

    const spectators = clientsState
        .filter(({ isSpectating }) => isSpectating)
        .map(({ name }) => name);

    const countSpectators = spectators.length;
    return (
        <div className="nav-controls d-flex align-items-center">
            <div
                className="px-2 d-flex align-items-center"
                title={
                    countSpectators === 0
                        ? "No spectators currently"
                        : `Spectators: ${spectators.join(", ")}`
                }
            >
                <FontAwesomeIcon icon={faBinoculars} className="me-2" />
                {countSpectators}
            </div>
            <label className="form-check-label px-2 d-flex align-items-center h-100">
                <input
                    type="checkbox"
                    className="form-check-input me-2 my-0"
                    onChange={onChange}
                    checked={isSpectating}
                    disabled={!myClientState}
                />
                Spectate
            </label>
        </div>
    );
};
