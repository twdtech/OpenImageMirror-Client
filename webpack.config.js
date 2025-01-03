const path = require('path');

module.exports = {
    target: 'electron-preload',
    node: {
        __dirname: false,
        __filename: false,
        path: true
    },
    entry: './preload.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'preload.js'
    },
    resolve: {
        extensions: ['.js', '.json']
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    node: {
        __dirname: false,
        __filename: false
    }
};