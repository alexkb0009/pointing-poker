import React, { useContext, useEffect, useState } from "react";
import { THEMES } from "../constants";
import { SidebarContext } from "./SidebarContext";
import { UIOptionsContext } from "./UIOptionsContext";

// Memoized to avoid re-render when AppTopNav re-renders as it contains useContext(SocketManagerContext)
// and we don't need those props.
export const UIOptionsSidebar = React.memo(() => {
    // Testing count of re-renders (render only when relevant state changes, NOT client votes etc)
    // console.log("render sidebar 1");
    const { isSidebarOpen, setIsSidebarOpen, sidebarPortal } = useContext(SidebarContext);
    const { uiOptions, updateUIOptions } = useContext(UIOptionsContext);
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    if (!isSidebarOpen && isOptionsOpen) {
        setIsOptionsOpen(false);
    }

    useEffect(() => {
        // Close sidebar if unmount UIOptionsSidebar and is open.
        return () => {
            if (isOptionsOpen) {
                setIsSidebarOpen(false);
            }
        };
    }, [isOptionsOpen]);

    return (
        <>
            <button
                className="btn btn-sm me-1"
                type="button"
                disabled={isSidebarOpen && !isOptionsOpen}
                aria-label="Show/Hide UI Options"
                onClick={() => {
                    const nextIsOpen = !isOptionsOpen;
                    setIsOptionsOpen(nextIsOpen);
                    setIsSidebarOpen(nextIsOpen);
                }}
            >
                <i className="fa-solid fa-gear" />
            </button>
            {isOptionsOpen &&
                sidebarPortal(
                    <>
                        <div className="d-flex align-items-center border-bottom mb-1">
                            <h4 className="container-fluid py-2 flex-grow-1 my-0 fw-normal">
                                UI Options
                            </h4>
                            <button
                                className="btn me-1 fs-6"
                                type="button"
                                aria-label="Close UI Options"
                                onClick={() => {
                                    setIsOptionsOpen(false);
                                    setIsSidebarOpen(false);
                                }}
                            >
                                <i className="fa-solid fa-times" />
                            </button>
                        </div>
                        <div className="container-fluid py-1">
                            <label className="form-label" htmlFor="themeSelect">
                                Theme
                            </label>
                            <select
                                id="themeSelect"
                                className="form-control"
                                onChange={(e) => updateUIOptions({ theme: e.target.value })}
                                value={uiOptions.theme}
                            >
                                {Object.entries(THEMES).map(([value, { title }], i) => (
                                    <option value={value} key={value}>
                                        {title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="container-fluid py-2">
                            <div className="form-check">
                                <label className="form-check-label" htmlFor="wrapCardsCheckbox">
                                    Wrap card rows?
                                </label>
                                <input
                                    type="checkbox"
                                    id="wrapCardsCheckbox"
                                    className="form-check-input"
                                    onChange={() =>
                                        updateUIOptions({
                                            areCardsWrapping: !uiOptions.areCardsWrapping,
                                        })
                                    }
                                    checked={uiOptions.areCardsWrapping}
                                />
                            </div>
                        </div>

                        {/* Doesn't seem like a super-worthwhile customization to have -
                        <div className="container-fluid py-1">
                            <label className="form-label" htmlFor="themeSelect">
                                Card Size (W x H)
                            </label>
                            <div className="d-flex">
                                <input
                                    className="form-control me-1"
                                    type="number"
                                    min={30}
                                    max={200}
                                    step={10}
                                    value={uiOptions.cardSizeWidth}
                                    onChange={(e) =>
                                        updateUIOptions({ cardSizeWidth: e.target.value })
                                    }
                                />
                                <input
                                    className="form-control ms-1"
                                    type="number"
                                    min={30}
                                    max={200}
                                    step={10}
                                    value={uiOptions.cardSizeHeight}
                                    onChange={(e) =>
                                        updateUIOptions({ cardSizeHeight: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                        */}
                    </>
                )}
        </>
    );
});
