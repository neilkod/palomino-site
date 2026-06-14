# palomino-site – Claude Code guidance

Public landing page + build distribution for Palomino (app source is in the private `neilkod/palomino` repo; never copy app source code into this public repo).

- Live at https://palomino-app.com/ via GitHub Pages (custom domain, `CNAME` in repo root, master branch root, legacy build, `.nojekyll`).
- Single `index.html`, inline CSS, no build step or dependencies. Keep it that way.
- Builds ship as GitHub releases on THIS repo; the Download button links to `/releases/latest`. See README.md for the exact `gh release create` command and the screenshot regeneration pipeline.
- Design must match the app: `#0d0d0d` background, `#F5A623` amber accent, system font stack.
- No references to competing apps anywhere on the site.
- Writing style: no em dashes anywhere. Plain, direct sentences. Avoid AI-sounding copy: no "not X but Y" constructions, no punchy sentence fragments, no slogan-style headers.
- Push to GitHub after each change; Pages deploys from master.
