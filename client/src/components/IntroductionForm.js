import React from 'react';
import clsx from 'clsx';

export const IntroductionForm = ({ onJoin }) => {

    let roomFromURL = '';
    const roomMatch = window.location.pathname.match(/\/room\/(\S+)[\/?]/);
    if (roomMatch && roomMatch.length > 1) {
        roomFromURL = roomMatch[1];
    }

    const savedName = window.localStorage.getItem("myName");

    const onSubmit = (e) => {
        e.preventDefault();
        const { name, room } = Object.fromEntries(new FormData(e.target));
        onJoin(name, room || roomFromURL);
        window.localStorage.setItem("myName", name);
    };

    return (
        <div className={clsx("introduction-form", "row")}>
            <div className={clsx("col", "col-sm-6", "col-lg-4")}>
                <form onSubmit={onSubmit}>
                    { !roomFromURL && (
                        <>
                            <label htmlFor="room-input" className="form-label">
                                Room
                            </label>
                            <input
                                id="room-input"
                                type="text"
                                name="room"
                                defaultValue={roomFromURL}
                                className="form-control"
                                maxLength={12}
                            />
                        </>
                    )}

                    <label htmlFor="name-input" className="form-label">
                        Your Name
                    </label>
                    <input
                        id="name-input"
                        type="text"
                        name="name"
                        defaultValue={savedName}
                        className="form-control"
                        maxLength={8}
                    />

                    <button type="submit" className="btn btn-primary">
                        Join
                    </button>
                </form>
            </div>
        </div>
    );
};