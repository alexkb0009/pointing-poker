import React from 'react';

export const IntroductionForm = ({ onJoin }) => {

    let roomFromURL = '';
    const roomMatch = window.location.pathname.match(/\/room\/(\S+)[\/?]/);
    if (roomMatch && roomMatch.length > 1) {
        roomFromURL = roomMatch[1];
    } 

    const onSubmit = (e) => {
        e.preventDefault();
        const { name, room } = Object.fromEntries(new FormData(e.target));
        onJoin(name, room);
    };

    return (
        <div className="introduction-form">
            <form onSubmit={onSubmit}>
                <p>Please enter a room and your name to join</p>
                <label htmlFor="room-input">
                    Room
                </label>
                <input id="room-input" type="text" name="room" defaultValue={roomFromURL}/>

                <label htmlFor="name-input">
                    Name
                </label>
                <input id="name-input" type="text" name="name" />

                <button type="submit">
                    Join
                </button>
            </form>
        </div>
    );
};