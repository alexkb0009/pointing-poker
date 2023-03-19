export const POKER_CARD_OPTIONS = {
    default: {
        title: "Fibonacci-like (0.5, 1, 2, 3, 5, 8, 13, 20, ..)",
        values: ["PASS", 0.5, 1, 2, 3, 5, 8, 13, 20, 50, 100, "INFINITY", "COFFEE"],
    },
    hours: {
        title: "Time Estimates (2hr, 4, 8, 16, 24, 1wk, 2wk, ..)",
        values: ["PASS", 2, 4, 8, 16, 24, 40, 80, 160, 320, 480, 720, "INFINITY", "COFFEE"],
    },
    rating: {
        title: "1-10 Rating (1, 2, 3, ..)",
        values: ["PASS", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, "INFINITY", "COFFEE"],
    },
    tShirtSizes: {
        title: "T-Shirt Sizes (XS, SM, MD, ..)",
        values: ["PASS", "XS", "SM", "MD", "LG", "XL", "XXL", "XXXL", "INFINITY", "COFFEE"],
    },
};

export const roomNameValidRegex = /^[\w\-\.~!$&'\(\)*+,;=:@]+$/;

export const THEMES = {
    poker: "Poker (default)",
    cyberpunk: "Cyberpunk",
};
