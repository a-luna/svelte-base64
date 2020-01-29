import svelte from "rollup-plugin-svelte"
import sveltePreprocess from "svelte-preprocess"
import resolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import livereload from "rollup-plugin-livereload"
import { terser } from "rollup-plugin-terser"

const preprocess = sveltePreprocess({ scss: true })
const production = !process.env.ROLLUP_WATCH
const dedupe = importee => importee === "svelte" || importee.startsWith("svelte/")
const sass = require("node-sass")
const postcss = require("postcss")
const cssnano = require("cssnano")({ preset: "default" })
const fs = require("fs")

export default {
  input: "src/main.js",
  output: {
    sourcemap: true,
    format: "iife",
    name: "app",
    file: "public/build/bundle.js",
  },
  plugins: [
    svelte({
      // enable run-time checks when not in production
      dev: !production,
      accessors: true,
      // we'll extract any component CSS out into
      // a separate file — better for performance
      css: css => {
        css.write("public/build/bundle.css")
      },
      preprocess,
    }),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration —
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true,
      dedupe: dedupe,
    }),
    commonjs(),
    sass.render(
      {
        file: "./src/style/global.sass",
        indentedSyntax: true,
        outFile: "public/global.css",
      },
      function(error, result) {
        if (!error) {
          postcss([cssnano])
            .process(result.css, {
              from: "./static/global.css",
              to: "public/global.css",
            })
            .then(result =>
              fs.writeFile("public/global.css", result.css, function(err) {
                if (err) {
                  console.log(err)
                }
              })
            )
        } else {
          console.log(error)
        }
      }
    ),

    // In dev mode, call `npm run start` once
    // the bundle has been generated
    !production && serve(),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload("public"),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
  ],
  watch: {
    clearScreen: false,
  },
}

function serve() {
  let started = false

  return {
    writeBundle() {
      if (!started) {
        started = true

        require("child_process").spawn("npm", ["run", "start", "--", "--dev"], {
          stdio: ["ignore", "inherit", "inherit"],
          shell: true,
        })
      }
    },
  }
}
