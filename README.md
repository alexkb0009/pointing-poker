# Pointing Poker

Relatively simple planning/pointing poker app using socket.io

## Usage

On a running instance, navigate to <your-domain>/room/{whateverName}/ to join room whateverName.

## Setup

1. Build dist folder with one of these commands:

    - `npm run build` for production
    - `npm run build-dev` for development
    - `npm run watch-dev` for dev watch-build

2. Start server with one of these commands:
    - `npm run serve` for production
    - `npm run serve-dev` for development
        - Prepend command with ENV_VAR assignments for more debugging, e.g. `DEBUG=socket.io:socket* npm run serve-dev` to get socket.io logs. Checkout Socket.io docs for more "DEBUG" env var options.
3. It will now be served from your IP/server

## Next Steps & Roadmap

Anyone is welcome to contribute or make PRs!

-   ~~Play around more with code-splitting approaches, try out Suspense and React.lazy.~~ Done, works nicely, need to analyze+optimize bundle sizes more though.
-   Allow to scale up to multiple servers.
    -   Could figure out which "SocketIO Adapter" to use (provides PubSub messaging between SocketIO servers for horizontal scaling).
    -   And then build out data model for same database for storing RoomStates.
    -   Can then start to consider (optional) authentication (login via OpenID Connect Provider?), mostly for fun and optional extra features like storing votes of past Pointing Games.
-   More themes! If have any ideas for themes/colors, please suggest them or make a PR even (and then I'll review/touch-up/merge). Also any ideas for organizing themes and SCSS in general is very welcome as I haven't done much in that regard.
-   If people become interested in working on this or app becomes popular/needing-high-uptime -
    -   Better developer experience (add hot module reloading)
    -   E2E testing with Cypress or Playwright
-   If want to support this tool more as a self-deployable 'on-prem' option, need to add support for config files (YAML?) and parameterize many things.

### License

Has yet to be decided. All rights reserved by author. Will probably ultimately be MIT.
