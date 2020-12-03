module.exports = {
  plugins: [
    "babel-plugin-add-module-exports",
    "babel-plugin-class-display-name",
    "@babel/plugin-transform-runtime",
    "@babel/proposal-class-properties",
    "@babel/proposal-object-rest-spread",
    "@babel/plugin-transform-object-assign"
  ],
  presets: [
    "@babel/preset-typescript",
    [
      "@babel/env",
      {
        targets: {
          browsers: ["last 2 versions", "not dead", "> 0.2%"]
        }
      }
    ]
  ]
}
