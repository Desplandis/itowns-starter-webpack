import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env, options) => {
    const mode = options.mode ?? 'development';

    return {
        entry: './src/index.js',
        mode,
        output: {
            filename: '[name].bundle.js',
            path: path.resolve(__dirname, 'public/libs'),
        },
        module: {
            rules: [
                {
                    test: /\.(?:js|mjs|cjs)$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader',
                },
            ],
        },
        resolve: {
            alias: {
                three: path.resolve(__dirname, 'node_modules/three/build/three.module.js'),
            },
        },
        plugins: [],
        devServer: {
            client: {
                overlay: {
                    errors: true,
                    runtimeErrors: false,
                    warnings: false,
                },
            },
            devMiddleware: {
                publicPath: path.resolve(__dirname, './public'),
                writeToDisk: true,
            },
            hot: false,
            static: path.resolve(__dirname, './public'),
        },
    };
};
