const path = require("path");

module.export = {
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", { loader: 'css-loader', options: { esModule: false }}],
      },
    ],
  },
};
