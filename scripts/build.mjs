import {rm, cp, watch, readFile, writeFile} from "node:fs/promises";
import {globSync} from "node:fs";
import {join, basename} from "node:path";
import esbuild from "esbuild";

const CONFIG = {
  entryPoints: globSync("./src/*.js"),
  outdir: "./dist",
  copydir: "./src/webext",
  copyfiles: ["./README.md", "./LICENSE"],
};

async function copy() {
  await cp(CONFIG.copydir, CONFIG.outdir, {recursive: true});

  for (const file of CONFIG.copyfiles) {
    await cp(file, join(CONFIG.outdir, basename(file)), {recursive: true});
  }

  const manifestFile = join(CONFIG.outdir, "manifest.json");
  const manifest = await readFile(manifestFile, {
    encoding: "utf8",
  });
  const packageJson = JSON.parse(
    await readFile("package.json", {
      encoding: "utf8",
    })
  );
  await writeFile(
    manifestFile,
    manifest.replaceAll("__PACKAGEJSON_VERSION__", packageJson.version)
  );
}

const watchMode = process.argv.includes("--watch");
const ctx = await esbuild.context({
  entryPoints: CONFIG.entryPoints,
  bundle: true,
  outdir: CONFIG.outdir,
  logLevel: "info",
  sourcemap: watchMode,
  mainFields: ["module", "browser", "main"],
});

console.log("CONFIG =", CONFIG);
await rm(CONFIG.outdir, {recursive: true, force: true});
await copy();

if (watchMode) {
  await ctx.watch();

  const watcher = watch(CONFIG.copydir, {recursive: true});
  for await (const event of watcher) {
    console.log(event);
    await copy();
  }
} else {
  await ctx.rebuild();
  await ctx.dispose();
}
