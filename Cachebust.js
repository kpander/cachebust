/**
 * @file
 * Cachebust.js
 *
 * Should likely use an HTML library like cheerio to parse HTML, rather than
 * the brutal regex'ing we're doing... *but* I really don't want to mess with
 * the HTML and cheerio will 'clean' the markup (which we don't want).
 */
const fs = require("fs");
const path = require("path");
const Util = require("@kpander/nodejs-util");

module.exports = class Cachebust {

  /**
   * Return the default query parameter key to use for the timestamp.
   */
  static get KEY() {
    return "ts";
  }

  /**
   * Return the default tag/attribute pairs to process.
   */
  static get TAGS() {
    return {
      "link": "href",
      "script": "src",
      "img": "src",
      "source": "srcset",
      "audio": "src",
      "video": "src",
      "track": "src",
    };
  }

  /**
   * Cachebust @import references in the given CSS.
   *
   * Expect options.path to be the base path from which source filenames can
   * be found (for the purpose of getting their last modified time).
   *
   * @param string css to process
   * @return string css with cachebusted static @import references
   */
  static css(css, options = {}) {
    if (typeof css !== "string") return false;

    options.path = options.path || "";
    options.key = options.key || Cachebust.KEY;

    const regex = /@import\s+["']((?!http)([^"']+\.css)([\?#].*)?)["'];/g;

    [ ...css.matchAll(regex) ].forEach(result => {
      const src = result[0];
      const url = result[1]

      const href = Cachebust._cachebust_href(url, options);
      const cachebusted = `@import "${href}";`;
      css = Util.replaceAll(css, src, cachebusted);

    });

    return css;
  }

  /**
   * Cachebust static references in the given html.
   *
   * Expect options.path to be the base path from which source filenames can
   * be found (for the purpose of getting their last modified time).
   *
   * @param string html to process
   * @return string html with cachebusted static asset references
   */
  static html(html, options = {}) {
    if (typeof html !== "string") return false;

    options.path = options.path || "";
    options.key = options.key || Cachebust.KEY;
    options.tags = options.tags || Cachebust.TAGS;

    Object.keys(options.tags).forEach(tag => {
      const attr = options.tags[tag];
      html = Cachebust._process_tag_references(html, options, tag, attr);
    });

    return html;
  }

  static _process_tag_references(html, options, tag, attr) {
    const regex = new RegExp(`<${tag}[^>]+${attr}="(.*?)"`, "ig");
    const matches = html.match(regex);
    if (matches === null) return html;

    matches.forEach(html_match => {
      html = Cachebust._process_tag_reference(html, options, html_match, attr);
    });

    return html;
  }

  /**
   * Take the matching html tag with the file reference, and apply the
   * cachebusting timestamp to the referenced URL. If the URL is an absolute
   * reference (e.g., with a protocol and domain), don't change it.
   *
   * @param string html_match, containing one file match
   *   = the matching string we want to cachebust, e.g.:
   *     '<link rel="stylesheet" type="text/css" href="myfile.css"'
   */
  static _process_tag_reference(html, options, html_match, attr) {
    const regex = new RegExp(`\\b` + attr + `="(.*?)"`, "i");
    const match = html_match.match(regex);

    if (match === null) return html;

    const href = match[1];
    if (Cachebust._is_absolute_url(href)) return html;

    const url_replace = Cachebust._cachebust_href(href, options);
    const search = `${attr}="${href}"`;
    const replace = `${attr}="${url_replace}"`;
    const cachebusted = Util.replaceAll(html_match, search, replace);

    return Util.replaceAll(html, html_match, cachebusted);
  }

  /**
   * Given the contents of an href/src attribute, apply a timestamp query
   * parameter, with the last modified time of the referenced file.
   *
   * @param string href e.g., "path/to/file.css?key=value"
   * @return string href e.g., "path/to/file.css?key=value&ts=123456789"
   */
  static _cachebust_href(href, options) {
    const url = new URL(href, "https://fakeurl.url");
    const filename = url.pathname;

    const timestamp = Cachebust._get_timestamp(filename, options);
    url.searchParams.set(options.key, timestamp);

    let newUrl = url.toString().replace("https://fakeurl.url/", "");

    // If the original href began with "/", the new one should as well.
    if (href[0] === "/" && newUrl[0] !== "/") newUrl = "/" + newUrl;

    return newUrl;
  }

  /**
   * Determine if the given href is an absolute url or not. In this case,
   * "absolute" means it has a protocol and domain.
   *
   * @param string href e.g., "https://test.com/path"
   * @return boolean
   */
  static _is_absolute_url(href) {
    try {
      new URL(href);
      return true;
    } catch(err) {
      return false;
    }
  }

  /**
   * Get a timestamp string for the given filename. Search for the file
   * relative to our base path (in this._config.path).
   *
   * If the file doesn't exist, return the current stamp and append "-m"
   * (meaning, "missing file").
   *
   * @param string filename e.g., "myfile.css"
   * @return string timestamp e.g., "1654646722102"
   */
  static _get_timestamp(filename, options) {
    const file = path.join(options.path, filename);
    const exists = fs.existsSync(file);

    if (exists && options.path !== "") {
      const stats = fs.statSync(file);
      return `${stats.mtime.valueOf()}`;
    } else {
      const timestamp = Date.now();
      return `${timestamp}-m`;
    }
  }

}
