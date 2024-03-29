/* eslint-disable no-undef */
const path = require("path");
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");
const child_process = require("child_process");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const StatsPlugin = require("stats-webpack-plugin");
const env = process.env.NODE_ENV;
const packageJson = require("./package.json");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

const mode = env === "development" ? "development" : "production";
const isProduction = mode === "production";

const commonConfig = {
    mode,
    output: {
        path: path.resolve(__dirname, "client/dist"),
        filename: "[name].js",
        libraryTarget: "umd",
        library: "App",
        umdNamedDefine: true,
        globalObject: "this",
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                include: [
                    path.resolve(__dirname, "client/src"),
                    path.resolve(__dirname, "server/src"),
                ],
                use: [{ loader: "babel-loader" }],
            },
            {
                test: /\.scss$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    {
                        loader: "postcss-loader",
                        options: {},
                    },
                    "sass-loader",
                ],
            },
            {
                test: /\.css$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    {
                        loader: "postcss-loader",
                        options: {},
                    },
                ],
            },
        ],
    },
};

module.exports = [
    {
        ...commonConfig,
        entry: {
            bundle: path.join(__dirname, "client/src/browser"),
        },
        output: {
            ...commonConfig.output,
            filename: isProduction ? "[name].[chunkhash].js" : commonConfig.output.filename,
        },
        target: "web",
        plugins: [
            new MiniCssExtractPlugin({
                filename: isProduction ? "styles.[chunkhash].css" : "styles.css",
            }),
            new webpack.DefinePlugin({
                APP_VERSION: JSON.stringify(packageJson.version),
                COMMIT_HASH: JSON.stringify(
                    child_process.execSync("git rev-parse HEAD").toString().trim().slice(0, 7)
                ),
                // GA_ID: JSON.stringify(process.env.GA_ID),
            }),
            new StatsPlugin("client-bundles.json", {
                // assets: false,
                chunkModules: false,
                chunkGroups: false,
                chunkOrigins: false,
                chunks: false,
                entrypoints: false,
                modules: false,

                exclude: ["node_modules/"],
            }),
            // new BundleAnalyzerPlugin(),
        ],
        devtool: "source-map",
        optimization: {
            usedExports: true,
            minimize: isProduction,
            sideEffects: false,
            mergeDuplicateChunks: true,
            providedExports: true,
            removeAvailableModules: isProduction,
            innerGraph: isProduction,
            minimizer: isProduction ? [`...`, new CssMinimizerPlugin()] : [`...`],
        },
        // Experiments with loading React via CDN instead of bundling
        // externals: {
        //     react: "React",
        //     "react-dom/client": "ReactDOM",
        // },
    },
    {
        ...commonConfig,
        entry: {
            "server-bundle": path.join(__dirname, "server/src/index.js"),
        },
        output: {
            ...commonConfig.output,
            path: path.resolve(__dirname, "server/dist"),
        },
        target: "node",
        plugins: [
            new webpack.DefinePlugin({
                APP_VERSION: JSON.stringify(packageJson.version),
                COMMIT_HASH: JSON.stringify(
                    child_process.execSync("git rev-parse HEAD").toString().trim().slice(0, 7)
                ),
                // GA_ID: JSON.stringify(process.env.GA_ID),
            }),
            // new StatsPlugin("server-stats.json", {
            //     chunkModules: false,
            //     // exclude: [/node_modules[\\\/]react/],
            // }),
        ],
        optimization: {
            minimize: false,
        },
        externals: [
            nodeExternals(),
            {
                "socket.io-client": "socket.io-client",
            },
        ],
    },
];
