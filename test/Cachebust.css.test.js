"use strict";
/*global describe, test, expect*/
/**
 * @file
 * Cachebust.css.test.js
 * Tests the css() method.
 */

const Cachebust = require("../Cachebust");
const Util = require("@kpander/nodejs-util");
const fs = require("fs");
const path = require("path");
const tmp = require("tmp");


const touch = function(path_base, filename) {
  Util.touch(path.join(path_base, filename));
  const stat = fs.statSync(path.join(path_base, filename));
  return stat.mtime.valueOf();
};

// ---------------------------------------------------------------------

describe("External file references are missing or don't exist:", () => {

test(
  `[CSS-Missing-001]
  Given
    - no arguments
  When
    - we build
  Then
    - boolean false should be returned
`.trim(), async() => {
  // Given...
  // When...
  const result = Cachebust.css();

  // Then...
  expect(result).toEqual(false);
});

test(
  `[CSS-Missing-002]
  Given
    - some css, with no @import rules referenced
  When
    - we build
  Then
    - the same css should be returned
`.trim(), async() => {
  // Given...
  const css = `
body { background: blue; }
`;

  // When...
  const result = Cachebust.css(css);

  // Then...
  expect(result).toEqual(css);
});

test(
  `[CSS-Missing-003]
  Given
    - markup with an @import reference, for a file that doesn't exist
  When
    - we build
  Then
    - the timestamp should include a marker indicating a non-existent file
`.trim(), async() => {
  // Given...
  const css = `
@import "myfile.css";
`;

  // When...
  const result = Cachebust.css(css);
  const regex = new RegExp(/"myfile.css\?ts=[0-9]+-m"/i);
  const match = result.match(regex);

  // Then...
  expect(match).not.toEqual(null);
});

});

// ---------------------------------------------------------------------

describe("Timestamp value:", () => {

test(
  `[CSS-Timestamp-001]
  Given
    - css @import to a css file that exists
  When
    - we build
  Then
    - the timestamp value should equal the last modified time of the file
`.trim(), async() => {
  // Given...
  const tmpobj = tmp.dirSync();
  const path_tmp = tmpobj.name;
  touch(path_tmp, "myimport.css");
  const stats = fs.statSync(path.join(path_tmp, "myimport.css"));

  const css = `
/*css file*/
@import "myimport.css";
`;

  // When...
  const result = Cachebust.css(css, { path: path_tmp });
  const regex = new RegExp(/"myimport.css\?ts=([0-9]+)"/i);
  const match = result.match(regex);

  // Then...
  expect(result).not.toEqual(css);
  expect(match).not.toEqual(null);
  expect(match[1]).toEqual(`${stats.mtime.valueOf()}`);
});

});

// ---------------------------------------------------------------------

describe("External file references exist:", () => {

test(
  `[CSS-Cachebust-001]
  Given
    - css with an @import css reference file that exists
  When
    - we build
  Then
    - the css import css reference should include a timestamp
`.trim(), async() => {
  // Given...
  const tmpobj = tmp.dirSync();
  const path_tmp = tmpobj.name;
  touch(path_tmp, "myfile.css");

  const css = `
/* my css */
@import "myfile.css";
`;

  // When...
  const result = Cachebust.css(css, { path: path_tmp });
  const regex = new RegExp(/"myfile.css\?ts=[0-9]+"/i);
  const match = result.match(regex);

  // Then...
  expect(result).not.toEqual(css);
  expect(match).not.toEqual(null);
});

test(
  `[CSS-Cachebust-002]
  Given
    - css with multiple css @import references, to files that exist
  When
    - we build
  Then
    - all css @import references should include a timestamp
`.trim(), async() => {
  // Given...
  const tmpobj = tmp.dirSync();
  const path_tmp = tmpobj.name;
  touch(path_tmp, "myfile1.css");
  touch(path_tmp, "myfile2.css");
  touch(path_tmp, "myfile3.css");

  const css = `
/* my css */
body { background: red; }
@import "myfile1.css";
p { outline: 1px solid red; }
@import "myfile2.css";
@import "myfile3.css";
`;

  // When...
  const result = Cachebust.css(css, { path: path_tmp });
  const regex1 = new RegExp(/"myfile1.css\?ts=[0-9]+"/i);
  const regex2 = new RegExp(/"myfile2.css\?ts=[0-9]+"/i);
  const regex3 = new RegExp(/"myfile3.css\?ts=[0-9]+"/i);
  const match1 = result.match(regex1);
  const match2 = result.match(regex2);
  const match3 = result.match(regex3);

  // Then...
  expect(match1).not.toEqual(null);
  expect(match2).not.toEqual(null);
  expect(match3).not.toEqual(null);
});
});

