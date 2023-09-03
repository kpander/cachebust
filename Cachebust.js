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
const Filerefs = require("@kpander/filerefs-js");

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
      css = css.replaceAll(src, cachebusted);

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

    options.basePath = options.path;
    const refs = Filerefs.getFilerefs(html, options);

    Object.keys(refs).forEach(key => {
      const ref = refs[key];

      const timestamp = Cachebust._get_timestamp(ref.relativeBase, options);
      let url;
      let replace;
      if (ref.absolute) {
        // Use a real timestamp.
        url = new URL("http://test.com" + ref.absolute);
        url.search = ref.relativeParams;
        url.searchParams.set(options.key, timestamp);
      } else {
        // Use a fake timestamp.
        url = new URL("http://test.com" + ref.relative);
        url.searchParams.set(options.key, timestamp);
      }
      replace = ref.pre + ref.relativeBase + url.search + ref.relativeHash + ref.post;

      const search = key;
      html = html.replaceAll(search, replace);

    });

    return html;
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
    let filename = url.pathname;

    if (href[0] === "." && filename[0] !== ".") {
      filename = Cachebust._prefix_relatives(href, filename);
    }

    const timestamp = Cachebust._get_timestamp(filename, options);
    url.searchParams.set(options.key, timestamp);

    let newUrl = url.toString().replace("https://fakeurl.url/", "");

    // If the original href began with "/", the new one should as well.
    if (href[0] === "/" && newUrl[0] !== "/") newUrl = "/" + newUrl;

    // If the original href began with ".", the new one should as well.
    if (href[0] === "." && newUrl[0] !== ".") {
      newUrl = Cachebust._prefix_relatives(href, newUrl);
    }

    return newUrl;
  }

  /**
   * Take the relative path references from the beginning of href and apply
   * them to newUrl.
   */
  static _prefix_relatives(href, newUrl) {
    let prefixes = [];
    const parts = href.split("/");
    for (let i = 0; i < parts.length; i++) {
      let part = parts[i];
      if (part[0] === ".") {
        prefixes.push(part);
      } else {
        break;
      }
    }

    return prefixes.join("/") + "/" + newUrl;
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
