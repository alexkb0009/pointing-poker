import React from 'react';

export const IntroductionForm = ({ onJoin }) => {

    const onSubmit = (e) => {
        e.preventDefault();
        const { name } = Object.fromEntries(new FormData(e.target));
        onJoin(name);
    };

    return (
        <div className="introduction-form">
            <form onSubmit={onSubmit}>
                <label for="name-input">
                    Please enter your name to join
                </label>
                <input id="name-input" type="text" name="name" />
                <button type="submit">
                    Join
                </button>
            </form>
        </div>
    );
};