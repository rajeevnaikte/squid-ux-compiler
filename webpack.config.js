const path = require('path');

module.exports = {
  entry: './.uxui/uxui.js',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
  output: {
    filename: 'uxui.bundle.js',
    path: path.resolve('.uxui'),
  }
};
