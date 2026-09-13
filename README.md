# Jayesh Jadhav — Portfolio

Personal portfolio for Jayesh Jadhav, DevOps & Cloud Engineer in Bangalore.
Static site (no build step): plain HTML/CSS/JS plus [Three.js](https://threejs.org/) (loaded from CDN) for the hero's floating infrastructure-graph scene.

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
