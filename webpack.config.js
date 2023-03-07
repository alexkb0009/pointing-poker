
const path = require('path');
const webpack = require('webpack');
const child_process = require('child_process');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const env = process.env.NODE_ENV;
const packageJson = require('./package.json');

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
        plugins: [
            new MiniCssExtractPlugin({ filename: "styles.css" }),
            new webpack.DefinePlugin({
                APP_VERSION: JSON.stringify(packageJson.version),
                COMMIT_HASH: JSON.stringify(
                    child_process
                        .execSync('git rev-parse HEAD')
                        .toString().trim().slice(0, 7)
                )
            })
        ],
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
                    test: /\.scss$/i,
                    use: [
                        MiniCssExtractPlugin.loader,
                        "css-loader",
                        {
                            loader: "postcss-loader",
                            options: {}
                        },
                        "sass-loader",
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