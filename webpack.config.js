const path = require('path')

module.exports = {
  target: 'node',
  entry: 'src/index.ts',
  devtool: 'hidden-source-map',
  context: __dirname,
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    libraryTarget: 'umd',
    devtoolModuleFilenameTemplate: 'webpack-tabby-teleport:///[resource-path]',
  },
  resolve: {
    modules: ['.', 'src', 'node_modules'].map(x => path.join(__dirname, x)),
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: { configFile: path.resolve(__dirname, 'tsconfig.json') },
      },
      {
        test: /\.pug$/,
        use: ['apply-loader', 'pug-loader'],
      },
    ],
  },
  externals: [
    'fs',
    'child_process',
    'ngx-toastr',
    /^rxjs/,
    /^@angular/,
    /^@ng-bootstrap/,
    /^tabby-/,
  ],
}
