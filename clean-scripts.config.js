const childProcess = require('child_process')

module.exports = {
  build: [
    {
      js: [
        'file2variable-cli *.template.html -o variables.ts --html-minify',
        'tsc',
        'webpack --display-modules'
      ],
      css: {
        vendor: 'cleancss -o vendor.bundle.css ./node_modules/github-fork-ribbon-css/gh-fork-ribbon.css ./node_modules/tree-component/tree.min.css ./node_modules/highlight.js/styles/routeros.css',
        index: [
          'lessc index.less > index.css',
          'cleancss -o index.bundle.css index.css'
        ]
      },
      clean: 'rimraf *.bundle-*.js *.bundle-*.css'
    },
    'rev-static',
    [
      'sw-precache --config sw-precache.config.js --verbose',
      'uglifyjs service-worker.js -o service-worker.bundle.js'
    ],
    async () => {
      const { createServer } = require('http-server')
      const puppeteer = require('puppeteer')
      const server = createServer()
      server.listen(8000)
      const browser = await puppeteer.launch()
      const page = await browser.newPage()
      await page.goto(`http://localhost:8000`)
      await page.screenshot({ path: `screenshot.png`, fullPage: true })
      server.close()
      browser.close()
    }
  ],
  lint: {
    ts: `tslint "*.ts"`,
    js: `standard "**/*.config.js"`,
    less: `stylelint "index.less"`,
    export: `no-unused-export "*.ts" "index.less"`
  },
  test: [
    'tsc -p spec',
    process.env.APPVEYOR ? 'echo "skip karma test"' : 'karma start spec/karma.config.js',
    'git checkout screenshot.png',
    () => new Promise((resolve, reject) => {
      childProcess.exec('git status -s', (error, stdout, stderr) => {
        if (error) {
          reject(error)
        } else {
          if (stdout) {
            reject(new Error(`generated files doesn't match.`))
          } else {
            resolve()
          }
        }
      }).stdout.pipe(process.stdout)
    })
  ],
  fix: {
    ts: `tslint --fix "*.ts"`,
    js: `standard --fix "**/*.config.js"`,
    less: `stylelint --fix "index.less"`
  },
  release: `clean-release`,
  watch: {
    template: `file2variable-cli *.template.html -o variables.ts --html-minify --watch`,
    src: `tsc --watch`,
    webpack: `webpack --watch`,
    less: `watch-then-execute "index.less" --script "clean-scripts build[0].css.index"`,
    rev: `rev-static --watch`,
    sw: `watch-then-execute "vendor.bundle-*.js" "index.html" --script "clean-scripts build[2]"`
  }
}
