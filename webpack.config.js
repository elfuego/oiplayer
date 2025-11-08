const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const devMode = process.env.NODE_ENV !== "production";

module.exports = {
  mode: devMode ? "development" : "production",
  devtool: devMode ? "source-map" : "eval",
  entry: {
    oiplayer: "./src/js/oiplayer.js",
    styles: "./src/scss/styles.scss",
  },
  output: {
    // filename: devMode ? "[name].js" : "[name].[hash].js",
    filename: "[name].js",
    path: devMode ? path.resolve(__dirname, "./build") : path.resolve(__dirname, "./dist"),
  },
  devServer: {
    static: "./build",
    open: {
      app: {
        // or 'google-chrome', match with package.json
        name: "Google Chrome",
      },
    },
    port: 3000,
    // hot: true,
    watchFiles: {
      paths: ["src/js/**/*.*", "src/scss/**/*.*"],
      //☝🏽 Enables live reload in these folders
      options: {
        usePolling: true,
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.scss$/i,
        use: [devMode ? "style-loader" : MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
      },
      {
        test: /\.html$/i,
        use: ["html-loader"],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].css",
    }),
    new HtmlWebpackPlugin({
      template: "./src/index.html",
    }),
  ],
};
