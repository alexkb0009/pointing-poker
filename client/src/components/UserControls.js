import React from "react";

export const UserControls = ({ onChange, clientsState, myName }) => {
    const myClientState = clientsState.find(({ name }) => name === myName);
    const { isSpectating = false } = myClientState || {};
    const countSpectators = clientsState.reduce(
        (m, { isSpectating }) => (isSpectating ? m + 1 : m),
        0
    );
    return (
        <div className="nav-controls d-flex">
            <div className="px-2 d-flex align-items-center" title="Number of spectators in room">
                <i className="fa-solid fa-user-secret me-2" />
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
