# cachebust Changelog

  - v1.1.3 (2023-08-05)
    - Bugfix: fixed bug where relative paths starting with `./` or `../` would have resolved to incorrect paths when adding the timestamp
    - Maintenance: updates depdendabot vulnerability

  - v1.1.2 (2023-08-05)
    - Bugfix: fixed bug where absolute paths (e.g., `href="/file.jpg"`) previously would have been converted to relative paths (e.g., `href="file.jpg?v=1234"`)
      - See [Github issue](https://github.com/kpander/cachebust/issues/6)

  - v1.1.1 (2023-05-13)
    - Fixes dependabot security vulnerability

  - v1.1.0 (2023-05-13)
    - Adds `Cachebust.css()` method to process `@import` rules in CSS files

  - v1.0.0 (2022-06-12)
    - Initial release
