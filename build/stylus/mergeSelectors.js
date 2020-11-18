"use strict";

// Postcss api docs: https://github.com/postcss/postcss/blob/master/docs/api.md

var postcss = require("postcss"),
  list = postcss.list,
  DEFAULT_MATCHER = {
    selectorFilter: /\..*/,
    promote: true
  },
  DEFAULT_OPTIONS = {
    matchers: {
      default: DEFAULT_MATCHER
    }
  };


function byDecl(node) {
  return (node || this).type === "decl";
}


function serializeDeclarations(rule) {
  var nodes = rule.nodes ? rule.nodes.filter(byDecl).sort().map(String) : [],
    declaration = nodes.join(";").replace(/\s+/g, "");

  if (rule.parent.type === "atrule") {
    declaration = rule.parent.toString() + ":" + declaration;
  }

  return declaration;
}


// Usage: array.filter(unique)
function unique(value, index, self) {
  return self.indexOf(value) === index;
}


function selectorMerger() {

  var cache = {};

  return function analyseRule(ruleB) {

    var declaration = serializeDeclarations(ruleB),
      ruleA,
      selectorsA,
      selectorsB,
      mergedSelectors;

    if (cache[declaration]) {

      ruleA = cache[declaration];
      selectorsA = list.comma(ruleA.selector);
      selectorsB = list.comma(ruleB.selector);
      mergedSelectors = selectorsA.concat(selectorsB).filter(unique).join(", ");

      ruleA.selector = mergedSelectors;
      ruleB.remove();

    } else {

      cache[declaration] = ruleB;

    }

    return;

  };

}


module.exports = postcss.plugin("postcss-merge-selectors", function (opts) {

  opts = Object.assign({}, DEFAULT_OPTIONS, opts);
  var matchers = Object.keys(opts.matchers || DEFAULT_OPTIONS.matchers);
  if (!matchers.length) {
    throw "postcss-merge-selectors: opts.matchers was specified but appears to be empty.";
    return;
  }

  matchers.forEach(function (name) {
    return opts.matchers[name] = Object.assign({
      name: name,
      debug: opts.debug,
      selectorFilter: DEFAULT_MATCHER.selectorFilter
    }, DEFAULT_MATCHER, opts.matchers[name]);
  });

  return function (css) {

    return matchers.forEach(function (name) {

      var matcher = opts.matchers[name];
      css.walkRules(matcher.selectorFilter, selectorMerger(matcher));

    });

  };

});
