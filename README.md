[![Dependency Status](https://david-dm.org/plantain-00/simple-doc.svg)](https://david-dm.org/plantain-00/simple-doc)
[![devDependency Status](https://david-dm.org/plantain-00/simple-doc/dev-status.svg)](https://david-dm.org/plantain-00/simple-doc#info=devDependencies)
[![Build Status](https://travis-ci.org/plantain-00/simple-doc.svg?branch=master)](https://travis-ci.org/plantain-00/simple-doc)

# simple-doc
A Server-less and Build-less markdown document application.

# usage

+ download code from https://github.com/plantain-00/simple-doc-release
+ serve the static files(eg: 8000 port)
+ create and write your markdown document as `README.md`
+ open http://localhost:8000

# example

## h2 heading

### h3 heading

#### h4 heading

##### h5 heading

###### h6 heading

## paragraph

Paragraphs are separated by a blank line.

_italic_

*italic*

__bold__

**bold**

`monospace`

~~strike through~~

---

***

Bullet list:

* apples
* oranges
* pears

Numbered list:

1. apples
2. oranges
3. pears

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
