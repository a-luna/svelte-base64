import svelte from "rollup-plugin-svelte"
import sveltePreprocess from "svelte-preprocess"
import resolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import livereload from "rollup-plugin-livereload"
import { terser } from "rollup-plugin-terser"
import copy from "rollup-plugin-copy"

const preprocess = sveltePreprocess({ scss: true })
const sass = require("node-sass")
const postcss = require("postcss")
const autoprefixer = require("autoprefixer")
const cssnano = require("cssnano")
const fs = require("fs")
const production = !process.env.ROLLUP_WATCH

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
    copy({
      targets: [
        {
          src: "src/fonts/*",
          dest: "public/webfonts",
        },
      ],
    }),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration —
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true,
      dedupe: importee => importee === "svelte" || importee.startsWith("svelte/"),
    }),
    commonjs(),
    sass.render(
      {
        file: "./src/style/global.sass",
        indentedSyntax: true,
        outFile: "public/build/global.css",
      },
      function(error, result) {
        if (!error) {
          postcss([autoprefixer, cssnano({ preset: "default" })])
            .process(result.css, {
              from: "public/build/global.css",
              to: "public/build/global.css",
            })
            .then(result =>
              fs.writeFile("public/build/global.css", result.css, function(err) {
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
