const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: {
        loadMesh: ['./src/index.ts']
    },
    mode: 'development',
    plugins: [
        new HtmlWebpackPlugin()
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.(png|jpg)$/,
                use: 'file-loader'
            },
            {
                test: /\.(glb|mp3|m4a|wav)$/,
                use: 'arraybuffer-loader'
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'build')
    },
    devServer: {
        contentBase: './build'
    }
};
