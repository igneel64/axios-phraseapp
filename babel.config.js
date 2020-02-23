const plugins = ["@babel/plugin-transform-modules-commonjs"];
if (process.env.NODE_ENV !== "production") {
  plugins.push(
    "@babel/plugin-transform-regenerator",
    "@babel/plugin-transform-runtime"
  );
}

module.exports = {
  presets: ["@babel/preset-env"],
  plugins
};
