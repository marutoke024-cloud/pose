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

const make = (
  kind: PartKind,
  label: string,
  bbox: { w: number; h: number },
  path: (ctx: DrawCtx) => void,
): PartDef => ({
  kind,
  label,
  bbox,
  draw: (ctx, shape) => {
    ctx.beginPath()
    path(ctx)
    ctx.fillStrokeShape(shape)
  },
})

export const PART_DEFS: PartDef[] = [
  make('head', 'Head', { w: 72, h: 92 }, (ctx) => taperedCapsule(ctx, 36, 36, 26)),
  make('neck', 'Neck', { w: 50, h: 44 }, (ctx) => taperedCapsule(ctx, 18, 23, 25)),
  make('torso', 'Torso', { w: 152, h: 192 }, (ctx) => roundedTrapezoid(ctx, 150, 118, 188, 34)),
  make('pelvis', 'Pelvis', { w: 132, h: 116 }, (ctx) => roundedTrapezoid(ctx, 130, 92, 112, 30)),
  make('upperArm', 'Upper arm', { w: 64, h: 156 }, (ctx) => taperedCapsule(ctx, 150, 29, 20)),
  make('forearm', 'Forearm', { w: 50, h: 146 }, (ctx) => taperedCapsule(ctx, 140, 22, 14)),
  make('hand', 'Hand', { w: 56, h: 78 }, (ctx) => taperedCapsule(ctx, 44, 16, 26)),
  make('thigh', 'Thigh', { w: 88, h: 206 }, (ctx) => taperedCapsule(ctx, 198, 40, 27)),
  make('shin', 'Shin', { w: 62, h: 196 }, (ctx) => taperedCapsule(ctx, 188, 28, 17)),
  make('foot', 'Foot', { w: 50, h: 104 }, (ctx) => taperedCapsule(ctx, 80, 22, 9)),
]

export const PART_BY_KIND: Record<PartKind, PartDef> = PART_DEFS.reduce(
  (acc, def) => {
    acc[def.kind] = def
    return acc
  },
  {} as Record<PartKind, PartDef>,
)

/** A ready-made standing figure preset, positioned on the 900x1200 board (centered ~ 450,600). */
export interface PresetPart {
  kind: PartKind
  x: number
  y: number
  rotation?: number
  scaleX?: number
  scale?: number
}

export const FULL_BODY_PRESET: PresetPart[] = [
  { kind: 'head', x: 450, y: 250 },
  { kind: 'neck', x: 450, y: 312 },
  { kind: 'torso', x: 450, y: 430 },
  { kind: 'pelvis', x: 450, y: 580 },
  // left arm (viewer left)
  { kind: 'upperArm', x: 360, y: 440, rotation: 8 },
  { kind: 'forearm', x: 348, y: 575, rotation: 4 },
  { kind: 'hand', x: 344, y: 670 },
  // right arm
  { kind: 'upperArm', x: 540, y: 440, rotation: -8, scaleX: -1 },
  { kind: 'forearm', x: 552, y: 575, rotation: -4, scaleX: -1 },
  { kind: 'hand', x: 556, y: 670, scaleX: -1 },
  // left leg
  { kind: 'thigh', x: 405, y: 730, rotation: 4 },
  { kind: 'shin', x: 398, y: 910, rotation: 2 },
  { kind: 'foot', x: 394, y: 1020 },
  // right leg
  { kind: 'thigh', x: 495, y: 730, rotation: -4, scaleX: -1 },
  { kind: 'shin', x: 502, y: 910, rotation: -2, scaleX: -1 },
  { kind: 'foot', x: 506, y: 1020, scaleX: -1 },
]
