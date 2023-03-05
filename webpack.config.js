
const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const env = process.env.NODE_ENV;

// const chunkFilename = '[name].js'; // TODO: Support '[name].[chunkhash].js';

const mode = env === "development" ? "development" : "production";

module.exports = [
    {
        mode,
        entry: {
            bundle: path.join(__dirname, "client/src/index")
        },
        target: "web",
        output: {
            path: path.resolve(__dirname, 'client/dist'),
            filename: '[name].js',
            libraryTarget: "umd",
            library: "App",
            umdNamedDefine: true
        },
        plugins: [new MiniCssExtractPlugin({ filename: "styles.css" })],
        module: {
            rules: [
                {
                    test: /\.(js|jsx)$/,
                    include: [
                        path.resolve(__dirname, 'client/src')
                    ],
                    use: [{ loader: 'babel-loader' }]
                },
                {
                    test: /\.less$/i,
                    use: [
                        MiniCssExtractPlugin.loader,
                        "css-loader",
                        "less-loader",
                    ],
                }
            ]
        },
        devtool: 'source-map',
        optimization: {
            usedExports: true,
            minimize: mode === "production",
            sideEffects: false
        }
    },
];