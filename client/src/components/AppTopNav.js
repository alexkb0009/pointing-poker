import React, { useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAnglesLeft } from "@fortawesome/free-solid-svg-icons/faAnglesLeft";
import { SocketManagerContext } from "./SocketManager";
import { TopNav } from "./TopNav";
import { UIOptionsSidebar } from "./UIOptionsSidebar";
import { UserControls } from "./UserControls";

export const AppTopNav = () => {
    const {
        isJoined = false,
        clientsState = [],
        onToggleSpectating,
        onExit,
        myName,
    } = useContext(SocketManagerContext);

    return (
        <TopNav
            brandContent={
                isJoined && (
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            onExit();
                        }}
                    >
                        <FontAwesomeIcon icon={faAnglesLeft} className="me-2" />
                        Exit
                    </a>
                )
            }
        >
            {isJoined && (
                <UserControls
                    clientsState={clientsState}
                    onToggleSpectating={onToggleSpectating}
                    myName={myName}
                />
            )}
            <UIOptionsSidebar />
        </TopNav>
    );
};
