import React, { useContext, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { SocketManager, SocketManagerContext } from "./SocketManager";
import { AppTopNav } from "./AppTopNav";
import { SidebarProvider } from "./SidebarContext";
import { IntroductionForm } from "./IntroductionForm";
import { HostControls } from "./HostControls";
import { PeerVotes } from "./PeerVotes";
import { VotingCards } from "./VotingCards";
import { CurrentAgenda } from "./CurrentAgenda";

export const App = ({ appVersion, commitHash, roomFromURL }) => {
    useEffect(() => {
        window.getAppVersionInfo = () => {
            console.info("Version Info", appVersion, commitHash);
        };
    }, []);

    return (
        <SidebarProvider>
            <SocketManager roomFromURL={roomFromURL}>
                <AppTopNav roomFromURL={roomFromURL} />
                <AppContent roomFromURL={roomFromURL} />
                <Toaster />
            </SocketManager>
        </SidebarProvider>
    );
};

const AppContent = ({ roomFromURL }) => {
    const {
        isConnected = false,
        isJoined = false,
        currentHost,
        myName,
    } = useContext(SocketManagerContext);
    const isCurrentHostMe = currentHost === myName;
    return (
        <div id="content-area" className="flex-grow-1">
            {!isConnected && isJoined && <div className="connecting-container">Connecting</div>}

            {!isJoined ? (
                <IntroductionForm roomFromURL={roomFromURL} />
            ) : (
                <>
                    <CurrentAgenda />
                    <PeerVotes />
                    <VotingCards />
                    {isCurrentHostMe && <HostControls />}
                </>
            )}
        </div>
    );
};
