/* eslint-env node */
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");
const glob = require("glob");

module.exports = (options) => {
  const production = options && options.production === "true";
  const plugins = [
    new webpack.LoaderOptionsPlugin({
      debug: true,
    }),
    new CopyWebpackPlugin([
      {from: "./src/webext"},
      {from: "./README.md"},
      {from: "./LICENSE.md"},
      {from: "./gpl-3.0.txt"},
    ]),
  ];
  
  if (production) {
    plugins.push(...[
      new webpack.optimize.ModuleConcatenationPlugin(),
      new webpack.LoaderOptionsPlugin({
        debug: false,
      }),
      new webpack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify("production"),
      }),
      new webpack.NoEmitOnErrorsPlugin(),
    ]);
  }
  
  const entry = {};
  for (const file of glob.sync("./src/{userscript/,}*.js")) {
    entry[file.replace("./src/", "").replace(/\.js$/, "")] = file;
  }
  
  return {
    entry: entry,
    output: {
      path: path.join(__dirname, "dist"),
      filename: "[name].js",
      pathinfo: true,
    },
    devtool: production ? false : "inline-source-map",
    plugins: plugins,
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          enforce: "pre",
          use: "eslint-loader",
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: "babel-loader",
        },
      ],
    },
  };
};
