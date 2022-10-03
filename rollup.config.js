import resolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import { terser } from "rollup-plugin-terser"
import json from "rollup-plugin-json"
import copy from "rollup-plugin-copy2"
import typescript from "@rollup/plugin-typescript"
import tar from "tar"
import fs from "fs"
import pkg from "./package.json"
import crypto from "crypto"

const iconFile = "icon.svg"
const iconExists = fs.existsSync(iconFile)
const assets = ["schema.json", "package.json"]
if (iconExists) {
  assets.push(iconFile)
}

// Custom plugin to clean the dist folder before building
const clean = () => ({
  buildStart() {
    const dist = "./dist/"
    if (fs.existsSync(dist)) {
      fs.readdirSync(dist).forEach(path => {
        if (path.endsWith(".tar.gz")) {
          fs.unlinkSync(dist + path)
        }
      })
    }
  },
})

// Custom plugin to hash the JS bundle and write it in the schema
const hash = () => ({
  writeBundle() {
    // Generate JS hash
    const fileBuffer = fs.readFileSync("dist/plugin.min.js")
    const hashSum = crypto.createHash("sha1")
    hashSum.update(fileBuffer)
    const hex = hashSum.digest("hex")

    // Read and parse existing schema from dist folder
    const schema = JSON.parse(fs.readFileSync("./dist/schema.json", "utf8"))

    // Write updated schema to dist folder, pretty printed as JSON again
    const newSchema = {
      ...schema,
      hash: hex,
      version: pkg.version,
    }
    fs.writeFileSync("./dist/schema.json", JSON.stringify(newSchema, null, 2))
  },
})

// Custom plugin to bundle up our files after building
const bundle = () => ({
  async writeBundle() {
    const bundleName = `${pkg.name}-${pkg.version}.tar.gz`
    return tar
      .c({ gzip: true, cwd: "dist" }, [...assets, "plugin.min.js"])
      .pipe(fs.createWriteStream(`dist/${bundleName}`))
  },
})

export default {
  input: "src/index.ts",
  output: {
    sourcemap: false,
    format: "cjs",
    file: "dist/plugin.min.js",
    inlineDynamicImports: true,
    exports: "default",
  },
  plugins: [
    clean(),
    resolve({
      preferBuiltins: true,
      browser: false,
    }),
    typescript({
      compilerOptions: {
        target: "es6",
        module: "esnext",
        lib: ["es2020"],
        allowJs: true,
        strict: true,
        noImplicitAny: true,
        esModuleInterop: true,
        resolveJsonModule: true,
        types: ["node"],
        skipLibCheck: true,
        moduleResolution: "node",
      },
      include: ["./src/**/*"],
      exclude: ["node_modules", "dist", "**/*.spec.ts", "**/*.spec.js"],
    }),
    commonjs(),
    json(),
    terser(),
    copy({
      assets,
    }),
    hash(),
    bundle(),
  ],
}