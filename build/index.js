#! /usr/bin/env node

const buildStyles = require("./stylus");
const buildJs = require("./rollup");

buildJs()
  .then(() => {
    return buildStyles();
  })
  .catch((err) => {
    throw err;
  })
