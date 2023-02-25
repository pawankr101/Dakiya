const {resolve} = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = module.exports = (env, argv) => {
    const config = {
        target: 'node',
        mode: argv.mode || 'development',
        entry: resolve(__dirname, 'src', 'index.ts'),
        output: {
            path: resolve(__dirname, 'dist'),
            filename: 'index.js'
        },
        module: {
            rules: [{
                test: /\.ts$/,
                exclude: [/node_modules/],
                loader: 'ts-loader'
            },{
                test: /\.(png|jpg|jpeg|svg|gif)$/,
                loader: 'file-loader'
            }]
        },
        resolve: {extensions: ['.js', '.ts', '.json']},
        externals: [nodeExternals()]
    }
    if(argv.mode==='production') {
        config.module.rules[0].options = {
            configFile: resolve(__dirname, 'tsconfig-prod.json'),
            transpileOnly: true,
        };
    } else {
        config.devtool = 'source-map';
    }
    return config;
}