const { Service, executeScriptAsync } = require('clean-scripts')
const { watch } = require('watch-then-execute')

const tsFiles = `"*.ts" "spec/**/*.ts" "screenshots/**/*.ts"`
const jsFiles = `"*.config.js" "spec/**/*.config.js"`
const lessFiles = `"*.less"`

const isDev = process.env.NODE_ENV === 'development'

const templateCommand = 'file2variable-cli --config file2variable.config.js'
const tscCommand = 'tsc'
const webpackCommand = 'webpack'
const revStaticCommand = 'rev-static'
const cssCommand = [
  'lessc index.less > index.css',
  `postcss index.css -o index.postcss.css`,
  'cleancss -o index.bundle.css index.postcss.css'
]
const swCommand = isDev ? undefined : [
  'sw-precache --config sw-precache.config.js --verbose',
  'uglifyjs service-worker.js -o service-worker.bundle.js'
]

module.exports = {
  build: [
    {
      js: [
        templateCommand,
        tscCommand,
        webpackCommand
      ],
      css: {
        vendor: isDev ? undefined : 'cleancss -o vendor.bundle.css ./node_modules/github-fork-ribbon-css/gh-fork-ribbon.css ./node_modules/tree-component/dist/tree.min.css ./node_modules/highlight.js/styles/routeros.css',
        index: cssCommand
      },
      clean: 'rimraf *.bundle-*.js *.bundle-*.css'
    },
    revStaticCommand,
    swCommand
  ],
  lint: {
    ts: `tslint ${tsFiles}`,
    js: `standard ${jsFiles}`,
    less: `stylelint ${lessFiles}`,
    export: `no-unused-export ${tsFiles} ${lessFiles}`,
    commit: `commitlint --from=HEAD~1`,
    markdown: `markdownlint README.md`
  },
  test: [
    'tsc -p spec',
    'karma start spec/karma.config.js'
  ],
  fix: {
    ts: `tslint --fix ${tsFiles}`,
    js: `standard --fix ${jsFiles}`,
    less: `stylelint --fix ${lessFiles}`
  },
  watch: {
    template: `${templateCommand} --watch`,
    src: `${tscCommand} --watch`,
    webpack: `${webpackCommand} --watch`,
    less: () => watch(['*.less'], [], () => executeScriptAsync(cssCommand)),
    rev: `${revStaticCommand} --watch`,
    sw: () => watch(['vendor.bundle-*.js', 'index.html'], [], () => executeScriptAsync(swCommand))
  },
  screenshot: [
    new Service(`http-server -p 8000`),
    `tsc -p screenshots`,
    `node screenshots/index.js`
  ]
}
