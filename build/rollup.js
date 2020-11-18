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
const inquirer = require("./inquirer");

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
babelConfig.plugins = [
  "babel-plugin-add-module-exports",
  "babel-plugin-class-display-name",
  "@babel/plugin-transform-runtime",
  "@babel/proposal-class-properties",
  "@babel/proposal-object-rest-spread",
  "@babel/plugin-transform-object-assign"
];
babelConfig.presets = [
  "@babel/preset-typescript",
  [
    "@babel/env",
    {
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
  typescript( //{
    //include: ["../**/src/**/*.ts"]
    /*}*/
  ),
  commonJs(),
  json({
    indent: " ",
    compact: true
  }),
  importSvg({
    stringify: true
  })
];

function getRollupConfig(name) {
  const input = ("core" === name) ? path.join(srcPath, "codex.ts") : path.join(srcPath, "plugin-paragraph.ts");
  const outModuleName = ("core" === name) ? "EditorJS" : "Paragraph";
  const outputFile = ("core" === name) ? path.join(distPath, `editor.${version}.js`) : path.join(distPath, `paragraph.${version}.js`);

  return {
    input: [input],
    output: {
      file: outputFile,
      format: "iife",
      name: outModuleName,
      esModule: false
    },
    onwarn({
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
    },
    plugins: plugins
  };
}

// const rollupConfig = {
//   input: [path.join(srcPath, "codex.ts")],
//   output: {
//     file: path.join(distPath, `editor.${version}.js`),
//     format: "iife",
//     name: "EditorJS",
//     esModule: false,
//   },
//   onwarn({
//     loc,
//     frame,
//     message
//   }) {
//     if (loc) {
//       console.warn(`${loc.file} (${loc.line}:${loc.column}) ${message}`);
//       if (frame) console.warn(frame);
//     } else {
//       console.warn(message);
//     }
//   },
//   plugins: plugins
// };

function choose() {
  return inquirer.prompt([{
    type: "checkbox",
    "name": "build",
    message: "select the components to build",
    choices: [{
        id: "core",
        name: "core"
      },
      {
        id: "paragraph",
        name: "paragraph"
      }
    ]
  }]);
}

module.exports = () => {
  return new Promise((resolve) => {
    return choose()
      .then((answer) => {
        console.log("answer: ", answer.build);
        const promises = [];
        answer.build.forEach((buildName) => {
          const rollupConfig = getRollupConfig(buildName);
          promises.push(new Promise((resolve) => {
            return rollup({
              input: rollupConfig.input,
              plugins: rollupConfig.plugins
            }).catch((err) => {
              throw new Error(`Erreur build ${rollupConfig.input} => ${rollupConfig.outputFile}:\n${err}`);
            }).then((bundle) => {
              return bundle.write(rollupConfig.output)
            }).catch((err) => {
              throw new Error(`Erreur dans l'écriture de ${rollupConfig.outputFile}:\n${err}`);
            }).then(resolve);

          }));
        });
        return Promise.all(promises);
      });
    return rollup({
      input: rollupConfig.input,
      plugins: rollupConfig.plugins
    }).catch((err) => {
      throw err;
    }).then((bundle) => {
      return bundle.write(rollupConfig.output)
    }).catch((err) => {
      throw err;
    }).then(() => {
      console.log("\n========\nRollup JS DONE\n========");
      resolve();
    });
  });
}
