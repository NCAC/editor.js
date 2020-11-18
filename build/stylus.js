const _ = require("lodash");
const fileSystem = require("fs");
const path = require("path");
const eventStreamMap = require("event-stream").map;
const vinylFileSystem = require("vinyl-fs");
const stylus = require("gulp-stylus");
const rename = require("gulp-rename");
const cleanCss = require("gulp-clean-css");
const csslint = require("gulp-csslint");

const postCss = require("gulp-postcss");

const autoprefixer = require("autoprefixer");
const mergeCssValues = require("postcss-merge-rules");
const mergeCssSelectors = require("./stylus/mergeSelectors");
const discardCssDuplicates = require("postcss-discard-duplicates");
const cssDeclarationSorter = require("css-declaration-sorter");
const mergeMediaQueries = require("css-mqpacker");

const version = require("../package.json").version;

const stylusPath = path.join(__dirname, "..", "src", "styles");
const distPath = path.join(__dirname, "..", "dist");

module.exports = () => {
  return new Promise((resolve, reject) => {
    const postCssPlugins = [
      discardCssDuplicates(),
      mergeCssSelectors(),
      mergeCssValues(),
      mergeMediaQueries(),
      cssDeclarationSorter({
        order: "concentric-css"
      }),
      autoprefixer({
        overrideBrowserslist: ["last 2 versions", "ios 6", "android 4"]
      })

    ];

    vinylFileSystem.src(path.join(stylusPath, "main.styl"))
      .pipe(
        eventStreamMap((file, callback) => {
          console.log("Beginning build css file", file.relative);
          return callback(null, file);
        })
      )
      .pipe(
        stylus()
      )
      .pipe(
        csslint()
      )
      .pipe(
        postCss(postCssPlugins)
      )
      .pipe(
        cleanCss({
          format: {
            breaks: {
              afterBlockBegins: true,
              afterRuleEnds: true,
              afterBlockEnds: true,
              afterProperty: true,
              afterRuleBegins: true
            },
            indentBy: 2,
            spaces: {
              aroundSelectorRelation: true,
              beforeBlockBegins: true,
              beforeValue: true
            }
          },
          level: 2
        })
      )
      .pipe(
        rename(`style.${version}.css`)
      )
      .pipe(
        vinylFileSystem.dest(distPath)
      )
      .on("error", (err) => {
        reject(err);
      })
      .on("end", resolve);

  });
}
