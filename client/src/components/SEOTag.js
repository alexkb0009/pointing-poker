import React from "react";
import { roomUrlValidRegex } from "./../constants";

const webApplicationObject = {
    "@context": "https://schema.org/",
    "@type": "WebApplication",
    name: "Pointing Poker Page",
    url: "https://pointingpoker.org/",
    applicationCategory: "BusinessApplication",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    operatingSystem: "All",
    permissions: "internet",
    description:
        "An app/game to vote on agenda items or tasks with points, commonly used for pointing in agile/scrum workflows but can be adapted for other purposes as well.",
    author: {
        "@type": "Person",
        givenName: "Alexander",
        familyName: "Balashov",
    },
    offers: {
        "@type": "Offer",
        price: "0",
    },
    screenshot: [
        {
            "@type": "ImageObject",
            author: "Pointing Poker Page",
            datePublished: "20023-03-19",
            description: "Screenshot of a Pointing Poker Page game in Serika Dark theme.",
            name: "Pointing Poker Page Screenshot I",
            url: "https://pointingpoker.org/assets/game-theme-serika-dark.jpg",
        },
        {
            "@type": "ImageObject",
            author: "Pointing Poker Page",
            datePublished: "20023-03-19",
            description: "Screenshot of a Pointing Poker Page game in default theme.",
            name: "Pointing Poker Page Screenshot II",
            url: "https://pointingpoker.org/assets/game-theme-poker.jpg",
        },
    ],
    audience: {
        "@type": "Audience",
        name: "Software development teams, businesses, project managers, scrum masters",
    },
    potentialAction: {
        "@type": "PlayAction",
        actionStatus: "PotentialActionStatus",
    },
};

const websiteObject = {
    "@context": "https://schema.org/",
    "@type": "WebSite",
    name: "Pointing Poker Page",
    url: "https://pointingpoker.org/",
    mainEntity: webApplicationObject,
};

// const byPath = [
//     [
//         [/^\/$/, roomUrlValidRegex],
//         (url) => ({
//             ...webApplicationObject,
//             potentialAction: {
//                 ...websiteObject.potentialAction,
//                 ...(url.pathname.search("/room/") > -1 ? { target: url.href } : {}),
//             },
//         }),
//     ],
// ];

export const SEOTag = React.memo(() => {
    // const foundEntry = byPath.find(
    //     ([keyMatchers]) => !!keyMatchers.find((km) => km.test(url.pathname))
    // );
    // const pageObject = foundEntry && foundEntry[1](url);
    return (
        <>
            {/* pageObject && (
                <script
                    data-own
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(pageObject, null, 4) }}
                />
            )*/}

            <script
                data-own
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteObject, null, 4) }}
            />
        </>
    );
});
