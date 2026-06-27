import type { PartKind } from '../types'

/**
 * Minimal Konva 2D-context surface we use for custom scene drawing.
 * Konva's Context proxies the native CanvasRenderingContext2D and adds
 * fillStrokeShape() which applies the Shape's fill/stroke props.
 */
export interface DrawCtx {
  beginPath(): void
  closePath(): void
  moveTo(x: number, y: number): void
  lineTo(x: number, y: number): void
  arc(x: number, y: number, r: number, a0: number, a1: number, ccw?: boolean): void
  ellipse(
    x: number,
    y: number,
    rx: number,
    ry: number,
    rot: number,
    a0: number,
    a1: number,
    ccw?: boolean,
  ): void
  quadraticCurveTo(cx: number, cy: number, x: number, y: number): void
  fillStrokeShape(shape: unknown): void
}

export type Skeleton = 'masculine' | 'feminine'

export interface PartDef {
  kind: PartKind
  label: string
  /** bounding box, centered at origin */
  bbox: { w: number; h: number }
  draw: (ctx: DrawCtx, shape: unknown) => void
}

/** A tapered capsule (limb segment): rounded "joint" at each end, drawn centered at origin, axis vertical. */
function taperedCapsule(ctx: DrawCtx, len: number, rTop: number, rBottom: number) {
  const h = len / 2
  const d = len
  let s = (rTop - rBottom) / d
  s = Math.max(-0.999, Math.min(0.999, s))
  const psi = Math.asin(s)
  const cos = Math.cos(psi)
  const sin = Math.sin(psi)

  const left1 = { x: -rTop * cos, y: -h + rTop * sin }

  ctx.moveTo(left1.x, left1.y)
  // top cap: sweep over the top so the arc bulges upward
  ctx.arc(0, -h, rTop, Math.PI - psi, 2 * Math.PI + psi, false)
  // down the right tangent to the bottom joint
  ctx.lineTo(rBottom * cos, h + rBottom * sin)
  // bottom cap: bulge downward
  ctx.arc(0, h, rBottom, psi, Math.PI - psi, false)
  // back up the left tangent (closePath finishes it)
  ctx.closePath()
}

/** Rounded trapezoid centered at origin. Top edge width wTop, bottom edge width wBottom. */
function roundedTrapezoid(ctx: DrawCtx, wTop: number, wBottom: number, height: number, r: number) {
  const h = height / 2
  const tl = { x: -wTop / 2, y: -h }
  const tr = { x: wTop / 2, y: -h }
  const br = { x: wBottom / 2, y: h }
  const bl = { x: -wBottom / 2, y: h }

  ctx.moveTo(tl.x + r, tl.y)
  ctx.lineTo(tr.x - r, tr.y)
  ctx.quadraticCurveTo(tr.x, tr.y, tr.x, tr.y + r)
  ctx.lineTo(br.x, br.y - r)
  ctx.quadraticCurveTo(br.x, br.y, br.x - r, br.y)
  ctx.lineTo(bl.x + r, bl.y)
  ctx.quadraticCurveTo(bl.x, bl.y, bl.x, bl.y - r)
  ctx.lineTo(tl.x, tl.y + r)
  ctx.quadraticCurveTo(tl.x, tl.y, tl.x + r, tl.y)
  ctx.closePath()
}

/**
 * Waisted torso: chest tapers in to a pinched waist then flares slightly.
 * Built from two stacked smooth curves so the silhouette reads as an hourglass-ish
 * chest mass (used for the feminine ribcage/abdomen).
 */
function waistedTorso(ctx: DrawCtx, wChest: number, wWaist: number, height: number) {
  const h = height / 2
  const cx = wChest / 2
  const wx = wWaist / 2
  // start top-right, curve down to waist, across, and mirror up the left side
  ctx.moveTo(-cx + 8, -h)
  ctx.quadraticCurveTo(cx, -h, cx, -h + 18) // round top-right shoulder
  ctx.quadraticCurveTo(cx + 4, -h * 0.1, wx, h - 14) // chest -> waist (right)
  ctx.quadraticCurveTo(wx, h, wx - 8, h) // round bottom-right
  ctx.lineTo(-wx + 8, h)
  ctx.quadraticCurveTo(-wx, h, -wx, h - 14) // round bottom-left
  ctx.quadraticCurveTo(-cx - 4, -h * 0.1, -cx, -h + 18) // waist -> chest (left)
  ctx.quadraticCurveTo(-cx, -h, -cx + 8, -h) // round top-left shoulder
  ctx.closePath()
}

