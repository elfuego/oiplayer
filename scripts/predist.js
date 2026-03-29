// Removes old content-hashed oiplayer files from js/ and css/ before a fresh dist build.
const fs = require("fs");
const path = require("path");

[
  { dir: "js", pattern: /^oiplayer\..+\.js$/ },
  { dir: "css", pattern: /^oiplayer\..+\.css$/ },
].forEach(({ dir, pattern }) => {
  const dirPath = path.resolve(__dirname, "..", dir);
  fs.readdirSync(dirPath)
    .filter((f) => pattern.test(f))
    .forEach((f) => {
      fs.unlinkSync(path.join(dirPath, f));
      console.log(`Removed ${dir}/${f}`);
    });
});
