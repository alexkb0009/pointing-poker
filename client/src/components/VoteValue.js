import clsx from 'clsx';
import React from 'react';

export const VoteValue = ({ value, className }) => {
    const isPass = value === "PASS";

    if (isPass) {
        return <span className={clsx("fw-bold", className)}>{value}</span>;
    }

    let valueShown = value;
    if (value === "HAS_VOTE") {
        valueShown = <span className="fs-2">&nbsp;</span>;
    } else if (value === "COFFEE") {
        valueShown = <span className="fs-2">&#x2615;</span>;
    } else if (value === "INFINITY") {
        valueShown = <span className="fs-2">&infin;</span>;
    }
    /*
    if (value === 0.5) {
        valueShown = <>&#x00BD;</>;
    }
    */
    return (
        <span className={clsx("large-value", className)}>
            { valueShown }
        </span>
    );
};