import React, { useRef, useState, createContext } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

export const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const sidebarRef = useRef(null);

    const sidebarPortal = (content) => {
        return createPortal(content, sidebarRef.current);
    };

    const value = {
        sidebarPortal,
        setIsSidebarOpen,
        isSidebarOpen,
    };

    return (
        <SidebarContext.Provider value={value}>
            {children}
            <div
                className={clsx("sidebar-bg-overlay", isSidebarOpen && "is-open")}
                onClick={() => setIsSidebarOpen(false)}
            />
            <div
                id="sidebar-container"
                className={clsx(isSidebarOpen && "is-open")}
                ref={sidebarRef}
            />
        </SidebarContext.Provider>
    );
};
