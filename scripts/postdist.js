// Updates index.html with the newly built content-hashed oiplayer filenames.
const fs = require("fs");
const path = require("path");

const jsFile = fs.readdirSync(path.resolve(__dirname, "../js")).find((f) => /^oiplayer\..+\.js$/.test(f));
const cssFile = fs.readdirSync(path.resolve(__dirname, "../css")).find((f) => /^oiplayer\..+\.css$/.test(f));

if (!jsFile || !cssFile) {
  console.error("postdist: could not find hashed oiplayer files in js/ or css/");
  process.exit(1);
}

const htmlPath = path.resolve(__dirname, "../index.html");
let html = fs.readFileSync(htmlPath, "utf8");
html = html.replace(/js\/oiplayer[^"]*\.js/, `js/${jsFile}`);
html = html.replace(/css\/oiplayer[^"]*\.css/, `css/${cssFile}`);
fs.writeFileSync(htmlPath, html);

console.log(`Updated index.html → ${jsFile}, ${cssFile}`);
