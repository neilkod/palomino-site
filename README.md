# palomino-site

Landing page and build distribution for [Palomino](https://neilkod.github.io/palomino-site/), a fast RAW photo culling app for macOS. The app source lives in the private `neilkod/palomino` repo; this repo is public so GitHub Pages can serve the site and releases can host builds.

**Live site:** https://neilkod.github.io/palomino-site/

## Publishing a build

Builds are shared as GitHub release assets on **this** repo (not the private app repo — release assets there wouldn't be publicly downloadable). The site's "Download for macOS" button points to `/releases/latest`, so publishing a release makes the button work with no site changes:

```sh
gh release create v0.1 Palomino.dmg --repo neilkod/palomino-site --title "Palomino v0.1"
```

For subsequent versions, bump the tag (`v0.2`, `v1.0`, …). The latest release is always what the button serves.

To replace a bad asset on an existing release:

```sh
gh release upload v0.1 Palomino.dmg --repo neilkod/palomino-site --clobber
```

## Updating the site

- Everything is in `index.html` — single file, inline CSS, no build step. Edit, commit, push to `master`; Pages redeploys automatically (~30s).
- Pages is configured to serve from `master` branch root. `.nojekyll` disables Jekyll processing.

## Updating screenshots

Source screenshots live in the app repo at `palomino/docs/screenshot-{preview,grid,export}.png`. They're too large for the web (6–7 MB each), so downscale into this repo:

```sh
for f in preview grid export; do
  sips -Z 1800 -s format jpeg -s formatOptions 82 \
    ../palomino/docs/screenshot-$f.png --out assets/screenshot-$f.jpg
done
```

## Design tokens

The site matches the app's design language: background `#0d0d0d`, panels `#161616`, amber accent `#F5A623`, system font stack (SF Pro on macOS).
