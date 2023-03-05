import clsx from 'clsx';
import React from 'react';

export const VoteValue = ({ value, className }) => {
    const isNumber = typeof value === "number";
    const isQuestionMark = !isNumber && value === "?";
    const isCoffee = !isNumber && !isQuestionMark && value === "COFFEE";
    if (isNumber || isCoffee || isQuestionMark) {
        const valueShown = isCoffee ? <>&#x2615;</> : value;
        return (
            <span className={clsx("large-value", className)}>
                { valueShown }
            </span>
        );
    }
    return <span className={className}>{value}</span>;
};