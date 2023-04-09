import React from "react";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMugSaucer } from "@fortawesome/free-solid-svg-icons/faMugSaucer";
import { faInfinity } from "@fortawesome/free-solid-svg-icons/faInfinity";

export const VALUE_DISPLAY = {
    HAS_VOTE: <>&nbsp;</>,
    PASS: <>&ndash;</>, // <i className="fa-solid fa-minus" />,
    COFFEE: <FontAwesomeIcon icon={faMugSaucer} />, // <>&#x2615;</>
    INFINITY: <FontAwesomeIcon icon={faInfinity} />, // <>&infin;</>
    0.5: <>&#x00BD;</>,
};

const VALUE_DISPLAY_HOURLY = {
    40: "1w",
    80: "2w",
    160: "1m",
    320: "2m",
    480: "3m",
    720: "6m",
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
