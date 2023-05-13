"use strict";
/*global describe, test, expect*/
/**
 * @file
 * Cachebust.test.js
 * Primarily tests the html() method.
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
  `[Missing-001]
  Given
    - no arguments
  When
    - we build
  Then
    - boolean false should be returned
`.trim(), async() => {
  // Given...
  // When...
  const result = Cachebust.html();

  // Then...
  expect(result).toEqual(false);
});

test(
  `[Missing-002]
  Given
    - some markup, with no static assets referenced
  When
    - we build
  Then
    - the same markup should be returned
`.trim(), async() => {
  // Given...
  const html = `
<html><head></head><body><div>something</div></body></html>
`;

  // When...
  const result = Cachebust.html(html);

  // Then...
  expect(result).toEqual(html);
});

test(
  `[Missing-003]
  Given
    - markup with a css reference, for a file that doesn't exist
  When
    - we build
  Then
    - the timestamp should include a marker indicating a non-existent file
`.trim(), async() => {
  // Given...
  const html = `
<link rel="stylesheet" type="text/css" href="myfile.css"/>
`;

  // When...
  const result = Cachebust.html(html);
  const regex = new RegExp(/"myfile.css\?ts=[0-9]+-m"/i);
  const match = result.match(regex);

  // Then...
  expect(match).not.toEqual(null);
});

});

// ---------------------------------------------------------------------

describe("Timestamp value:", () => {

test(
  `[Timestamp-001]
  Given
    - markup with a css reference file that exists
  When
    - we build
  Then
    - the timestamp value should equal the last modified time of the file
`.trim(), async() => {
  // Given...
  const tmpobj = tmp.dirSync();
  const path_tmp = tmpobj.name;
  touch(path_tmp, "myfile.css");
  const stats = fs.statSync(path.join(path_tmp, "myfile.css"));

  const html = `
<link rel="stylesheet" type="text/css" href="myfile.css"/>
`;

  // When...
  const result = Cachebust.html(html, { path: path_tmp });
  const regex = new RegExp(/"myfile.css\?ts=([0-9]+)"/i);
  const match = result.match(regex);

  // Then...
  expect(result).not.toEqual(html);
  expect(match).not.toEqual(null);
  expect(match[1]).toEqual(`${stats.mtime.valueOf()}`);
});

});

// ---------------------------------------------------------------------

describe("HTML on multiple lines:", () => {

test(
  `[HTML-001]
  Given
    - markup with a css reference file that exists
    - where the HTML element is on multiple lines
  When
    - we build
  Then
    - the markup's css reference should include a timestamp
`.trim(), async() => {
  // Given...
  const tmpobj = tmp.dirSync();
  const path_tmp = tmpobj.name;
  touch(path_tmp, "myfile.css");

  const html = `
<link rel="stylesheet" 
  type="text/css" 
  href="myfile.css"
/>
`;

  // When...
  const result = Cachebust.html(html, { path: path_tmp });
  const regex = new RegExp(/"myfile.css\?ts=[0-9]+"/i);
  const match = result.match(regex);

  // Then...
  expect(result).not.toEqual(html);
  expect(match).not.toEqual(null);
});

});

// ---------------------------------------------------------------------

describe("External file references exist:", () => {

test(
  `[Cachebust-001]
  Given
    - markup with a css reference file that exists
  When
    - we build
  Then
    - the markup's css reference should include a timestamp
`.trim(), async() => {
  // Given...
  const tmpobj = tmp.dirSync();
  const path_tmp = tmpobj.name;
  touch(path_tmp, "myfile.css");

  const html = `
<link rel="stylesheet" type="text/css" href="myfile.css"/>
`;

  // When...
  const result = Cachebust.html(html, { path: path_tmp });
  const regex = new RegExp(/"myfile.css\?ts=[0-9]+"/i);
  const match = result.match(regex);

  // Then...
  expect(result).not.toEqual(html);
  expect(match).not.toEqual(null);
});

test(
  `[Cachebust-002]
  Given
    - markup with multiple css references, to files that exist
  When
    - we build
  Then
    - all css references should include a timestamp
`.trim(), async() => {
  // Given...
  const tmpobj = tmp.dirSync();
  const path_tmp = tmpobj.name;
  touch(path_tmp, "myfile1.css");
  touch(path_tmp, "myfile2.css");
  touch(path_tmp, "myfile3.css");

  const html = `
<link rel="stylesheet" type="text/css" href="myfile1.css"/>
<link rel="stylesheet" type="text/css" href="myfile2.css"/>
<p>something</p>
<link rel="stylesheet" type="text/css" href="myfile3.css"/>
`;

  // When...
  const result = Cachebust.html(html, { path: path_tmp });
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
  `[URL-001]
  Given
    - markup with a css reference file that exists
    - the URL reference is an absolute URL
  When
    - we build
  Then
    - the markup's css reference should stay as it was, without a timestamp
`.trim(), async() => {
  // Given...
  const url = "https://mytest.com/path1/path?key=value";
  const html = `
<link rel="stylesheet" type="text/css" href="${url}"/>
`;

  // When...
  const result = Cachebust.html(html);

  // Then...
  expect(result).toEqual(html);
});

test(
  `[URL-002]
  Given
    - markup with a css reference file that exists
    - the URL reference has an existing hash fragment
  When
    - we build
  Then
    - the markup's css reference should include a timestamp
    - the URL should retain the hash fragment
`.trim(), async() => {
  // Given...
  const tmpobj = tmp.dirSync();
  const path_tmp = tmpobj.name;
  touch(path_tmp, "myfile.css");

  const html = `
<link rel="stylesheet" type="text/css" href="myfile.css#fragment"/>
`;

  // When...
  const result = Cachebust.html(html, { path: path_tmp });
  const regex = new RegExp(/"myfile.css\?ts=[0-9]+#fragment"/i);
  const match = result.match(regex);

  // Then...
  expect(result).not.toEqual(html);
  expect(match).not.toEqual(null);
});

test(
  `[URL-003]
  Given
    - markup with a css reference file that exists
    - the URL reference has existing parameters
  When
    - we build
  Then
    - the markup's css reference should include a timestamp
    - the URL should retain the original parameters
    - the timestamp parameter should be the last parameter
`.trim(), async() => {
  // Given...
  const tmpobj = tmp.dirSync();
  const path_tmp = tmpobj.name;
  touch(path_tmp, "myfile.css");

  const html = `
<link rel="stylesheet" type="text/css" href="myfile.css?key1=val1&key2=val2"/>
`;

  // When...
  const result = Cachebust.html(html, { path: path_tmp });
  const regex = new RegExp(/"myfile.css\?key1=val1&key2=val2&ts=[0-9]+"/i);
  const match = result.match(regex);

  // Then...
  expect(result).not.toEqual(html);
  expect(match).not.toEqual(null);
});

test(
  `[URL-004]
  Given
    - markup with a css reference file that exists
    - the URL reference has existing parameters and a hash fragment
  When
    - we build
  Then
    - the markup's css reference should include a timestamp
    - the URL should retain the original parameters and hash fragment
`.trim(), async() => {
  // Given...
  const tmpobj = tmp.dirSync();
  const path_tmp = tmpobj.name;
  touch(path_tmp, "myfile.css");

  const html = `
<link rel="stylesheet" type="text/css" href="myfile.css?key1=val1&key2=val2#hashvalue"/>
`;

  // When...
  const result = Cachebust.html(html, { path: path_tmp });
  const regex = new RegExp(/"myfile.css\?key1=val1&key2=val2&ts=[0-9]+#hashvalue"/i);
  const match = result.match(regex);

  // Then...
  expect(result).not.toEqual(html);
  expect(match).not.toEqual(null);
});

test(
  `[URL-005]
  Given
    - markup with a css reference file that exists
    - the URL reference has an existing timestamp parameter
  When
    - we build
  Then
    - the markup's css reference should include a timestamp
    - the URL should retain the original parameters
    - the timestamp parameter should be updated to the new value
`.trim(), async() => {
  // Given...
  const tmpobj = tmp.dirSync();
  const path_tmp = tmpobj.name;
  const ts = touch(path_tmp, "myfile.css");

  const html = `
<link rel="stylesheet" type="text/css" href="myfile.css?ts=1234&key2=val2"/>
`;

  // When...
  const result = Cachebust.html(html, { path: path_tmp });
  const regex = new RegExp(/"myfile.css\?ts=[0-9]+&key2=val2"/i);
  const match = result.match(regex);
  const pos_unexpected = result.indexOf(`ts=1234`);
  const pos_expected = result.indexOf(`ts=${ts}`);

  // Then...
  expect(result).not.toEqual(html);
  expect(match).not.toEqual(null);
  expect(pos_unexpected).toEqual(-1);
  expect(pos_expected).toBeGreaterThan(-1);
});

});

// ---------------------------------------------------------------------

describe("Multiple HTML elements and attributes:", () => {

test(
  `[Elements-001]
  Given
    - markup with an img reference file that exists
  When
    - we build
  Then
    - the markup's img reference should include the timestamp
`.trim(), async() => {
  // Given...
  const tmpobj = tmp.dirSync();
  const path_tmp = tmpobj.name;
  touch(path_tmp, "myfile.jpg");

  const html = `
<img alt="something" src="myfile.jpg"/>
`;

  // When...
  const result = Cachebust.html(html, { path: path_tmp });
  const regex = new RegExp(/src="myfile.jpg\?ts=[0-9]+"/);
  const match = result.match(regex);

  // Then...
  expect(match).not.toEqual(null);
});

test(
  `[Elements-002]
  Given
    - markup with a script reference file that exists
  When
    - we build
  Then
    - the markup's script reference should include the timestamp
`.trim(), async() => {
  // Given...
  const tmpobj = tmp.dirSync();
  const path_tmp = tmpobj.name;
  touch(path_tmp, "myfile.js");

  const html = `
<script src="myfile.js"/>
`;

  // When...
  const result = Cachebust.html(html, { path: path_tmp });
  const regex = new RegExp(/src="myfile.js\?ts=[0-9]+"/);
  const match = result.match(regex);

  // Then...
  expect(match).not.toEqual(null);
});

test(
  `[Elements-003]
  Given
    - markup with a source reference file that exists
  When
    - we build
  Then
    - the markup's source reference should include the timestamp
`.trim(), async() => {
  // Given...
  const tmpobj = tmp.dirSync();
  const path_tmp = tmpobj.name;
  touch(path_tmp, "myfile.png");

  const html = `
<picture>
<source srcset="myfile.png"/>
</picture>
`;

  // When...
  const result = Cachebust.html(html, { path: path_tmp });
  const regex = new RegExp(/srcset="myfile.png\?ts=[0-9]+"/);
  const match = result.match(regex);

  // Then...
  expect(match).not.toEqual(null);
});

test(
  `[Elements-004]
  Given
    - markup with a audio reference file that exists
  When
    - we build
  Then
    - the markup's audio reference should include the timestamp
`.trim(), async() => {
  // Given...
  const tmpobj = tmp.dirSync();
  const path_tmp = tmpobj.name;
  touch(path_tmp, "myfile.ogg");

  const html = `
<audio src="myfile.ogg"/>
`;

  // When...
  const result = Cachebust.html(html, { path: path_tmp });
  const regex = new RegExp(/src="myfile.ogg\?ts=[0-9]+"/);
  const match = result.match(regex);

  // Then...
  expect(match).not.toEqual(null);
});

test(
  `[Elements-005]
  Given
    - markup with a track reference file that exists
  When
    - we build
  Then
    - the markup's track reference should include the timestamp
`.trim(), async() => {
  // Given...
  const tmpobj = tmp.dirSync();
  const path_tmp = tmpobj.name;
  touch(path_tmp, "myfile.vtt");

  const html = `
<video>
<track src="myfile.vtt"/>
</video>
`;

  // When...
  const result = Cachebust.html(html, { path: path_tmp });
  const regex = new RegExp(/src="myfile.vtt\?ts=[0-9]+"/);
  const match = result.match(regex);

  // Then...
  expect(match).not.toEqual(null);
});

test(
  `[Elements-006]
  Given
    - markup with a video reference file that exists
  When
    - we build
  Then
    - the markup's video reference should include the timestamp
`.trim(), async() => {
  // Given...
  const tmpobj = tmp.dirSync();
  const path_tmp = tmpobj.name;
  touch(path_tmp, "myfile.mov");

  const html = `
<video src="myfile.mov"/>
`;

  // When...
  const result = Cachebust.html(html, { path: path_tmp });
  const regex = new RegExp(/src="myfile.mov\?ts=[0-9]+"/);
  const match = result.match(regex);

  // Then...
  expect(match).not.toEqual(null);
});

});

// ---------------------------------------------------------------------

describe("Options can be configured:", () => {

test(
  `[Options-001]
  Given
    - markup with a css reference file that exists
  When
    - we build, and provide a custom query parameter to use for the timestamp
  Then
    - the markup's css reference should include a timestamp
    - the timestamp should use the provided custom query parameter
`.trim(), async() => {
  // Given...
  const tmpobj = tmp.dirSync();
  const path_tmp = tmpobj.name;
  touch(path_tmp, "myfile.css");

  const html = `
<link rel="stylesheet" type="text/css" href="myfile.css" />
`;
  const options = { path: path_tmp, key: "zappa" };

  // When...
  const result = Cachebust.html(html, options);
  const regex = new RegExp(/"myfile.css\?zappa=[0-9]+"/i);
  const match = result.match(regex);

  // Then...
  expect(result).not.toEqual(html);
  expect(match).not.toEqual(null);
});

test(
  `[Options-002]
  Given
    - markup with a css reference file that exists using link/href
    - markup with a css reference file that exists using a custom tag/attr
  When
    - we build, and provide custom tag/attr parameters to process
  Then
    - the custom tag/attr should be processed with a timestamp
    - other (non-custom) tag/attrs should not be processed
`.trim(), async() => {
  // Given...
  const tmpobj = tmp.dirSync();
  const path_tmp = tmpobj.name;
  touch(path_tmp, "myfile1.css");
  touch(path_tmp, "myfile2.css");

  const html = `
<link rel="stylesheet" type="text/css" href="myfile1.css" />
<customlink rel="stylesheet" type="text/css" customhref="myfile2.css" />
`;
  const options = { path: path_tmp, tags: { "customlink": "customhref" }};

  // When...
  const result = Cachebust.html(html, options);
  const regex1 = new RegExp(/"myfile1.css\?ts=[0-9]+"/i);
  const regex2 = new RegExp(/"myfile2.css\?ts=[0-9]+"/i);
  const match1 = result.match(regex1);
  const match2 = result.match(regex2);

  // Then...
  expect(result).not.toEqual(html);
  expect(match1).toEqual(null);
  expect(match2).not.toEqual(null);
});

});

