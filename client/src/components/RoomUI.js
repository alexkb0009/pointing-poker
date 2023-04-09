import React, { Suspense } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleNotch } from "@fortawesome/free-solid-svg-icons/faCircleNotch";
import { CurrentAgenda } from "./CurrentAgenda";
import { PeerVotes } from "./PeerVotes";
import { VotingCards } from "./VotingCards";

const HostControls = React.lazy(() =>
    import(
        /* webpackChunkName: "host-controls" */
        "./HostControls"
    ).then((module) => ({ default: module.HostControls }))
);

export const RoomUI = ({ isCurrentHostMe }) => {
    return (
        <>
            <CurrentAgenda />
            <PeerVotes />
            <VotingCards />
            {isCurrentHostMe && (
                <Suspense
                    fallback={
                        <div className="d-flex align-items-center justify-content-center py-4">
                            <FontAwesomeIcon icon={faCircleNotch} spin />
                        </div>
                    }
                >
                    <HostControls />
                </Suspense>
            )}
        </>
    );
};
