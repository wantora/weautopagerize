import {rm, cp, watch} from "node:fs/promises";
import {join, basename} from "node:path";
import {glob} from "glob";
import esbuild from "esbuild";

const CONFIG = {
  entryPoints: glob.sync("./src/*.js"),
  outdir: "./dist",
  copydir: "./src/webext",
  copyfiles: ["./README.md", "./LICENSE"],
};
const watchMode = process.argv.includes("--watch");

console.log("CONFIG =", CONFIG);

await rm(CONFIG.outdir, {recursive: true, force: true});

const ctx = await esbuild.context({
  entryPoints: CONFIG.entryPoints,
  bundle: true,
  outdir: CONFIG.outdir,
  logLevel: "info",
  sourcemap: watchMode,
  mainFields: ["module", "browser", "main"],
});

if (watchMode) {
  await ctx.watch();
} else {
  await ctx.rebuild();
  await ctx.dispose();
}

const cpDir = async () => {
  for (const file of CONFIG.copyfiles) {
    await cp(file, join(CONFIG.outdir, basename(file)), {recursive: true});
  }
  return cp(CONFIG.copydir, CONFIG.outdir, {recursive: true});
};
await cpDir();

if (watchMode) {
  const watcher = watch(CONFIG.copydir, {recursive: true});
  for await (const event of watcher) {
    console.log(event);
    await cpDir();
  }
}
