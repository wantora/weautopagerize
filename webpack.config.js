/* eslint-env node */
const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");
const glob = require("glob");

module.exports = (env, argv) => {
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
    devtool: argv.mode === "development" ? "inline-source-map" : false,
    plugins: [
      new CopyWebpackPlugin([
        {from: "./src/webext"},
        {from: "./README.md"},
        {from: "./LICENSE.md"},
        {from: "./gpl-3.0.txt"},
      ]),
    ],
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          enforce: "pre",
          use: "eslint-loader",
        },
      ],
    },
    optimization: {
      minimize: false,
    },
  };
};
