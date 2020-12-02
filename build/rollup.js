// const typescript = require("rollup-plugin-typescript2");
// const typescript = require("@rollup/plugin-typescript");
const typescript = require("./rollup-plugin-typescript");
const rollupTypescript = require("./rollup-plugin-ts");
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
const components = require("../components.json");

const rootPath = path.join(__dirname, "..");
const srcPath = path.join(__dirname, "..", "src");
const distPath = path.join(__dirname, "..", "dist");
const version = require("../package.json").version;
const fileSystem = require("fs-extra");

const babelConfig = {
  plugins: [
    "babel-plugin-add-module-exports",
    "babel-plugin-class-display-name",
    "@babel/plugin-transform-runtime",
    "@babel/proposal-class-properties",
    "@babel/proposal-object-rest-spread",
    "@babel/plugin-transform-object-assign"
  ]
};
/*babelConfig.presets = [
  // "@babel/preset-typescript",
  [
    "@babel/env",
    {
      targets: {
        browsers: ["last 2 Chrome versions"]
      }
    }
  ]
];*/


const plugins = [
  json({
    compact: true,
    preferConst: true,
    namedExports: false
  }),
  importSvg({
    stringify: true
  }),
  nodeResolve({
    extensions: [".js"],
    preferBuiltins: false
  }),
  commonJs(),
  rollupTypescript({
    transpiler: "babel"
  }),


  /*,
    babel(babelConfig)*/
];

function getRollupConfig(component) {
  const input = path.join(rootPath, component.js.input);
  const outModuleName = component.id;
  const outputFile = component.js.output;

  console.log("outputFile: ", outputFile);

  return {
    input: input,
    output: {
      // dir: distPath,
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



module.exports = () => {
  return new Promise((resolve, reject) => {
    const promises = [];
    // test
    const _components = [components[0]];

    components.forEach((component) => {
      const rollupConfig = getRollupConfig(component);
      promises.push(new Promise((resolve, reject) => {
        console.log("rollupConfig.input: ", rollupConfig.input);
        console.log("rollupConfig.output: ", rollupConfig.output);
        return rollup({
          input: rollupConfig.input,
          plugins: rollupConfig.plugins
        }).catch((err) => {
          fileSystem.outputJSONSync(path.join(rootPath, "test", "error.json"), err);
          let errorMessage = `\n`;
          Object.entries(err).forEach(([key, value]) => {
            if (typeof value !== 'string') {
              value = JSON.stringify(value);
            }
            errorMessage += `
              * ${key}: ${value}
            `
          });
          const error = new Error(
            `Erreur build ${component.js.input} => ${component.js.output}:
          ${errorMessage}`
          );
          reject(error);
        }).then((bundle) => {
          return bundle.write(rollupConfig.output)
        }).catch((err) => {
          let errorMessage = `\n`;
          Object.entries(err).forEach(([key, value]) => {
            if (typeof value !== 'string') {
              value = JSON.stringify(value);
            }
            errorMessage += `
              * ${key}: ${value}
            `
          });
          const error = new Error(`Erreur dans l'écriture de ${component.js.output}:\n${err}\n\${errorMessage}`);
          reject(error);
        }).then(resolve);

      }));
    });

    console.log(promises);

    return Promise
      .all(promises)
      .then(resolve)
      .catch(reject);

    // });
    // return rollup({
    //   input: rollupConfig.input,
    //   plugins: rollupConfig.plugins
    // }).catch((err) => {
    //   throw err;
    // }).then((bundle) => {
    //   return bundle.write(rollupConfig.output)
    // }).catch((err) => {
    //   throw err;
    // }).then(() => {
    //   console.log("\n========\nRollup JS DONE\n========");
    //   resolve();
    // });
  });
}
