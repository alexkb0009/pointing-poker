import React from "react";

export const UserControls = ({ onChange, clientsState, myName }) => {
    const myClientState = clientsState.find(({ name }) => name === myName);

    const { isSpectating = false } = myClientState || {};

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
                <i className="fa-solid fa-binoculars me-2" />
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
