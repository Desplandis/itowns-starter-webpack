import * as path from 'path';
import { fileURLToPath } from 'url';
import 'webpack-dev-server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Webpack's configuration.
 * See https://webpack.js.org/configuration/
 *
 * @param {Object} env - Environment options
 * @param {boolean} [env.production] - Production target flag
 * @returns {import('webpack').Configuration}
 */
const config = (env) => {
    return {
        mode: env.production ? 'production' : 'development',
        entry: {
            main: './src/index.js',
        },
        module: {
            rules: [
                {
                    test: /\.(?:js|mjs|cjs)$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        // Options are specified in the .babelrc.json file
                    },
                },
                {
                    test: /\.ts(x)?$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'ts-loader',
                    },
                },
            ],
        },
        resolve: {
            extensions: [
                '.js',
                '.ts',
            ],
            fallback: {
                fs: false,
            },
        },
        devtool: 'source-map',
        output: {
            filename: '[name].bundle.js',
            path: path.resolve(__dirname, 'dist'),
            clean: true,
        },
    };
};

export default config;
