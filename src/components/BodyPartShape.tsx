import { forwardRef } from 'react'
import { Shape } from 'react-konva'
import type Konva from 'konva'
import { PART_BY_KIND } from '../parts/shapes'
import type { PartKind } from '../types'

export const PART_FILL = '#9a9aa0'
export const PART_STROKE = '#5c5c63'
export const PART_STROKE_W = 2.5

interface Props {
  kind: PartKind
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

/** Renders one mannequin part, drawn centered on its own origin so rotation/scale pivot at the center. */
const BodyPartShape = forwardRef<Konva.Shape, Props>(function BodyPartShape(
  { kind, ...rest },
  ref,
) {
  const def = PART_BY_KIND[kind]
  return (
    <Shape
      ref={ref}
      {...rest}
      sceneFunc={(ctx, shape) => def.draw(ctx as never, shape)}
      fill={PART_FILL}
      stroke={PART_STROKE}
      strokeWidth={PART_STROKE_W}
      lineJoin="round"
      // hit area follows the painted shape
      hitStrokeWidth={0}
      perfectDrawEnabled={false}
    />
  )
})

export default BodyPartShape
