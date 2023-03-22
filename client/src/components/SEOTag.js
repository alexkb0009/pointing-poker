import React from "react";
// import { roomUrlValidRegex } from "./../constants";

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
        "An app to vote on the complexity or effort of tasks or similar items. Pointing poker is commonly used for pointing in agile or scrum workflows, but can be adapted for other purposes as well.",
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
            datePublished: "2023-03-19",
            description: "Screenshot of a Pointing Poker Page game in Serika Dark theme.",
            name: "Pointing Poker Page Screenshot I",
            url: "https://pointingpoker.org/assets/game-theme-serika-dark.jpg",
        },
        {
            "@type": "ImageObject",
            author: "Pointing Poker Page",
            datePublished: "2023-03-19",
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
    keywords: [
        "planning,poker,pointing,scrum,agile,pointingpoker,planningpoker,sprint,points,work,project,consenus,voting",
    ],
};

const websiteObject = {
    "@context": "https://schema.org/",
    "@type": "WebSite",
    name: webApplicationObject.name,
    url: "https://pointingpoker.org/",
    mainEntity: webApplicationObject,
    keywords: webApplicationObject.keywords,
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

            <meta name="description" content={webApplicationObject.description} />
            <meta property="application-name" content={webApplicationObject.name} />
            <meta property="og:type" content="website" />
            <meta property="og:title" content={websiteObject.name} />
            <meta property="og:url" content={websiteObject.url} />
            <meta property="og:description" content={webApplicationObject.description} />
            <meta property="og:site_name" content={websiteObject.name} />
            {/* <meta property="og:image" content="TODO" /> */}
            {/* <meta property="og:image:width" content="TODO" /> */}
            {/* <meta property="og:image:height" content="TODO" /> */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={websiteObject.name} />
            <meta name="twitter:description" content={webApplicationObject.description} />
            {/* <meta name="twitter:image" content="TODO" /> */}

            <script
                data-own
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteObject, null, 4) }}
            />
        </>
    );
});
