# おまかせ — OMAKASE · Pose Atari Studio

A minimal, web-based **2D mannequin layout editor** for quickly blocking out the
*atari* (アタリ / rough underlay) of an illustration.

Instead of lasso-painting body masses every time, you drag, rotate, scale and
flip **pre-made semi-transparent mannequin parts** (head, torso, pelvis, limbs,
hands, feet…) on top of a reference image, then export a **transparent PNG**
to drop into Clip Studio Paint (or anything else) as an underlay layer.

> The app never analyses the image or auto-poses anything. Parts stay fully
> independent — no rigging, no IK, no parent/child linking. Just blocks, your
> hand, and speed.

## Features

- **Animated moodboard gallery** as the home page — your saved works as a
  minimal, motion-driven thumbnail board.
- **Parts tray** — add head, neck, torso, pelvis, upper arm, forearm, hand,
  thigh, shin, foot, or a ready-made **full figure** preset.
- **Per-part transform** — move, scale (corner handles), rotate (top handle),
  flip H/V, duplicate, delete, bring to front / send to back.
- **Reference underlay** — load any JPG/PNG, adjust its opacity, show/hide it.
- **Global parts opacity** — overlapping masses naturally darken at the joints.
- **Transparent PNG export** at 2× for use as a sketch underlay.
- **Touch friendly** for phone / tablet.
- Works are saved locally (localStorage) — no account, no cloud.

## Keyboard shortcuts (editor)

| Key | Action |
| --- | --- |
| `Delete` / `Backspace` | Delete selected part |
| `⌘/Ctrl + D` | Duplicate selected |
| `H` / `V` | Flip horizontal / vertical |
| `]` / `[` | Bring to front / send to back |
| `Esc` | Deselect |

## Stack

- React 18 + TypeScript + Vite
- react-konva 18 / Konva 9 (canvas, transform handles, PNG export)
- react-router-dom (hash routing, so it works on static hosts)

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build (base: /)
npm run build:gh   # production build for GitHub Pages (base: /pose/)
```

## Deploy (GitHub Pages)

A workflow at `.github/workflows/deploy.yml` builds with the `/pose/` base and
publishes to GitHub Pages on every push to the deploy branch.

To turn it on once: **Repo → Settings → Pages → Build and deployment →
Source: GitHub Actions**. The site will be served at
`https://<user>.github.io/pose/`.
