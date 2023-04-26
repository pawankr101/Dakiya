const {resolve} = require('path');
const {readdir} = require('fs');
const HtmlWebPackPlugin = require('html-webpack-plugin');

function listFiles(dir) {
    return new Promise((resolve, reject) => {
        readdir(dir, {withFileTypes: true}, (err, files) => {
            if(err) reject(err);
            else resolve(files.filter(f=> {
                return (f.isDirectory() || (f.isFile() && f.name.match(/\.tsx?$/i)))
            }));
        });
    });
}
async function buildEntry(dir, baseName="", entry={}) {
    try {
        var files = await listFiles(resolve(dir, baseName));
        for(var i=files.length-1; i>=0; i--) {
            var fname = baseName ?  (baseName + '/' + files[i].name) : files[i].name;
            if(files[i].isDirectory()) await buildEntry(dir, fname, entry);
            else entry[fname.replace(/\.tsx?$/i, "").replace(/\//, "_")] = resolve(dir, fname);
        }
    } catch(err) {}
    console.log(entry);
    return entry;
}

module.exports = (env, argv) => {
    const config = {
        target: 'web',
        mode: argv.mode||'development',
        // context: resolve(__dirname),
        // entry: () => buildEntry(resolve(__dirname, 'src')),
        entry: {
            index: resolve(__dirname, 'src', 'index.tsx')
        },
        output: {
            path: resolve(__dirname, 'dist'),
            filename: '[name].js',
            // publicPath: resolve(__dirname, 'dist', 'assets')
        },
        module: {
            rules: [{
                test: /\.tsx?$/i,
                exclude: [/node_modules/],
                loader: 'ts-loader'
            },{
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },{
                test: /\.(png|jpg|jpeg|svg|gif|ico|woff|woff2|eot|ttf|otf)$/i,
                loader: 'file-loader',
                type: 'asset/source',
            }]
        },
        resolve: {extensions: ['.html', '.css', '.js', '.ts', '.tsx', '.json']},
        plugins:[new HtmlWebPackPlugin({
            template: resolve(__dirname, 'src', 'index.html'),
            favicon: resolve(__dirname, 'src', 'assets', 'favicon.ico')
        })],
        optimization: {
            splitChunks: {
              chunks: 'all'
            }
        }
    }
    if(argv.mode==='production') {
        config.module.rules[0].options = {
            configFile: resolve(__dirname, 'tsconfig.prod.json'),
            transpileOnly: true,
        };
    } else {
        config.devtool = 'inline-source-map';
    }
    return config;
}