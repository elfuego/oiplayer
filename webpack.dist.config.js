const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");

const sharedModule = {
  rules: [
    {
      test: /\.scss$/i,
      use: [
        MiniCssExtractPlugin.loader,
        "css-loader",
        {
          loader: "sass-loader",
          options: {
            api: "modern",
          },
        },
      ],
    },
  ],
};

const sharedOptimization = {
  minimize: true,
  minimizer: [new TerserPlugin()],
};

// npm package build — stable filename, consumed via package.json "main"
const npmBuild = {
  name: "npm",
  mode: "production",
  entry: "./src/js/index.js",
  output: {
    filename: "oiplayer.js",
    path: path.resolve(__dirname, "dist"),
    library: {
      name: "OIPlayer",
      type: "umd",
      export: "default",
    },
    globalObject: "this",
    clean: true,
  },
  module: sharedModule,
  plugins: [
    new MiniCssExtractPlugin({
      filename: "oiplayer.css",
    }),
  ],
  optimization: sharedOptimization,
};

// Website build — content-hashed filenames for cache busting
const websiteBuild = {
  name: "website",
  mode: "production",
  entry: "./src/js/index.js",
  output: {
    filename: "oiplayer.[contenthash].js",
    path: path.resolve(__dirname, "js"),
    library: {
      name: "OIPlayer",
      type: "umd",
      export: "default",
    },
    globalObject: "this",
    clean: false,
  },
  module: sharedModule,
  plugins: [
    new MiniCssExtractPlugin({
      filename: "../css/oiplayer.[contenthash].css",
    }),
  ],
  optimization: sharedOptimization,
};

module.exports = [npmBuild, websiteBuild];
