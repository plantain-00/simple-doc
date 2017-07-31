module.exports = {
  build: [
    'rimraf **/*.bundle-*.js *.bundle-*.css',
    'file2variable-cli *.template.html -o variables.ts --html-minify',
    'tsc',
    'lessc index.less > index.css',
    'cleancss -o vendor.bundle.css ./node_modules/github-fork-ribbon-css/gh-fork-ribbon.css ./node_modules/tree-component/tree.min.css ./node_modules/highlight.js/styles/routeros.css',
    'cleancss -o index.bundle.css index.css',
    'webpack --config webpack.config.js',
    'rev-static --config rev-static.config.js',
    'sw-precache --config sw-precache.config.js --verbose',
    'uglifyjs service-worker.js -o service-worker.bundle.js'
  ],
  lint: [
    `tslint "*.ts"`,
    `standard "**/*.config.js"`,
    `stylelint "**/*.less"`
  ],
  test: [
    'tsc -p spec',
    'karma start spec/karma.config.js'
  ],
  fix: [
    `standard --fix "**/*.config.js"`
  ],
  release: [
    `clean-release`
  ]
}
