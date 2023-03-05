
const path = require('path');
const webpack = require('webpack');
const env = process.env.NODE_ENV;
const debug = process.env.NODE_DEBUG;
const version = process.versions.node;
// const TerserPlugin = require('terser-webpack-plugin');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

// const chunkFilename = '[name].js'; // TODO: Support '[name].[chunkhash].js';
// const devTool = 'source-map';

const mode = env === "development" ? "development" : "production";

module.exports = [
    {
        mode,
        entry: {
            bundle: path.join(__dirname, "src/index")
        },
        target: "web",
        output: {
            filename: '[name].js',
            libraryTarget: "umd",
            library: "App",
            umdNamedDefine: true
        },
        module: {
            rules: [
                {
                    test: /\.(js|jsx)$/,
                    include: [
                        path.resolve(__dirname, 'src')
                    ],
                    use: [{ loader: 'babel-loader' }]
                },
                // TODO: Configure LESS or CSS-in-JS stuff
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