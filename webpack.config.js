const webpack = require('webpack')

const plugins = [
  new webpack.DefinePlugin({
    'process.env': {
      'NODE_ENV': JSON.stringify('production')
    }
  }),
  new webpack.NoEmitOnErrorsPlugin(),
  new webpack.optimize.UglifyJsPlugin({
    output: {
      comments: false
    },
    exclude: [
    ]
  }),
  new webpack.optimize.CommonsChunkPlugin({
    name: ['index', 'vendor']
  })
]

module.exports = {
  entry: {
    index: './index',
    vendor: './vendor'
  },
  output: {
    path: __dirname,
    filename: '[name].bundle.js'
  },
  plugins
}
