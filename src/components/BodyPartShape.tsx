import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { Shape } from 'react-konva'
import type Konva from 'konva'
import { getPartDef } from '../parts/shapes'
import type { PartKind, Skeleton } from '../types'

export const PART_FILL = '#9a9aa0'
export const PART_STROKE = '#5c5c63'
export const PART_STROKE_W = 2.5

interface Props {
  kind: PartKind
  variant: Skeleton
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
  { kind, variant, ...rest },
  ref,
) {
  const def = getPartDef(kind, variant)
  const innerRef = useRef<Konva.Shape>(null)
  useImperativeHandle(ref, () => innerRef.current as Konva.Shape, [])

  // Custom sceneFunc shapes have no intrinsic bounds, so Konva's Transformer
  // would otherwise see a zero-size box at the origin (handles collapse to a
  // point, and transforming divides by zero -> the node jumps to 0,0). Report
  // the real centered bbox so the transform handles wrap the part correctly.
  useEffect(() => {
    const node = innerRef.current
    if (!node) return
    const { w, h } = def.bbox
    node.getSelfRect = () => ({ x: -w / 2, y: -h / 2, width: w, height: h })
    node.getLayer()?.batchDraw()
  }, [def])

  return (
    <Shape
      ref={innerRef}
      {...rest}
      sceneFunc={(ctx, shape) => def.draw(ctx as never, shape)}
      fill={PART_FILL}
      stroke={PART_STROKE}
      strokeWidth={PART_STROKE_W}
      lineJoin="round"
      hitStrokeWidth={0}
      perfectDrawEnabled={false}
    />
  )
})

export default BodyPartShape
