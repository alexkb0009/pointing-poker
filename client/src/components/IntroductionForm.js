import React from 'react';

export const IntroductionForm = ({ onJoin }) => {

    const onSubmit = (e) => {
        e.preventDefault();
        const { name } = Object.fromEntries(new FormData(e.target));
        onJoin(name);
    };

    return (
        <div className="introduction-form">
            <h2>Please enter your name to join</h2>
            <form onSubmit={onSubmit}>
                <input type="text" name="name" />
                <button type="submit">
                    Join
                </button>
            </form>
        </div>
    );
};