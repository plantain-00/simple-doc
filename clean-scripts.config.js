module.exports = {
  build: [
    {
      js: [
        'file2variable-cli *.template.html -o variables.ts --html-minify',
        'tsc',
        'webpack --display-modules --config webpack.config.js'
      ],
      css: {
        vendor: 'cleancss -o vendor.bundle.css ./node_modules/github-fork-ribbon-css/gh-fork-ribbon.css ./node_modules/tree-component/tree.min.css ./node_modules/highlight.js/styles/routeros.css',
        index: [
          'lessc index.less > index.css',
          'cleancss -o index.bundle.css index.css'
        ]
      },
      clean: 'rimraf **/*.bundle-*.js *.bundle-*.css'
    },
    'rev-static --config rev-static.config.js',
    'sw-precache --config sw-precache.config.js --verbose',
    'uglifyjs service-worker.js -o service-worker.bundle.js'
  ],
  lint: {
    ts: `tslint "*.ts"`,
    js: `standard "**/*.config.js"`,
    less: `stylelint "**/*.less"`,
    export: `no-unused-export "*.ts"`
  },
  test: [
    'tsc -p spec',
    'karma start spec/karma.config.js'
  ],
  fix: {
    ts: `tslint --fix "*.ts"`,
    js: `standard --fix "**/*.config.js"`,
    less: `stylelint --fix "**/*.less"`
  },
  release: `clean-release`,
  watch: `watch-then-execute "*.ts" "*.less" "*.template.html" --exclude "variables.ts" --script "npm run build"`
}
