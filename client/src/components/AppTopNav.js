import React, { useContext } from "react";
import { SocketManagerContext } from "./SocketManager";
import { TopNav } from "./TopNav";
import { UIOptionsSidebar } from "./UIOptionsSidebar";
import { UserControls } from "./UserControls";

export const AppTopNav = ({ roomFromURL }) => {
    const {
        isJoined = false,
        clientsState = [],
        onToggleSpectating,
        onExit,
        myName,
    } = useContext(SocketManagerContext);

    const onBrandClick =
        isJoined || !roomFromURL
            ? null
            : function () {
                  window.history.pushState(null, document.title, "/");
                  window.dispatchEvent(new PopStateEvent("pushstate"));
              };

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
            // eslint-disable-next-line react/jsx-no-bind
            onBrandClick={onBrandClick}
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
