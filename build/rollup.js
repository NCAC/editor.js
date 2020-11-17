// const typescript = require("rollup-plugin-typescript2");
const typescript = require("@rollup/plugin-typescript");
const nodeResolve = require("@rollup/plugin-node-resolve").nodeResolve;
const babel = require("@rollup/plugin-babel").babel;
const importSvg = require("rollup-plugin-svg-import");
const json = require("@rollup/plugin-json");
const path = require("path");
const commonJs = require("@rollup/plugin-commonjs");
const {
  rollup
} = require("rollup");
const analyzer = require("rollup-plugin-analyzer");

const srcPath = path.join(__dirname, "..", "src");
const distPath = path.join(__dirname, "..", "dist");
const version = require("../package.json").version;

// console.log(srcPath); OK
// console.log(distPath); OKs


let babelConfig = {
  extensions: [".json", ".js", ".ts"],
  include: [path.join(srcPath, "/**/*")],
  exclude: [path.join(srcPath, "/**/*.d.ts")]
};
babelConfig.babelrc = false;
// babelConfig.babelHelpers = "bundled";
babelConfig.plugins = [
  "babel-plugin-add-module-exports",
  "babel-plugin-class-display-name",
  "@babel/plugin-transform-runtime",
  "@babel/proposal-class-properties"
  /*,
    "@babel/proposal-object-rest-spread",
    "@babel/plugin-transform-object-assign"*/
];
babelConfig.presets = [
  "@babel/preset-typescript",
  [
    "@babel/env",
    {
      // modules: "umd",
      // "useBuiltIns": "entry",
      // "corejs": 3,
      targets: {
        browsers: ["last 2 Chrome versions"]
      }
    }
  ]
];


const plugins = [
  babel(babelConfig),
  nodeResolve({
    extensions: [".json", ".js", ".ts"],
    preferBuiltins: false
  }),
  typescript({
    include: ["../**/src/**/*.ts"]
  }),
  // typescript({
  //   typescript: require("typescript"),
  //   objectHashIgnoreUnknownHack: true,
  //   verbosity: 3,
  //   cacheRoot: "./build/cache-rtp2",
  //   tsconfigDefaults: {
  //     compilerOptions: {
  //       declaration: true
  //     }
  //   },
  //   tsconfig: "tsconfig.json",
  //   tsconfigOverride: {
  //     compilerOptions: {
  //       declaration: false
  //     }
  //   }
  // }),
  // requireContext({
  //   include: ["**/*.ts"]
  // }),
  commonJs(),
  json({
    indent: " ",
    compact: true
  }),
  importSvg({
    stringify: true
  })
  // alias({
  //   entries: [{
  //       find: "pugRuntime",
  //       replacement: path.join(buildLibPath, "pug", "runtime.es.js")
  //     },
  //     {
  //       find: "marionext",
  //       replacement: path.join(tsLibraryPath, "marionext")
  //     },
  //     {
  //       find: "iscroll",
  //       replacement: path.join(themePath, "IScroll", "iscroll.js")
  //     },
  //     {
  //       find: "isotope",
  //       replacement: path.join(tsLibraryPath, "Isotope")
  //     }
  //   ]
  // }),
  // analyzer()
];

const rollupConfig = {
  input: [path.join(srcPath, "codex.ts")],
  output: {
    file: path.join(distPath, `editor.${version}.js`),
    format: "iife",
    name: "EditorJS",
    esModule: false,
  },
  /*onwarn({
    loc,
    frame,
    message
  }) {
    if (loc) {
      console.warn(`${loc.file} (${loc.line}:${loc.column}) ${message}`);
      if (frame) console.warn(frame);
    } else {
      console.warn(message);
    }
  },*/
  plugins: plugins
};

rollup({
  input: rollupConfig.input,
  plugins: rollupConfig.plugins
}).catch((err) => {
  throw err;
}).then((bundle) => {
  return bundle.write(rollupConfig.output)
}).catch((err) => {
  throw err;
}).then(() => {
  console.log("DONE");
})
