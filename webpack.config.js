const path = require("path");

module.exports = {
  output: {
    library: "AxiosPhraseApp",
    libraryTarget: "umd",
    path: path.resolve(__dirname, "dist"),
    filename: "axios-phraseapp.js",
    globalObject: "this"
  },
  externals: {
    axios: "axios"
  },
  entry: "./lib/index.js",
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"]
          }
        }
      }
    ]
  }
};
