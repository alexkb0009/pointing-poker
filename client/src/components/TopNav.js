import React from "react";

export const TopNav = ({ children, brandContent = null, href, onBrandClick }) => {
    return (
        <div className="top-nav d-flex align-items-center">
            {brandContent ? (
                <div className="container-fluid m-0">{brandContent}</div>
            ) : (
                <TopNavBranding href={href} onBrandClick={onBrandClick} />
            )}
            {children}
        </div>
    );
};

const TopNavBranding = ({ href = "/", onBrandClick }) => {
    const onClick = (e) => {
        if (!href) {
            e.stopPropagation();
            e.preventDefault();
        }
        if (onBrandClick) {
            onBrandClick(e);
        }
    };
    return (
        <h1 id="page-title" className="container-fluid m-0">
            <a href={href} onClick={onClick}>
                Pointing Poker Page
            </a>
        </h1>
    );
};
