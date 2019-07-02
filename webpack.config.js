"use strict";

const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");
const glob = require("glob");
const fetch = require("node-fetch");
const fs = require("fs");

const DIST_PATH = path.join(__dirname, "dist");
const WEDATA_URL = "http://wedata.net/databases/AutoPagerize/items_all.json";

module.exports = async (env, argv) => {
  const entry = {};
  for (const file of glob.sync("./src/{userscript/,}*.js")) {
    entry[file.replace("./src/", "").replace(/\.js$/, "")] = file;
  }

  const config = {
    entry: entry,
    output: {
      path: DIST_PATH,
      filename: "[name].js",
      pathinfo: true,
    },
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
          type: "javascript/esm",
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          enforce: "pre",
          use: "eslint-loader",
        },
      ],
    },
    optimization: {},
  };

  if (argv.mode === "production") {
    config.optimization.minimize = false;
  }

  if (argv.mode === "development") {
    config.devtool = "inline-source-map";
  }

  try {
    const wedataData = await (await fetch(WEDATA_URL)).text();
    fs.mkdirSync(DIST_PATH, {recursive: true});
    fs.writeFileSync(path.join(DIST_PATH, "wedata-items.json"), wedataData);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  return config;
};
