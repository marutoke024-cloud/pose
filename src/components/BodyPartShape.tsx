import { forwardRef } from 'react'
import { Group, Rect, Shape } from 'react-konva'
import type Konva from 'konva'
import { getPartDef } from '../parts/shapes'
import type { PartKind, Skeleton } from '../types'

export const PART_FILL = '#9a9aa0'
export const PART_STROKE = '#5c5c63'
export const PART_STROKE_W = 2.5

interface Props {
  kind: PartKind
  variant: Skeleton
  id?: string
  x: number
  y: number
  rotation?: number
  scaleX?: number
  scaleY?: number
  draggable?: boolean
  opacity?: number
  listening?: boolean
  onClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void
  onTap?: (e: Konva.KonvaEventObject<Event>) => void
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void
  onTransformEnd?: (e: Konva.KonvaEventObject<Event>) => void
}

/**
 * One mannequin part, drawn centered on its own origin so rotation/scale pivot at the center.
 *
 * The part is a Group containing:
 *  - an invisible hit Rect spanning the part's bounding box. This gives the Group real
 *    bounds (so the Transformer's box & math are correct — no zero-size divide-by-zero
 *    jump-to-corner) AND makes the whole part easy to grab/drag, even small ones.
 *  - the visual Shape (non-listening) painted via the part's sceneFunc.
 */
const BodyPartShape = forwardRef<Konva.Group, Props>(function BodyPartShape(
  { kind, variant, x, y, rotation, scaleX, scaleY, draggable, opacity, listening, id, ...handlers },
  ref,
) {
  const def = getPartDef(kind, variant)
  const { w, h } = def.bbox
  return (
    <Group
      ref={ref}
      id={id}
      x={x}
      y={y}
      rotation={rotation}
      scaleX={scaleX}
      scaleY={scaleY}
      opacity={opacity}
      draggable={draggable}
      listening={listening}
      {...handlers}
    >
      <Rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        fill="#000"
        opacity={0}
        listening={listening !== false}
      />
      <Shape
        listening={false}
        sceneFunc={(ctx, shape) => def.draw(ctx as never, shape)}
        fill={PART_FILL}
        stroke={PART_STROKE}
        strokeWidth={PART_STROKE_W}
        lineJoin="round"
        perfectDrawEnabled={false}
      />
    </Group>
  )
})

export default BodyPartShape
