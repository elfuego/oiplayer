const fs = require("fs");
const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");

const JS_FILE = /^oiplayer\..+\.js$/;
const CSS_FILE = /^oiplayer\..+\.css$/;

// Clean old hashed website files before build
[
  { dir: "js", pattern: JS_FILE },
  { dir: "css", pattern: CSS_FILE },
].forEach(({ dir, pattern }) => {
  const dirPath = path.resolve(__dirname, dir);
  if (!fs.existsSync(dirPath)) return;
  fs.readdirSync(dirPath)
    .filter((f) => pattern.test(f))
    .forEach((f) => {
      fs.unlinkSync(path.join(dirPath, f));
      console.log(`Removed ${dir}/${f}`);
    });
});

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

const sharedLibrary = {
  library: {
    name: "OIPlayer",
    type: "umd",
    export: "default",
  },
  globalObject: "this",
};

// Updates index.html with the newly emitted content-hashed filenames
class UpdateIndexHtmlPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap("UpdateIndexHtmlPlugin", (compilation) => {
      const assets = Object.keys(compilation.assets);
      const jsFile = assets.find((f) => JS_FILE.test(f));
      const cssAsset = assets.find((f) => CSS_FILE.test(path.basename(f)));

      if (!jsFile || !cssAsset) return;

      const cssFile = path.basename(cssAsset);
      const htmlPath = path.resolve(__dirname, "index.html");
      let html = fs.readFileSync(htmlPath, "utf8");
      html = html.replace(/js\/oiplayer[^"]*\.js/, `js/${jsFile}`);
      html = html.replace(/css\/oiplayer[^"]*\.css/, `css/${cssFile}`);
      fs.writeFileSync(htmlPath, html);

      console.log(`Updated index.html → ${jsFile}, ${cssFile}`);
    });
  }
}

// npm package build — stable filename, consumed via package.json "main"
const npmBuild = {
  name: "npm",
  mode: "production",
  entry: "./src/js/index.js",
  output: {
    filename: "oiplayer.js",
    path: path.resolve(__dirname, "dist"),
    ...sharedLibrary,
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
    ...sharedLibrary,
    clean: false,
  },
  module: sharedModule,
  plugins: [
    new MiniCssExtractPlugin({
      filename: "../css/oiplayer.[contenthash].css",
    }),
    new UpdateIndexHtmlPlugin(),
  ],
  optimization: sharedOptimization,
};

module.exports = [npmBuild, websiteBuild];
