# simple-doc

[![Dependency Status](https://david-dm.org/plantain-00/simple-doc.svg)](https://david-dm.org/plantain-00/simple-doc)
[![devDependency Status](https://david-dm.org/plantain-00/simple-doc/dev-status.svg)](https://david-dm.org/plantain-00/simple-doc#info=devDependencies)
[![Build Status: Linux](https://travis-ci.org/plantain-00/simple-doc.svg?branch=master)](https://travis-ci.org/plantain-00/simple-doc)
[![Build Status: Windows](https://ci.appveyor.com/api/projects/status/github/plantain-00/simple-doc?branch=master&svg=true)](https://ci.appveyor.com/project/plantain-00/simple-doc/branch/master)
[![type-coverage](https://img.shields.io/badge/dynamic/json.svg?label=type-coverage&prefix=%E2%89%A5&suffix=%&query=$.typeCoverage.atLeast&uri=https%3A%2F%2Fraw.githubusercontent.com%2Fplantain-00%2Fsimple-doc%2Fmaster%2Fpackage.json)](https://github.com/plantain-00/simple-doc)

A Server-less and Build-less markdown document application.

## usage

1. download code from <https://github.com/plantain-00/simple-doc-release>
1. serve the static files(eg: 8000 port)
1. create and write your markdown document as `README.md`
1. open `http://localhost:8000`

## want to load other markdown file rather than `README.md`

+ (optional)open `http://localhost:8000?src=./other_doc.md`
+ (optional)your static file server should do something like `nginx`'s `try_files` for `.html` files, then open `http://localhost:8000/other_doc.html`

## example

### h3 heading

#### h4 heading

##### h5 heading

###### h6 heading

## paragraph

Paragraphs are separated by a blank line.

_italic_ *italic* __bold__ **bold**

`monospace`

~~strike through~~

---

Bullet list:

+ apples
+ oranges
+ pears

Numbered list:

1. apples
1. oranges
1. pears

A [link](http://example.com)

## code

```js
function foo(){
    return 1;
}
```

## table

head 1 | head 2
--- | ---
cell 1 | cell 2
cell 3 | cell 4

## block quote

> block quote
>> nested block quote

## footnote

[^footnote]

[^footnote]: footnote example

## 中文标题
