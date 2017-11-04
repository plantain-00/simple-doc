const { Service, execAsync, executeScriptAsync } = require('clean-scripts')
const { watch } = require('watch-then-execute')

const tsFiles = `"*.ts" "spec/**/*.ts" "screenshots/**/*.ts"`
const jsFiles = `"*.config.js" "spec/**/*.config.js"`
const lessFiles = `"*.less"`

const templateCommand = 'file2variable-cli *.template.html -o variables.ts --html-minify'
const tscCommand = 'tsc'
const webpackCommand = 'webpack --display-modules'
const revStaticCommand = 'rev-static'
const cssCommand = [
  'lessc index.less > index.css',
  `postcss index.css -o index.postcss.css`,
  'cleancss -o index.bundle.css index.postcss.css'
]
const swCommand = [
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
        vendor: 'cleancss -o vendor.bundle.css ./node_modules/github-fork-ribbon-css/gh-fork-ribbon.css ./node_modules/tree-component/tree.min.css ./node_modules/highlight.js/styles/routeros.css',
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
    export: `no-unused-export ${tsFiles} ${lessFiles}`
  },
  test: [
    'tsc -p spec',
    'karma start spec/karma.config.js',
    async () => {
      const { stdout } = await execAsync('git status -s')
      if (stdout) {
        console.log(stdout)
        throw new Error(`generated files doesn't match.`)
      }
    }
  ],
  fix: {
    ts: `tslint --fix ${tsFiles}`,
    js: `standard --fix ${jsFiles}`,
    less: `stylelint --fix ${lessFiles}`
  },
  release: `clean-release`,
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
