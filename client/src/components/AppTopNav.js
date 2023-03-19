import React from "react";
import { TopNav } from "./TopNav";
import { UIOptionsSidebar } from "./UIOptionsSidebar";
import { UserControls } from "./UserControls";

export const AppTopNav = ({
    isJoined,
    roomFromURL,
    clientsState,
    onToggleSpectating,
    onExit,
    myName,
}) => {
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
                    onChange={onToggleSpectating}
                    myName={myName}
                />
            )}
            <UIOptionsSidebar />
        </TopNav>
    );
};
