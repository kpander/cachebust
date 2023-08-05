# cachebust

Applies last-modified timestamp to static asset references in HTML content.


## Installation

Ensure your project has a `.npmrc` file in the project root to tell `npm` where to find the package. Ensure the following line exists:
```
@kpander:registry=https://npm.pkg.github.com/
```

Then:
```
$ npm install @kpander/cachebust
```

## HTML Usage

As an example, assume the following files exist:

```
/path/to/files/css/styles.css
/path/to/files/js/scripts.js
/path/to/files/images/myimage.jpg
```

Sample code to demonstrate functionality:

```js
const Cachebust = require("@kpander/cachebust");

const html_src = `
<html>
<head>
  <link rel="stylesheet" href="/css/styles.css">
  <script src="js/scripts.js"></script>
</head>
<body>
  <p>Some html content</p>
  <img alt="test image" src="images/myimage.jpg">
</body>
</html>
`;

const options = {
  path: "/path/to/files"
};
const html_cachebusted = Cachebust.html(html_src, options);

console.log(html_cachebusted);
```

Output from example above:

```
<html>
<head>
  <link rel="stylesheet" href="/css/styles.css?ts=1655087450">
  <script src="js/scripts.js?ts=1653436075"></script>
</head>
<body>
  <p>Some html content</p>
  <img alt="test image" src="images/myimage.jpg?ts=1655782491">
</body>
</html>
```

## CSS Usage

As an example, assume the following files exist:

```
/path/to/files/css/styles.css
/path/to/files/css/component1/file1.css
/path/to/files/css/component2/file2.css
```

The contents of `styles.css` includes imports to the other 3 files.

Sample code to demonstrate functionality:

```js
const Cachebust = require("@kpander/cachebust");

const css_src = `
/* styles.css */
body { margin: 0; }
@import "./component1/file1.css";
div { outline: 1px solid red; }
@import "component2/file2.css?key=value";
p { color: green; }
@import url("https://something.com/external.css");
`;

const options = {
  path: "/path/to/files"
};
const css_cachebusted = Cachebust.css(css_src, options);

console.log(css_cachebusted);
```

Output from example above:

```
/* styles.css */
body { margin: 0; }
@import "./component1/file1.css?v=12345";
div { outline: 1px solid red; }
@import "component2/file2.css?key=value&v=12345";
p { color: green; }
@import url("https://something.com/external.css");
```


## Options

### Path to static files: `options.path`

You must provide the `path` option to indicate where the static files referenced in the HTML or CSS can be found on disk. If this path is not provided, all referenced static assets will be assumed to be missing.

```js
const Cachebust = require("@kpander/cachebust");
const options = {
  path: "/path/to/files"
};
const html_cachebusted = Cachebust.html("<p>my html string</p>", options);
```

### Query parameter name: `options.key`

The default query parameter is "ts". E.g., `filename.jpg?ts=1234567890`.

Use `options.key` to specify a different query parameter name.

```js
const Cachebust = require("@kpander/cachebust");
const options = {
  path: "/path/to/files",
  key: "my-custom-key",
};
const html_src = `<script src="filename.js"></script>`;
const html_cachebusted = Cachebust.html(html_src, options);
console.log(html_cachebusted);
```

```
<script src="filename.js?my-custom-key=1234567890"></script>
```


### Supported tag/attribute pairs: `options.tags` (for `html()` method only)

The default supported HTML tags and attributes are:

  - `<link>` and `href`
  - `<script>` and `src`
  - `<img>` and `src`
  - `<source>` and `srcset`
  - `<audio>` and `src`
  - `<video>` and `src`
  - `<track>` and `src`

You can override these and provide your own tag/attribute pairs to process.

If you provide custom pairs, they will override the defaults. For example, if you wanted to process a custom tag/attribute pair as well as (for example) the `img` and `src` pair, it might look something like this:

```js
const options = {
  path: "/path/to/files",
  tags: {
    "tagname": "attrname",
    "img": "src"
  }
};
const html_src = `<tagname attrname="filename.js"></tagname><img src="file.jpg">`;
const html_cachebusted = Cachebust.html(html_src, options);
```

## Watchouts

If the specified static file cannot be found (the file cannot be found on disk), then a timestamp will still be applied to the HTML reference, but it will end with "-m" ('missing'). The timestamp value will be 'now'. E.g.:
  - `<script src="js/missing.js?ts=1653436075-m"></script>`


## Maintainer

- Kendall Anderson (kpander@invisiblethreads.com)

