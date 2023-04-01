import React, { useContext } from "react";
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
                        <i className="fa-solid fa-angles-left me-2" />
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
