import clsx from "clsx";
import React from "react";

export const VALUE_DISPLAY = {
    HAS_VOTE: <>&nbsp;</>,
    PASS: <>&ndash;</>, // <i className="fa-solid fa-minus" />,
    COFFEE: <i className="fa-solid fa-mug-saucer" />, // <>&#x2615;</>
    INFINITY: <i className="fa-solid fa-infinity" />, // <>&infin;</>
    0.5: <>&#x00BD;</>,
};

const VALUE_DISPLAY_HOURLY = {
    40: "1wk",
    80: "2wk",
    160: "1mo",
    320: "2mo",
    480: "3mo",
    720: "6mo",
};

export const VoteValue = ({ value, className, config = {} }) => {
    let valueShown = value;
    const displayValue = VALUE_DISPLAY[value];
    if (displayValue) {
        valueShown = <span className="fs-2">{displayValue}</span>;
    } else {
        if (config.cardDeck === "hours") {
            valueShown = VALUE_DISPLAY_HOURLY[value] || valueShown;
        }
    }
    /*
    if (value === 0.5) {
        valueShown = <>&#x00BD;</>;
    }
    */
    return <span className={clsx("large-value", className)}>{valueShown}</span>;
};
