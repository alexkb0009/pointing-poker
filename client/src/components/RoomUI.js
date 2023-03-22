import React, { Suspense } from "react";
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
                <Suspense>
                    <HostControls />
                </Suspense>
            )}
        </>
    );
};
