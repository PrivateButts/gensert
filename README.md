# Gensert — Custom Gridfinity Insert Generator

A client-side Vue 3 + Vite web app that turns a photo of an object into a custom Gridfinity bin insert (STL), all in the browser. Upload a photo → trace its outline on a scaled canvas → generate and preview the 3D model via in-browser OpenSCAD → download the STL for printing.

## How it works

1. **Upload** (`src/components/ImageUpload.vue`) — pick a photo; an object URL is passed to the app state.
2. **Trace** (`src/components/DrawingCanvas.vue`) — draw a scale line (known mm length) and a closed outline over the photo. The scale calibrates px → mm; the outline becomes a scaled SVG Blob.
3. **Generate** (`src/components/PreviewModel.vue`) — the SVG plus Gridfinity parameters (grid x/y/z, lip style, magnets, screws, etc.) are staged into the OpenSCAD WASM filesystem and rendered with `callMain([... -D key=value, -o output.stl])`. Note: generation is synchronous and may briefly freeze the tab.
4. **Preview & download** (`src/components/STLViewer.vue`) — the resulting STL renders in a Three.js viewer; download it for slicing/printing.

## Getting started

Requires Node + npm.

```sh
npm install
npm run dev      # local HMR dev server
npm run build    # production build → dist/
npm run preview  # serve the production build
```

## Project layout

| Path | Purpose |
|---|---|
| `src/App.vue`, `src/main.js` | App entry and root orchestrator |
| `src/components/` | `ImageUpload`, `DrawingCanvas`, `PreviewModel`, `STLViewer` |
| `src/lib/alt-wasm/` | Active OpenSCAD WASM runtime |
| `public/openscad/` | Gridfinity `.scad` sources, fetched at runtime |
| `public/viewstl/` | Vendored Three.js STL viewer |
| `examples/` | Sample photos |

See [AGENTS.md](./AGENTS.md) for architecture, conventions, and gotchas.

## License

MIT — see [LICENSE](./LICENSE).