const LABELS: Record<PartKind, string> = {
  head: 'Head',
  neck: 'Neck',
  torso: 'Torso',
  pelvis: 'Pelvis',
  upperArm: 'Upper arm',
  forearm: 'Forearm',
  hand: 'Hand',
  thigh: 'Thigh',
  shin: 'Shin',
  foot: 'Foot',
  breast: 'Breast',
}

const make = (
  kind: PartKind,
  bbox: { w: number; h: number },
  path: (ctx: DrawCtx) => void,
): PartDef => ({
  kind,
  label: LABELS[kind],
  bbox,
  draw: (ctx, shape) => {
    ctx.beginPath()
    path(ctx)
    ctx.fillStrokeShape(shape)
  },
})

/** Masculine build — broad, blockier masses. */
const MASC: Partial<Record<PartKind, PartDef>> = {
  head: make('head', { w: 72, h: 92 }, (ctx) => taperedCapsule(ctx, 36, 36, 26)),
  neck: make('neck', { w: 50, h: 44 }, (ctx) => taperedCapsule(ctx, 18, 23, 25)),
  torso: make('torso', { w: 152, h: 192 }, (ctx) => roundedTrapezoid(ctx, 150, 118, 188, 34)),
  pelvis: make('pelvis', { w: 132, h: 116 }, (ctx) => roundedTrapezoid(ctx, 130, 92, 112, 30)),
  upperArm: make('upperArm', { w: 64, h: 156 }, (ctx) => taperedCapsule(ctx, 150, 29, 20)),
  forearm: make('forearm', { w: 50, h: 146 }, (ctx) => taperedCapsule(ctx, 140, 22, 14)),
  hand: make('hand', { w: 56, h: 78 }, (ctx) => taperedCapsule(ctx, 44, 16, 26)),
  thigh: make('thigh', { w: 88, h: 206 }, (ctx) => taperedCapsule(ctx, 198, 40, 27)),
  shin: make('shin', { w: 62, h: 196 }, (ctx) => taperedCapsule(ctx, 188, 28, 17)),
  foot: make('foot', { w: 50, h: 104 }, (ctx) => taperedCapsule(ctx, 80, 22, 9)),
}

/**
 * Feminine build — analysed from the female figure: smaller head & jaw, longer
 * slimmer neck, a narrower waisted ribcage, a wider/rounder pelvis (hips broader
 * than the shoulders), distinctly slimmer & more tapered limbs, smaller hands/feet,
 * plus a teardrop breast mass.
 */
const FEM: Partial<Record<PartKind, PartDef>> = {
  head: make('head', { w: 64, h: 86 }, (ctx) => taperedCapsule(ctx, 34, 31, 22)),
  neck: make('neck', { w: 40, h: 50 }, (ctx) => taperedCapsule(ctx, 24, 17, 19)),
  // chest mass that pinches to a defined waist
  torso: make('torso', { w: 132, h: 184 }, (ctx) => waistedTorso(ctx, 124, 78, 178)),
  // broad, rounded hips — wider than the ribcage
  pelvis: make('pelvis', { w: 156, h: 112 }, (ctx) => roundedTrapezoid(ctx, 152, 112, 106, 46)),
  upperArm: make('upperArm', { w: 52, h: 152 }, (ctx) => taperedCapsule(ctx, 148, 23, 15)),
  forearm: make('forearm', { w: 40, h: 142 }, (ctx) => taperedCapsule(ctx, 136, 17, 10)),
  hand: make('hand', { w: 46, h: 72 }, (ctx) => taperedCapsule(ctx, 42, 12, 21)),
  thigh: make('thigh', { w: 78, h: 204 }, (ctx) => taperedCapsule(ctx, 196, 34, 21)),
  shin: make('shin', { w: 52, h: 194 }, (ctx) => taperedCapsule(ctx, 186, 22, 12)),
  foot: make('foot', { w: 42, h: 98 }, (ctx) => taperedCapsule(ctx, 76, 17, 7)),
  // teardrop breast (rounded, pointing up toward the sternum)
  breast: make('breast', { w: 66, h: 60 }, (ctx) => taperedCapsule(ctx, 20, 12, 28)),
}