// ---------------------------------------------------------------------

describe("Various URL constructs:", () => {

test(
  `[CSS-URL-001]
  Given
    - @import with a css reference file that exists
    - the URL reference is an absolute URL
  When
    - we build
  Then
    - the css @import reference should stay as it was, without a timestamp
`.trim(), async() => {
  // Given...
  const url = "https://mytest.com/path1/file.css";
  const css = `
/* css */
@import "${url}";
`;

  // When...
  const result = Cachebust.css(css);

  // Then...
  expect(result).toEqual(css);
});

test(
  `[CSS-URL-002]
  Given
    - @import with a css reference file that exists
    - the URL reference has an existing hash fragment
  When
    - we build
  Then
    - the @import css reference should stay unchanged
`.trim(), async() => {
  // Given...
  const tmpobj = tmp.dirSync();
  const path_tmp = tmpobj.name;
  touch(path_tmp, "myfile.css");

  const css = `
/* css */
@import "myfile.css#fragment";
`;

  // When...
  const result = Cachebust.css(css, { path: path_tmp });
  const regex = new RegExp(/"myfile.css\?ts=[0-9]+#fragment"/i);
  const match = result.match(regex);

  // Then...
  expect(result).not.toEqual(css);
  expect(match).not.toEqual(null);
});

test(
  `[CSS-URL-003]
  Given
    - @import with a css reference file that exists
    - the URL reference has existing parameters
  When
    - we build
  Then
    - the css @import reference should include a timestamp
    - the URL should retain the original parameters
    - the timestamp parameter should be the last parameter
`.trim(), async() => {
  // Given...
  const tmpobj = tmp.dirSync();
  const path_tmp = tmpobj.name;
  touch(path_tmp, "myfile.css");

  const css = `
/* css */
@import "myfile.css?key1=val1&key2=val2";
`;

  // When...
  const result = Cachebust.css(css, { path: path_tmp });
  const regex = new RegExp(/"myfile.css\?key1=val1&key2=val2&ts=[0-9]+"/i);
  const match = result.match(regex);

  // Then...
  expect(result).not.toEqual(css);
  expect(match).not.toEqual(null);
});

test(
  `[CSS-URL-004]
  Given
    - @import with a css reference file that exists
    - the URL reference has existing parameters and a hash fragment
  When
    - we build
  Then
    - the @import's css reference should include a timestamp
    - the URL should retain the original parameters and hash fragment
`.trim(), async() => {
  // Given...
  const tmpobj = tmp.dirSync();
  const path_tmp = tmpobj.name;
  touch(path_tmp, "myfile.css");

  const css = `
/* css */
@import "myfile.css?key1=val1&key2=val2#hashvalue";
`;

  // When...
  const result = Cachebust.css(css, { path: path_tmp });
  const regex = new RegExp(/"myfile.css\?key1=val1&key2=val2&ts=[0-9]+#hashvalue"/i);
  const match = result.match(regex);

  // Then...
  expect(result).not.toEqual(css);
  expect(match).not.toEqual(null);
});

test(
  `[CSS-URL-005]
  Given
    - @import with a css reference file that exists
    - the URL reference has an existing timestamp parameter
  When
    - we build
  Then
    - the @import's css reference should include a timestamp
    - the URL should retain the original parameters
    - the timestamp parameter should be updated to the new value
`.trim(), async() => {
  // Given...
  const tmpobj = tmp.dirSync();
  const path_tmp = tmpobj.name;
  const ts = touch(path_tmp, "myfile.css");

  const css = `
/* css */
@import "myfile.css?ts=1234&key2=val2";
`;

  // When...
  const result = Cachebust.css(css, { path: path_tmp });
  const regex = new RegExp(/"myfile.css\?ts=[0-9]+&key2=val2"/i);
  const match = result.match(regex);
  const pos_unexpected = result.indexOf(`ts=1234`);
  const pos_expected = result.indexOf(`ts=${ts}`);

  // Then...
  expect(result).not.toEqual(css);
  expect(match).not.toEqual(null);
  expect(pos_unexpected).toEqual(-1);
  expect(pos_expected).toBeGreaterThan(-1);
});

});

