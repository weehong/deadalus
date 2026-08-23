# src/assets

Vite bundles assets under `src/assets` only when they are referenced by the application build.

Place files that should be served unchanged in the `public` directory and reference them with root-relative paths such as `/icon.png`.

Consider adding additional subdirectories to aid in organization.

Example:

- src/assets/images
  - src/assets/images/webp
  - src/assets/images/png
- src/assets/icons
- src/assets/fonts
- src/assets/locales