/** ordered list of parts shown in the tray for every figure */
export const BASE_KINDS: PartKind[] = [
  'head',
  'neck',
  'torso',
  'pelvis',
  'upperArm',
  'forearm',
  'hand',
  'thigh',
  'shin',
  'foot',
]

/** parts that only exist on the feminine build */
export const FEMININE_EXTRA_KINDS: PartKind[] = ['breast']

export function getPartDef(kind: PartKind, variant: Skeleton): PartDef {
  const set = variant === 'feminine' ? FEM : MASC
  return set[kind] ?? FEM[kind] ?? MASC[kind]!
}

/** A ready-made standing figure preset, positioned on the 900x1200 board (centered ~ 450,600). */
export interface PresetPart {
  kind: PartKind
  x: number
  y: number
  rotation?: number
  /** full konva scale incl. sign (negative = mirrored) */
  sx?: number
  sy?: number
}

const MASCULINE_FIGURE: PresetPart[] = [
  { kind: 'head', x: 450, y: 250 },
  { kind: 'neck', x: 450, y: 312 },
  { kind: 'torso', x: 450, y: 430, sx: 1.04 },
  { kind: 'pelvis', x: 450, y: 582, sx: 0.96 },
  { kind: 'upperArm', x: 358, y: 440, rotation: 8 },
  { kind: 'forearm', x: 346, y: 575, rotation: 4 },
  { kind: 'hand', x: 342, y: 670 },
  { kind: 'upperArm', x: 542, y: 440, rotation: -8, sx: -1 },
  { kind: 'forearm', x: 554, y: 575, rotation: -4, sx: -1 },
  { kind: 'hand', x: 558, y: 670, sx: -1 },
  { kind: 'thigh', x: 405, y: 730, rotation: 4 },
  { kind: 'shin', x: 398, y: 910, rotation: 2 },
  { kind: 'foot', x: 394, y: 1020 },
  { kind: 'thigh', x: 495, y: 730, rotation: -4, sx: -1 },
  { kind: 'shin', x: 502, y: 910, rotation: -2, sx: -1 },
  { kind: 'foot', x: 506, y: 1020, sx: -1 },
]

// The feminine parts are inherently slimmer / wider-hipped, so this preset only
// positions them (narrower shoulders, broader hips) without re-scaling.
const FEMININE_FIGURE: PresetPart[] = [
  { kind: 'head', x: 450, y: 252 },
  { kind: 'neck', x: 450, y: 312 },
  { kind: 'torso', x: 450, y: 422 },
  { kind: 'pelvis', x: 450, y: 558 },
  { kind: 'breast', x: 423, y: 400 },
  { kind: 'breast', x: 477, y: 400, sx: -1 },
  // narrower shoulders
  { kind: 'upperArm', x: 388, y: 430, rotation: 9 },
  { kind: 'forearm', x: 378, y: 558, rotation: 5 },
  { kind: 'hand', x: 374, y: 648 },
  { kind: 'upperArm', x: 512, y: 430, rotation: -9, sx: -1 },
  { kind: 'forearm', x: 522, y: 558, rotation: -5, sx: -1 },
  { kind: 'hand', x: 526, y: 648, sx: -1 },
  // broader hips
  { kind: 'thigh', x: 416, y: 712, rotation: 5 },
  { kind: 'shin', x: 408, y: 894, rotation: 2 },
  { kind: 'foot', x: 404, y: 1002 },
  { kind: 'thigh', x: 484, y: 712, rotation: -5, sx: -1 },
  { kind: 'shin', x: 492, y: 894, rotation: -2, sx: -1 },
  { kind: 'foot', x: 496, y: 1002, sx: -1 },
]

export function buildFigure(variant: Skeleton): PresetPart[] {
  return variant === 'feminine' ? FEMININE_FIGURE : MASCULINE_FIGURE
}
