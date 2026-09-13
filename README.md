# Jayesh Jadhav — Portfolio

Personal portfolio for Jayesh Jadhav, DevOps & Cloud Engineer in Bangalore.
Static site (no build step): plain HTML/CSS/JS plus [Three.js](https://threejs.org/) (loaded from CDN).

The hero is a small drivable scene — an original low-poly car and world (no external models or assets), inspired by the "explore instead of scroll" feel of sites like bruno-simon.com. Drive up to one of the five floating markers and press `E` (or tap **Open** on mobile) to jump straight to that section. There's also a "Skip the drive" button for anyone who'd rather just scroll — all the content is in normal, accessible HTML below the hero either way.

## Run locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static file server works — there's no build step or dependencies to install.

## Deploy

This repo is set up to deploy straight from GitHub Pages:

1. Push to `main`.
2. In the repo's **Settings → Pages**, set the source to the `main` branch, root folder.
3. The site will be live at `https://<username>.github.io/<repo>/`.

## Structure

```
index.html   — markup and content
style.css    — design tokens + layout
script.js    — hero 3D scene, dependency-graph sketch, nav + clock behaviour
```
